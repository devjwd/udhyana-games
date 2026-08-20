-- M80 Admin Dashboard - Database Schema

-- 1. Global Settings (for storing baseHourlyRate and other configurations)
CREATE TABLE settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Products (Shop Inventory)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50) NOT NULL, -- e.g., 'peripherals', 'apparel', 'accessories'
    image_url VARCHAR(500) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Snacks (Quick Sale Config)
CREATE TABLE snacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    icon VARCHAR(10) NOT NULL, -- Storing emojis like '⚡', '🥤'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Consoles / Screens (Hardware Configuration)
CREATE TABLE consoles (
    id VARCHAR(50) PRIMARY KEY, -- using varchar for IDs like 'ps5-1', 'pc-1'
    hardware_title VARCHAR(255) NOT NULL,
    hardware_slug VARCHAR(50) UNIQUE,
    hourly_rate DECIMAL(10, 2),
    image_path VARCHAR(500),
    specs VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Games Catalog
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Console Games Mapping (Many-to-Many relationship for Game Deployments)
CREATE TABLE console_games (
    console_id VARCHAR(50) REFERENCES consoles(id) ON DELETE CASCADE,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (console_id, game_id)
);

-- Optional: Initial Seed Data based on your DEFAULT constants
INSERT INTO snacks (name, icon, price) VALUES 
('Energy Drink', '⚡', 500),
('Soda Can', '🥤', 150),
('Chips / Lays', '🥔', 200),
('Chocolate', '🍫', 300);

INSERT INTO settings (key, value) VALUES 
('base_hourly_rate', '1000');
