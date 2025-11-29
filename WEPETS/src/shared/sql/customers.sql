-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  email_consent BOOLEAN NOT NULL DEFAULT TRUE,

  phone TEXT,
  address TEXT,

  -- source: form:contact_form, stripe, manual, etc.
  source TEXT NOT NULL,
  metadata JSON,

  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Create index on email and source for deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_source ON customers (email, source);
