import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const databasePath = process.env.DATABASE_PATH || fileURLToPath(new URL('./task-it.sqlite', import.meta.url));
const database = new Database(path.resolve(databasePath));

database.pragma('foreign_keys = ON');
database.pragma('journal_mode = WAL');

database.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    role TEXT NOT NULL CHECK (role IN ('Customer', 'Provider')),
    provider_id INTEGER,
    password_hash TEXT
  );

  CREATE TABLE IF NOT EXISTS providers (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    rating REAL NOT NULL,
    review_count INTEGER NOT NULL,
    category TEXT NOT NULL,
    response_time TEXT NOT NULL,
    bio TEXT NOT NULL,
    experience TEXT NOT NULL,
    pricing TEXT NOT NULL,
    specialties TEXT NOT NULL,
    availability TEXT NOT NULL,
    hero_image TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY,
    provider_id INTEGER NOT NULL REFERENCES providers(id),
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    rating REAL NOT NULL,
    price INTEGER NOT NULL,
    description TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS bookings (
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

  CREATE INDEX IF NOT EXISTS bookings_customer_idx ON bookings(customer_id, date);
  CREATE INDEX IF NOT EXISTS bookings_provider_idx ON bookings(provider_id, date);
`);

const userColumns = database.pragma('table_info(users)');
if (!userColumns.some((column) => column.name === 'password_hash')) {
  database.exec('ALTER TABLE users ADD COLUMN password_hash TEXT');
}

export default database;