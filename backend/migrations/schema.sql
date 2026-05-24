-- Enums are typically handled via VARCHAR or ENUM type in MySQL.
-- ENUM('admin', 'data_entry', 'viewer')
-- ENUM('new', 'renewal', 'replacement')
-- ENUM('active', 'suspended')

-- Users table (Custom for our JWT auth, conceptually replacing Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_super_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    display_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User Roles
CREATE TABLE IF NOT EXISTS user_roles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    role ENUM('admin', 'editor', 'data_entry', 'viewer') DEFAULT 'viewer',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Settings
CREATE TABLE IF NOT EXISTS app_settings (
    `key` VARCHAR(255) PRIMARY KEY,
    value JSON NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Lookups/Dictionaries
CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(50) DEFAULT '#1a5b9c',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sections (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    department_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS job_titles (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS nationalities (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS card_types (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    logo_url VARCHAR(500),
    website_text VARCHAR(255),
    back_instructions TEXT,
    card_title VARCHAR(255),
    company_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Per-card-type PIN protection (used for QR public page)
CREATE TABLE IF NOT EXISTS card_type_pins (
    card_type_id VARCHAR(36) PRIMARY KEY,
    is_enabled BOOLEAN DEFAULT FALSE,
    pin_code VARCHAR(20),
    created_by VARCHAR(36),
    FOREIGN KEY (card_type_id) REFERENCES card_types(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS destruction_reasons (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employees
CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(36) PRIMARY KEY,
    employee_number VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    english_name VARCHAR(255),
    card_number VARCHAR(100),
    department VARCHAR(255),
    section VARCHAR(255),
    job_title VARCHAR(255),
    nationality VARCHAR(255),
    passport_number VARCHAR(100),
    photo_url VARCHAR(500),
    expiry_date DATE,
    status ENUM('active', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Employee Archives
CREATE TABLE IF NOT EXISTS employee_archives (
    id VARCHAR(36) PRIMARY KEY,
    employee_id VARCHAR(36) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    uploaded_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    -- uploaded_by could refer to users table but keeping it soft for now as supabase left it string or null
);

-- Employee Cards
CREATE TABLE IF NOT EXISTS employee_cards (
    id VARCHAR(36) PRIMARY KEY,
    employee_id VARCHAR(36) NOT NULL,
    card_type_id VARCHAR(36) NOT NULL,
    issue_date DATE NOT NULL,
    issue_type ENUM('new', 'renewal', 'replacement') NOT NULL,
    expiry_date DATE,
    is_destroyed BOOLEAN DEFAULT FALSE,
    destruction_date DATE,
    destruction_reason_id VARCHAR(36),
    reason TEXT,
    old_card_returned BOOLEAN DEFAULT FALSE,
    non_return_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (card_type_id) REFERENCES card_types(id) ON DELETE RESTRICT,
    FOREIGN KEY (destruction_reason_id) REFERENCES destruction_reasons(id) ON DELETE SET NULL
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(255) NOT NULL,
    entity_id VARCHAR(36),
    details JSON,
    user_id VARCHAR(36) NOT NULL,
    user_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    -- optional: foreign key to users if robust consistency needed
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(100) DEFAULT 'info',
    entity_type VARCHAR(255),
    entity_id VARCHAR(36),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    -- optional: foreign key to users
);

-- QR Scans
CREATE TABLE IF NOT EXISTS qr_scans (
    id VARCHAR(36) PRIMARY KEY,
    employee_id VARCHAR(36) NOT NULL,
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(100),
    user_agent VARCHAR(500),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);
