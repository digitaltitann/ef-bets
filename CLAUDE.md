# EF Bets - Project Context

## Overview
EF Bets is a PWA sports betting app built with React, TypeScript, and Vite.

## Tech Stack
- React 18 + TypeScript
- Vite with vite-plugin-pwa
- React Router for navigation
- CSS modules (plain CSS files per component)

## Project Structure
- `src/components/` - Reusable components (Layout)
- `src/pages/` - Page components (Home, Bets, Profile)
- `src/index.css` - Global styles and CSS variables
- `vite.config.ts` - Vite + PWA configuration

## Conventions
- Mobile-first design approach
- Dark theme using CSS variables (--primary, --surface, --text, etc.)
- Each component has a corresponding .css file
- Bottom navigation pattern for mobile UX

## Commands
- `npm run dev` - Start dev server
- `npm run build` - Production build
- `npm run preview` - Preview production build

## Current State
- Basic app structure with 3 pages
- Static/mock data (no backend yet)
- PWA configured but icons need to be added
