-- NearBin Production Database Schema
-- Compatible with PostgreSQL 13+ (Supabase, Neon, Render Postgres, ElephantSQL)

CREATE TABLE IF NOT EXISTS hotspots (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'plastic',
    status VARCHAR(50) NOT NULL DEFAULT 'reported',
    urgency VARCHAR(50) NOT NULL DEFAULT 'medium',
    upvotes INT DEFAULT 1,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address TEXT,
    before_photo TEXT,
    after_photo TEXT,
    photos JSONB DEFAULT '[]'::jsonb,
    reported_by VARCHAR(255) DEFAULT 'Concerned Citizen',
    reported_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    cleaned_at TIMESTAMPTZ,
    cleaned_by VARCHAR(255),
    claimed_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(128) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    ward VARCHAR(255),
    auth_provider VARCHAR(50) DEFAULT 'mobile_otp',
    points INT DEFAULT 50,
    avatar TEXT,
    raw_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes for Spatial and Filter Queries
CREATE INDEX IF NOT EXISTS idx_hotspots_category ON hotspots(category);
CREATE INDEX IF NOT EXISTS idx_hotspots_status ON hotspots(status);
CREATE INDEX IF NOT EXISTS idx_hotspots_coords ON hotspots(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_hotspots_created_at ON hotspots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
