# Stacey Water Inventory Management

A responsive React dashboard for managing water-container inventory and delivery activity. Track container movements, follow deliveries awaiting confirmation, review sales, and maintain the employee, container, and delivery-area records used by the workspace.

## Features

- **Dashboard overview** — See container totals, pending deliveries, recorded sales, and recent activity.
- **Transaction tracking** — Record deliveries, search and filter transaction history, and review transaction details.
- **Delivery confirmation** — Enter returned, damaged, and lost quantities to complete a pending delivery.
- **Sales reporting** — Review sales for a selected time period.
- **Master data management** — Manage employees, containers, and delivery areas.
- **Workspace settings** — Configure business details, currency, date format, and default container ownership.
- **Backup and restore** — Export workspace data to JSON or import a validated backup.
- **Responsive interface** — Use the app on desktop, tablet, and mobile screens.

## Tech stack

- React
- Vite
- Tailwind CSS and custom CSS
- Lucide React icons

## Getting started

### Requirements

- Node.js and npm

### Install and run

```bash
npm install
npm run dev
```

Open the local URL printed by Vite in your browser.

### Production build

```bash
npm run build
npm run preview
```

## Project structure

```text
src/
├── components/   # Shared UI and transaction dialogs/tables
├── data/         # Demo records, settings defaults, and workspace persistence
├── pages/        # Dashboard, transactions, sales, settings, and master data
├── utils/        # Date and currency formatting helpers
├── App.jsx       # Application state, navigation, and page composition
├── index.css     # Global styles and responsive layouts
└── main.jsx      # React application entry point
```

## Data storage

Workspace settings and records are saved in the browser's local storage. Data is specific to the browser and device where it was entered. Use **Settings → Download backup** to save a JSON copy before changing browsers or clearing browser data. Importing a backup replaces the current workspace data.

The app starts with sample employees, containers, delivery areas, and transactions when no saved workspace data is present.

## Available npm scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create an optimized production build in `dist/` |
| `npm run preview` | Preview the production build locally |
