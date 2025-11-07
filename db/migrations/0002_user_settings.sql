-- Add user settings table
-- Stores user preferences and configuration (Tailscale config, etc.)

CREATE TABLE IF NOT EXISTS user_settings (
    user_uuid TEXT PRIMARY KEY,
    settings JSON NOT NULL DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_uuid) REFERENCES users(user_uuid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_settings_updated ON user_settings(updated_at);
