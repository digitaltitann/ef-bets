# EF Bets - Project Context

## Overview
EF Bets is a PWA with group/team utility tools, built with React, TypeScript, and Vite.

## Tech Stack
- React 18 + TypeScript
- Vite with vite-plugin-pwa
- React Router for navigation
- CSS files per component (not CSS modules)

## Project Structure
- `src/components/` - Reusable components (Layout)
- `src/pages/` - Page components (Home, TeamPicker, Profile)
- `src/index.css` - Global styles and CSS variables
- `vite.config.ts` - Vite + PWA configuration

## Modules
1. **Team Picker** (`/teams`) - Random team generator
   - Add participants by name
   - Choose number of teams
   - Shuffle and distribute randomly
   - Export results to CSV

## Conventions
- Mobile-first design approach
- Dark theme using CSS variables (--primary, --surface, --text, etc.)
- Each component has a corresponding .css file
- Bottom navigation pattern for mobile UX

## Commands
- `npm run dev` - Start dev server
- `npm run build` - Production build
- `npm run preview` - Preview production build
- `vercel --prod` - Deploy to production

## Deployment
- Hosted on Vercel: https://ef-bets.vercel.app
