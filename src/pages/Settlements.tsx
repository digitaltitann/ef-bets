import { useState, useEffect } from 'react'
import './Settlements.css'

interface Bet {
  id: number
  team1: string
  team2: string
  amount: number
  winner: string | null
}

interface Expense {
  id: number
  paidBy: string
  description: string
  amount: number
  splitAmong: string[]
}

interface Session {
  id: number
  name: string
  bets: Bet[]
  expenses?: Expense[]
  createdAt: string
}

interface PlayerBalance {
  name: string
  won: number
  lost: number
  expensesPaid: number
  expensesOwed: number
  net: number
}

interface Debt {
  from: string
  to: string
  amount: number
}

const CURRENT_SESSION_KEY = 'ef-bets-current-session'
const SESSIONS_KEY = 'ef-bets-sessions'

function Settlements() {
  const [bets, setBets] = useState<Bet[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [sessionName, setSessionName] = useState('')
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null)
  const [allPlayers, setAllPlayers] = useState<string[]>([])
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [expensePaidBy, setExpensePaidBy] = useState('')
  const [expenseDescription, setExpenseDescription] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseSplitAmong, setExpenseSplitAmong] = useState<string[]>([])

  // Load current session on mount
  useEffect(() => {
    const currentSession = localStorage.getItem(CURRENT_SESSION_KEY)
    if (currentSession) {
      const session: Session = JSON.parse(currentSession)
      setCurrentSessionId(session.id)
      setSessionName(session.name)
      setBets(session.bets || [])
      setExpenses(session.expenses || [])

      // Extract all unique players from bets
      const players = new Set<string>()
      ;(session.bets || []).forEach((bet: Bet) => {
        bet.team1.split('+').forEach(p => players.add(p.trim()))
        bet.team2.split('+').forEach(p => players.add(p.trim()))
      })
      setAllPlayers(Array.from(players).sort())
    }
  }, [])

  const updateSession = (newBets: Bet[], newExpenses: Expense[]) => {
    if (!currentSessionId) return

    const currentSession = localStorage.getItem(CURRENT_SESSION_KEY)
    if (currentSession) {
      const session = JSON.parse(currentSession)
      session.bets = newBets
      session.expenses = newExpenses
      localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(session))

      // Also update in sessions list
      const sessionsData = localStorage.getItem(SESSIONS_KEY)
      if (sessionsData) {
        const allSessions = JSON.parse(sessionsData)
        const updatedSessions = allSessions.map((s: Session) =>
          s.id === currentSessionId ? { ...s, bets: newBets, expenses: newExpenses } : s
        )
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(updatedSessions))
      }
    }
  }

  const addExpense = () => {
    if (!expensePaidBy || !expenseAmount || expenseSplitAmong.length === 0) return

    const newExpense: Expense = {
      id: Date.now(),
      paidBy: expensePaidBy,
      description: expenseDescription.trim() || 'Expense',
      amount: parseFloat(expenseAmount),
      splitAmong: expenseSplitAmong
    }

    const newExpenses = [...expenses, newExpense]
    setExpenses(newExpenses)
    updateSession(bets, newExpenses)

    // Reset form
    setExpensePaidBy('')
    setExpenseDescription('')
    setExpenseAmount('')
    setExpenseSplitAmong([])
    setShowExpenseModal(false)
  }

  const deleteExpense = (expenseId: number) => {
    const newExpenses = expenses.filter(e => e.id !== expenseId)
    setExpenses(newExpenses)
    updateSession(bets, newExpenses)
  }

  const togglePlayerInSplit = (player: string) => {
    if (expenseSplitAmong.includes(player)) {
      setExpenseSplitAmong(expenseSplitAmong.filter(p => p !== player))
    } else {
      setExpenseSplitAmong([...expenseSplitAmong, player])
    }
  }

  const selectAllForSplit = () => {
    setExpenseSplitAmong([...allPlayers])
  }

  // Calculate player balances
  const calculateBalances = (): PlayerBalance[] => {
    const balances: { [key: string]: PlayerBalance } = {}

    // Initialize all players
    allPlayers.forEach(player => {
      balances[player] = {
        name: player,
        won: 0,
        lost: 0,
        expensesPaid: 0,
        expensesOwed: 0,
        net: 0
      }
    })

    // Calculate bet winnings/losses
    // bet.amount is per person - each loser loses that amount
    const settledBets = bets.filter(b => b.winner)
    settledBets.forEach(bet => {
      const team1Players = bet.team1.split('+').map(p => p.trim())
      const team2Players = bet.team2.split('+').map(p => p.trim())
      const winners = bet.winner === bet.team1 ? team1Players : team2Players
      const losers = bet.winner === bet.team1 ? team2Players : team1Players

      // Each loser loses the bet amount (per person)
      losers.forEach(loser => {
        if (balances[loser]) {
          balances[loser].lost += bet.amount
        }
      })

      // Winners split the total pot from all losers
      const totalPot = bet.amount * losers.length
      const amountPerWinner = totalPot / winners.length

      winners.forEach(winner => {
        if (balances[winner]) {
          balances[winner].won += amountPerWinner
        }
      })
    })

    // Calculate expenses
    expenses.forEach(expense => {
      if (balances[expense.paidBy]) {
        balances[expense.paidBy].expensesPaid += expense.amount
      }

      const perPerson = expense.amount / expense.splitAmong.length
      expense.splitAmong.forEach(player => {
        if (balances[player]) {
          balances[player].expensesOwed += perPerson
        }
      })
    })

    // Calculate net
    Object.values(balances).forEach(balance => {
      balance.net = balance.won - balance.lost + balance.expensesPaid - balance.expensesOwed
    })

    return Object.values(balances).sort((a, b) => b.net - a.net)
  }

  // Simplify debts - who owes who
  const calculateDebts = (balances: PlayerBalance[]): Debt[] => {
    const debts: Debt[] = []

    // Create copies of balances
    const creditors: { name: string; amount: number }[] = []
    const debtors: { name: string; amount: number }[] = []

    balances.forEach(b => {
      if (b.net > 0.01) {
        creditors.push({ name: b.name, amount: b.net })
      } else if (b.net < -0.01) {
        debtors.push({ name: b.name, amount: -b.net })
      }
    })

    // Sort by amount
    creditors.sort((a, b) => b.amount - a.amount)
    debtors.sort((a, b) => b.amount - a.amount)

    // Match debtors to creditors
    let i = 0
    let j = 0

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i]
      const creditor = creditors[j]

      const amount = Math.min(debtor.amount, creditor.amount)

      if (amount > 0.01) {
        debts.push({
          from: debtor.name,
          to: creditor.name,
          amount: Math.round(amount * 100) / 100
        })
      }

      debtor.amount -= amount
      creditor.amount -= amount

      if (debtor.amount < 0.01) i++
      if (creditor.amount < 0.01) j++
    }

    return debts
  }

  const balances = calculateBalances()
  const debts = calculateDebts(balances)
  const settledBetsCount = bets.filter(b => b.winner).length
  const pendingBetsCount = bets.filter(b => !b.winner).length

  return (
    <div className="settlements">
      <h2 className="page-title">Settlements</h2>

      {sessionName && (
        <div className="session-indicator">
          Session: <span>{sessionName}</span>
        </div>
      )}

      <div className="stats-row">
        <div className="stat">
          <span className="stat-value">{settledBetsCount}</span>
          <span className="stat-label">Settled</span>
        </div>
        <div className="stat">
          <span className="stat-value">{pendingBetsCount}</span>
          <span className="stat-label">Pending</span>
        </div>
        <div className="stat">
          <span className="stat-value">{expenses.length}</span>
          <span className="stat-label">Expenses</span>
        </div>
      </div>

      {allPlayers.length === 0 ? (
        <p className="empty-state">No bets yet. Add some bets first!</p>
      ) : (
        <>
          {/* Player Balances */}
          <div className="section">
            <h3 className="section-title">Player Standings</h3>
            <div className="balances-list">
              {balances.map(balance => (
                <div key={balance.name} className={`balance-card ${balance.net > 0 ? 'positive' : balance.net < 0 ? 'negative' : ''}`}>
                  <span className="player-name">{balance.name}</span>
                  <span className={`player-net ${balance.net > 0 ? 'positive' : balance.net < 0 ? 'negative' : ''}`}>
                    {balance.net >= 0 ? '+' : ''}{balance.net.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Who Owes Who */}
          {debts.length > 0 && (
            <div className="section">
              <h3 className="section-title">Who Owes Who</h3>
              <div className="debts-list">
                {debts.map((debt, index) => (
                  <div key={index} className="debt-card">
                    <span className="debt-from">{debt.from}</span>
                    <span className="debt-arrow">pays</span>
                    <span className="debt-to">{debt.to}</span>
                    <span className="debt-amount">${debt.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {debts.length === 0 && settledBetsCount > 0 && (
            <div className="section">
              <p className="all-settled">All settled up!</p>
            </div>
          )}

          {/* Expenses */}
          <div className="section">
            <div className="section-header">
              <h3 className="section-title">Expenses</h3>
              <button className="add-expense-btn" onClick={() => setShowExpenseModal(true)}>
                + Add
              </button>
            </div>
            {expenses.length === 0 ? (
              <p className="no-expenses">No expenses added</p>
            ) : (
              <div className="expenses-list">
                {expenses.map(expense => (
                  <div key={expense.id} className="expense-card">
                    <div className="expense-info">
                      <span className="expense-description">{expense.description}</span>
                      <span className="expense-detail">
                        {expense.paidBy} paid ${expense.amount.toFixed(2)}
                      </span>
                      <span className="expense-split">
                        Split: {expense.splitAmong.join(', ')}
                      </span>
                    </div>
                    <button className="delete-btn" onClick={() => deleteExpense(expense.id)}>
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div className="modal-overlay" onClick={() => setShowExpenseModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Add Expense</h3>

            <div className="form-group">
              <label>Paid by</label>
              <div className="player-select">
                {allPlayers.map(player => (
                  <button
                    key={player}
                    className={`player-chip ${expensePaidBy === player ? 'selected' : ''}`}
                    onClick={() => setExpensePaidBy(player)}
                  >
                    {player}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                value={expenseDescription}
                onChange={(e) => setExpenseDescription(e.target.value)}
                placeholder="e.g., Drinks, Food"
                className="modal-input"
              />
            </div>

            <div className="form-group">
              <label>Amount</label>
              <div className="amount-row">
                <span className="currency">$</span>
                <input
                  type="number"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="0.00"
                  className="modal-input amount"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="form-group">
              <div className="split-header">
                <label>Split among</label>
                <button className="select-all-btn" onClick={selectAllForSplit}>
                  Select All
                </button>
              </div>
              <div className="player-select">
                {allPlayers.map(player => (
                  <button
                    key={player}
                    className={`player-chip ${expenseSplitAmong.includes(player) ? 'selected' : ''}`}
                    onClick={() => togglePlayerInSplit(player)}
                  >
                    {player}
                  </button>
                ))}
              </div>
              {expenseSplitAmong.length > 0 && expenseAmount && (
                <p className="split-preview">
                  ${(parseFloat(expenseAmount) / expenseSplitAmong.length).toFixed(2)} each
                </p>
              )}
            </div>

            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => setShowExpenseModal(false)}>
                Cancel
              </button>
              <button
                className="modal-btn confirm"
                onClick={addExpense}
                disabled={!expensePaidBy || !expenseAmount || expenseSplitAmong.length === 0}
              >
                Add Expense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settlements
