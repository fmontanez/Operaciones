-- Create the user_types table first, as it's referenced by the users table
CREATE TABLE IF NOT EXISTS user_types (
    id SERIAL PRIMARY KEY,
    type_name VARCHAR(50) UNIQUE NOT NULL
);

-- Insert some default user types (optional, but good for initial setup)
INSERT INTO user_types (type_name) VALUES
('Admin'),
('Standard'),
('Guest')
ON CONFLICT (type_name) DO NOTHING; -- Prevents errors if types already exist

-- Create the users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Store hashed passwords (e.g., bcrypt hash)
    email VARCHAR(100) UNIQUE NOT NULL,
    user_type_id INTEGER NOT NULL,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    deleted BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_type
        FOREIGN KEY (user_type_id)
        REFERENCES user_types (id)
        ON DELETE RESTRICT -- Prevent deleting user types if users are associated
);

-- Optional: Add indexes for performance on frequently queried columns
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_user_type_id ON users (user_type_id);
CREATE INDEX IF NOT EXISTS idx_users_active ON users (active);
CREATE INDEX IF NOT EXISTS idx_users_deleted ON users (deleted);