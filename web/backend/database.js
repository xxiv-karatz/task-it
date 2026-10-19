import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const databasePath = process.env.DATABASE_PATH || fileURLToPath(new URL('./task-it.sqlite', import.meta.url));
const database = new Database(path.resolve(databasePath));

database.pragma('foreign_keys = ON');
database.pragma('journal_mode = WAL');

if (database.pragma('user_version', { simple: true }) < 1) {
  database.exec(`
    DROP TABLE IF EXISTS bookings;
    DROP TABLE IF EXISTS services;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS providers;
  `);

  database.exec(`
    CREATE TABLE categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE COLLATE NOCASE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE providers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      category_id INTEGER NOT NULL REFERENCES categories(id),
      bio TEXT NOT NULL DEFAULT '',
      pricing TEXT NOT NULL DEFAULT '',
      specialties TEXT NOT NULL DEFAULT '',
      availability TEXT NOT NULL DEFAULT '',
      hero_image TEXT NOT NULL DEFAULT '',
      is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('Customer', 'Provider')),
      provider_id INTEGER UNIQUE REFERENCES providers(id),
      terms_accepted_at TEXT,
      privacy_accepted_at TEXT
    );

    CREATE TABLE admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL
    );

    CREATE TABLE services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_id INTEGER NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
      category_id INTEGER NOT NULL REFERENCES categories(id),
      title TEXT NOT NULL,
      price INTEGER NOT NULL CHECK (price >= 0),
      description TEXT NOT NULL DEFAULT '',
      is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL REFERENCES users(id),
      provider_id INTEGER NOT NULL REFERENCES providers(id),
      service_id INTEGER NOT NULL REFERENCES services(id),
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Completed', 'Declined')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX bookings_customer_idx ON bookings(customer_id, date);
    CREATE INDEX bookings_provider_idx ON bookings(provider_id, date);
    PRAGMA user_version = 1;
  `);
}

export default database;
