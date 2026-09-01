# Udhyana Games - Dedicated Local Database & Offline Sync Directory

This directory acts as the dedicated **Local Database & Offline Store** for Udhyana Games.
All files in this folder are stored locally right inside your website folder.

## Files in this Directory

1. **`udhyana_local.json`**
   - Local database mirror containing full offline copies of:
     - Console stations and hardware specs
     - Master installed games library
     - Snacks, food & beverage inventory
     - Pricing, hourly rates, controller add-ons
     - Customer accounts, Gamer Tags, ranks & loyalty points

2. **`terminal_state.json`**
   - Active terminal runtime state used by the Desktop Reception POS and Web Reception:
     - Live active game sessions on all 4 physical lounge stations
     - Live countdown timers, paused session states
     - Today's register shift summary (Z-report revenue, cash, card)

3. **`offline_sync_queue.json`**
   - Unsaved offline transactional queue:
     - When internet drops, sessions, orders, customer points, and snack sales are appended here.
     - As soon as internet connectivity returns, the background sync engine automatically drains this queue and uploads all records to Supabase Cloud.

---
*Automatic Local & Cloud Sync Engine: `src/backend/localDb.ts` & `electron/main.js`*
