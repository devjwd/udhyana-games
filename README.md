# Udhyana Games — Unified Lounge Management Platform 🎮⚡

Udhyana Games is an end-to-end gaming lounge operating system that unifies a customer web portal, an in-lounge reception desk POS, automated IoT console station pods, and a dual-database offline-first synchronization engine.

---

## 🏗️ System Architecture

```
                                    🌐 Cloud (Supabase / PostgreSQL)
                                                  │
                           ┌──────────────────────┴──────────────────────┐
                           ▼                                             ▼
             ┌───────────────────────────┐                 ┌───────────────────────────┐
             │   Customer Web Portal     │                 │   Lounge Reception Desk   │
             │   • Online Bookings       │                 │   • Web POS (/reception)  │
             │   • Gaming Gear Shop      │                 │   • Electron Desktop App  │
             │   • Leaderboards & Stats  │                 │   • Offline JSON DB Queue │
             │   • /stations Status View │                 │   • Thermal ESC/POS Slip  │
             └─────────────┬─────────────┘                 └─────────────┬─────────────┘
                           │                                             │
                           │              LAN Wi-Fi Heartbeat            │
                           └──────────────────────┬──────────────────────┘
                                                  ▼
                                   ┌─────────────────────────────┐
                                   │  Station Pod (ESP32 IoT)    │
                                   │  • WS2812B NeoPixel Ring    │
                                   │  • 0.96" OLED Timer         │
                                   │  • 5V Passive Audio Chime   │
                                   │  • IR TV Auto-Power Blaster │
                                   └─────────────────────────────┘
```

---

## 📁 Repository Directory Structure

| Directory / File | Description |
|---|---|
| **`src/app/`** | Next.js App Router pages: storefront, online booking (`/book`), consoles, events, admin dashboard (`/admin`), live reception POS (`/reception`), and lounge status screen (`/stations`). |
| **`src/app/api/`** | Server API endpoints: NextAuth (`/api/auth`), Station Phone Display (`/api/station-display`), live station state (`/api/stations/live`), and terminal sync (`/api/terminal`, `/api/sync`). |
| **`src/backend/`** | Core business logic: `actions.ts` (Next.js server actions), `localDb.ts` (offline filesystem sync), `schema.prisma` & `schema.sql` (database models). |
| **`src/components/`** | Reusable UI design system: navigation, layouts, modal dialogs, cards, and shopping drawers. |
| **`src/lib/`** | Prisma database client (`prisma.ts`), NextAuth configuration (`auth.ts`), and Dexie browser IndexedDB (`local-db/`). |
| **`electron/`** | Standalone Windows desktop wrapper for Reception Desk. Contains `main.js` (IPC & process lifecycle), `preload.js`, and `electron/app/` (emergency fallback offline UI). |
| **`local_database/`** | Dedicated local JSON state for the offline lounge engine: `terminal_state.json` (live active timers), `offline_sync_queue.json` (pending unsynced transactions), and `udhyana_local.json` (offline mirror). |
| **`scripts/`** | Maintenance and CLI utilities: `inspect-db.mjs`, `test-db.mjs`, `seed-games.mjs`, `reset-fresh.mjs`, `test-local-db-sync.mjs`, `generate_icons.js`, and `make_ico.py`. |
| **`build/`** | Windows application icons (`icon.ico`, `icon.png`, `icon_256.png`) used by `electron-builder`. |
| **`reception-config.json`**| Configuration file for the Reception Desktop app specifying target URLs and local endpoints. |
| **`start_reception_desktop.bat`** | Windows batch script to launch the local backend and desktop reception POS in one click. |
| **`build_reception_app.bat`** | Windows batch script to package the standalone Windows `.exe` installer. |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** v18+ or v20+
- **PostgreSQL** (e.g. Supabase, Neon, or local PostgreSQL instance)
- **Python** (optional, only required if rebuilding `.ico` icons with Pillow)

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env` and configure your database and authentication secrets:
```bash
cp .env.example .env
```
Ensure `DATABASE_URL` and `DIRECT_URL` point to your PostgreSQL database.

### 4. Database Setup
```bash
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to database
npm run db:inspect    # Verify database counts and connection
```

### 5. Running the Application

| Target | Command | Notes |
|---|---|---|
| **Web Dev Server** | `npm run dev` | Access at `http://localhost:3000` |
| **Reception POS (Web)** | Visit `http://localhost:3000/reception` | Requires RECEPTION or ADMIN role |
| **Station TV Dashboard**| Visit `http://localhost:3000/stations` | Live full-screen lounge overview |
| **Reception Desktop App** | `npm run desktop:dev` | Opens native Electron POS window |
| **1-Click Windows Launcher** | Double-click `start_reception_desktop.bat` | Starts server & desktop app |
| **Package Windows .EXE** | `npm run package:exe` or run `build_reception_app.bat` | Output in `dist-electron/` |

---

## 🛠️ Offline Sync Architecture

Udhyana Games is engineered to be **resilient against internet drops**:

1. **Online State**: Transactions, active session timers, and food/beverage orders immediately save to PostgreSQL (Cloud Supabase).
2. **Offline Mode**: If Wi-Fi or internet connection fails, the Reception Terminal seamlessly appends orders and active session state to `local_database/offline_sync_queue.json` and IndexedDB.
3. **Auto-Recovery**: As soon as internet connectivity returns, the background sync engine drains the queue and reconciles records with the cloud database.

---

## 📱 Phone Station Monitor (Wireless Desk Display)

Use old Android phones or tablets as dedicated station countdown timers & customer reminder monitors:
- Visit `/station/[id]` (e.g. `http://localhost:3000/station/PS5`) or `/station` on the phone's browser.
- **Always-on Screen**: Built-in Screen WakeLock API prevents the phone display from sleeping.
- **Dynamic HUD**: Smooth countdown clock, player name, 5-minute warning amber pulse, and red time's-up alert screen.
- **Synthesizer Audio Chimes**: Web Audio API generates start tones, 5-minute alerts, and session-expired alarms directly through the phone speakers without any external files.
- **Kiosk Setup**: Open in Chrome Fullscreen or install **Fully Kiosk Browser** on Android to lock the phone to the station monitor URL.

---

## 🧪 Maintenance Scripts

Run these scripts from the repository root:

- `npm run db:inspect`: Inspect record counts (consoles, games, sessions, orders, snacks)
- `npm run db:test`: Test raw PostgreSQL connection pool latency and queries
- `npm run icons:generate`: Re-render all application icons from `public/favicon.svg`
- `npm run lint`: Run ESLint checks across all TypeScript and JavaScript files
