-- Add first_contact_sent column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_contact_sent BOOLEAN NOT NULL DEFAULT false;
