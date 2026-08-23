-- ==============================================================================
-- UDHYANA GAMES - PRODUCTION DATABASE SCHEMA (PostgreSQL)
-- Fully compatible with Prisma Client, NextAuth, and Next.js Server Actions
-- ==============================================================================

-- Enable UUID extension if not already available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. SYSTEM & CMS CONFIGURATION
-- ==============================================================================

-- Global system settings & hero content
CREATE TABLE IF NOT EXISTS "Settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("key")
);

-- ==============================================================================
-- 2. HARDWARE & CATALOG
-- ==============================================================================

-- Gaming hardware stations / consoles / PCs
CREATE TABLE IF NOT EXISTS "Console" (
    "id" TEXT NOT NULL,
    "hardwareTitle" TEXT NOT NULL,
    "hardwareSlug" TEXT,
    "hourlyRate" DOUBLE PRECISION,
    "imagePath" TEXT,
    "specs" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Console_pkey" PRIMARY KEY ("id")
);

-- Master games catalog
CREATE TABLE IF NOT EXISTS "Game" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- Many-to-many relationship: Installed games on each station
CREATE TABLE IF NOT EXISTS "ConsoleGames" (
    "consoleId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsoleGames_pkey" PRIMARY KEY ("consoleId", "gameId"),
    CONSTRAINT "ConsoleGames_consoleId_fkey" FOREIGN KEY ("consoleId") REFERENCES "Console"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ConsoleGames_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ==============================================================================
-- 3. COMMERCE & SNACK BAR
-- ==============================================================================

-- Shop merchandise & gaming peripherals
CREATE TABLE IF NOT EXISTS "Product" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- Snack bar quick items
CREATE TABLE IF NOT EXISTS "Snack" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "icon" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Snack_pkey" PRIMARY KEY ("id")
);

-- ==============================================================================
-- 4. USERS & AUTHENTICATION (NextAuth & Custom Profiles)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    
    -- Custom gamer & staff profile fields
    "username" TEXT,
    "password" TEXT,
    "fullName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',           -- 'USER', 'RECEPTIONIST', 'ADMIN'
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',       -- 'PENDING', 'APPROVED', 'REJECTED'
    "rank" TEXT NOT NULL DEFAULT 'Beginner',        -- 'Beginner', 'Rookie', 'Regular', 'Pro', 'Elite'
    "sessionsCount" INTEGER NOT NULL DEFAULT 0,
    "playtimeHours" INTEGER NOT NULL DEFAULT 0,
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Account" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- ==============================================================================
-- 5. OPERATIONS: SESSIONS, BOOKINGS, QUEUE & ORDERS
-- ==============================================================================

-- Live gaming sessions (station occupancy & timers)
CREATE TABLE IF NOT EXISTS "GameSession" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT,
    "guestName" TEXT,
    "consoleId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',       -- 'ACTIVE', 'PAUSED', 'COMPLETED'

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "GameSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "GameSession_consoleId_fkey" FOREIGN KEY ("consoleId") REFERENCES "Console"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Advanced slot reservations
CREATE TABLE IF NOT EXISTS "Booking" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "consoleId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',   -- 'CONFIRMED', 'CANCELLED', 'COMPLETED'
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_consoleId_fkey" FOREIGN KEY ("consoleId") REFERENCES "Console"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Point of Sale (POS) and Online Orders
CREATE TABLE IF NOT EXISTS "Order" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'cash',  -- 'cash', 'card', 'ONLINE', etc.
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Individual items within an order receipt
CREATE TABLE IF NOT EXISTS "OrderItem" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "orderId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "type" TEXT NOT NULL,                         -- 'session', 'snack', 'PRODUCT'

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Walk-in reception queue
CREATE TABLE IF NOT EXISTS "Waitlist" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "requested" TEXT NOT NULL,                    -- station name or 'Any Console'
    "status" TEXT NOT NULL DEFAULT 'WAITING',     -- 'WAITING', 'ASSIGNED', 'CANCELLED'
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Waitlist_pkey" PRIMARY KEY ("id")
);

-- ==============================================================================
-- 6. SET COLUMN DEFAULTS (For pre-existing tables)
-- ==============================================================================
DO $$ 
BEGIN
    EXECUTE 'ALTER TABLE "Game" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text';
    EXECUTE 'ALTER TABLE "Product" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text';
    EXECUTE 'ALTER TABLE "Snack" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text';
    EXECUTE 'ALTER TABLE "User" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text';
    EXECUTE 'ALTER TABLE "Account" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text';
    EXECUTE 'ALTER TABLE "Session" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text';
    EXECUTE 'ALTER TABLE "GameSession" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text';
    EXECUTE 'ALTER TABLE "Booking" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text';
    EXECUTE 'ALTER TABLE "Order" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text';
    EXECUTE 'ALTER TABLE "OrderItem" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text';
    EXECUTE 'ALTER TABLE "Waitlist" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text';
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- ==============================================================================
-- 7. UNIQUE CONSTRAINTS & PERFORMANCE INDEXES
-- ==============================================================================

-- Unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "Console_hardwareSlug_key" ON "Console"("hardwareSlug");
CREATE UNIQUE INDEX IF NOT EXISTS "Game_name_key" ON "Game"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- Query performance optimization indexes
CREATE INDEX IF NOT EXISTS "idx_gamesession_active_lookup" ON "GameSession"("consoleId", "status", "endTime");
CREATE INDEX IF NOT EXISTS "idx_gamesession_user" ON "GameSession"("userId", "status");
CREATE INDEX IF NOT EXISTS "idx_booking_availability" ON "Booking"("consoleId", "status", "startTime", "endTime");
CREATE INDEX IF NOT EXISTS "idx_booking_user" ON "Booking"("userId", "status");
CREATE INDEX IF NOT EXISTS "idx_order_createdat" ON "Order"("createdAt");
CREATE INDEX IF NOT EXISTS "idx_order_user" ON "Order"("userId");
CREATE INDEX IF NOT EXISTS "idx_orderitem_orderid" ON "OrderItem"("orderId");
CREATE INDEX IF NOT EXISTS "idx_user_phone" ON "User"("phone");
CREATE INDEX IF NOT EXISTS "idx_waitlist_status" ON "Waitlist"("status", "createdAt");

-- ==============================================================================
-- 8. INITIAL SEED DATA (Safe Upserts with explicit IDs)
-- ==============================================================================

-- Core rates and defaults
INSERT INTO "Settings" ("key", "value") VALUES 
    ('baseHourlyRate', '1000'),
    ('extraControllerRate', '200'),
    ('pointsPerHour', '50'),
    ('spendPerPoint', '10')
ON CONFLICT ("key") DO NOTHING;

-- Default quick snacks (guaranteed explicit ID generation & conflict prevention)
INSERT INTO "Snack" ("id", "name", "icon", "price")
SELECT gen_random_uuid()::text, 'Energy Drink', '⚡', 500
WHERE NOT EXISTS (SELECT 1 FROM "Snack" WHERE "name" = 'Energy Drink');

INSERT INTO "Snack" ("id", "name", "icon", "price")
SELECT gen_random_uuid()::text, 'Soda Can', '🥤', 150
WHERE NOT EXISTS (SELECT 1 FROM "Snack" WHERE "name" = 'Soda Can');

INSERT INTO "Snack" ("id", "name", "icon", "price")
SELECT gen_random_uuid()::text, 'Chips / Lays', '🥔', 200
WHERE NOT EXISTS (SELECT 1 FROM "Snack" WHERE "name" = 'Chips / Lays');

INSERT INTO "Snack" ("id", "name", "icon", "price")
SELECT gen_random_uuid()::text, 'Chocolate', '🍫', 300
WHERE NOT EXISTS (SELECT 1 FROM "Snack" WHERE "name" = 'Chocolate');

-- Initial gaming stations
INSERT INTO "Console" ("id", "hardwareTitle", "hourlyRate") VALUES 
    ('ps5-1', 'PS5 Pro - Station 1', 1000),
    ('ps5-2', 'PS5 Pro - Station 2', 1000),
    ('ps5-3', 'PS5 Pro - Station 3', 1000),
    ('pc-1', 'Esports PC - Station 4', 1000),
    ('pc-2', 'Esports PC - Station 5', 1000),
    ('xbox-1', 'Xbox Series X - Station 6', 1000)
ON CONFLICT ("id") DO NOTHING;
