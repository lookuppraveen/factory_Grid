-- FactoryGrid IAM Database Schema
-- Version 1: Core Identity and Access Management

-- Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    user_code VARCHAR(50) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    company_name VARCHAR(150),
    company_code VARCHAR(50),
    department VARCHAR(100),
    job_title VARCHAR(100),
    account_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    failed_login_attempts INT NOT NULL DEFAULT 0,
    account_locked_until TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- User Roles Join Table
CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Refresh Tokens Table (Secure Session Management & Revocation)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Fast Lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_code ON users(user_code);
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);

-- Canonical FactoryGrid Seed Roles
INSERT INTO roles (name, description) VALUES
('ROLE_BUYER', 'Procurement Buyer Role for purchasing entities'),
('ROLE_SUPPLIER', 'Manufacturer / Supplier Role for manufacturing units'),
('ROLE_MANUFACTURER', 'Canonical Manufacturer Role mapping to Supplier'),
('ROLE_ADMIN', 'Platform System Administrator with governance access'),
('ROLE_COMPLIANCE_OFFICER', 'Regulatory and Compliance Desk Officer'),
('ROLE_SALES_MANAGER', 'Sales and RFQ Management Officer'),
('ROLE_ACCOUNTS_MANAGER', 'Finance and Invoicing Officer'),
('ROLE_FACTORY_BUDDY', 'Factory Floor and Logistics Field Agent')
ON CONFLICT (name) DO NOTHING;
