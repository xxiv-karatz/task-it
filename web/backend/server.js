import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';
import database from './database.js';

dotenv.config({ path: new URL('./.env', import.meta.url) });

const app = express();
const port = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET || (isProduction ? '' : randomBytes(32).toString('hex'));
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

if (!jwtSecret) throw new Error('Set JWT_SECRET before starting the production server');
if (isProduction && (!adminEmail || !adminPassword)) {
  throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD before starting the production server');
}

if (!isProduction && (!adminEmail || !adminPassword)) {
  console.warn('Admin access is disabled. Set ADMIN_EMAIL and ADMIN_PASSWORD to configure it.');
}

if (adminEmail && adminPassword) {
  database.prepare(`
    INSERT INTO admin_users (email, password_hash) VALUES (?, ?)
    ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash
  `).run(adminEmail.trim(), bcrypt.hashSync(adminPassword, 12));
}

app.use(cors());
app.use(express.json({ limit: '100kb' }));

const providerSelect = `
  SELECT providers.id, providers.name, providers.city, providers.category_id AS categoryId,
    categories.name AS category, providers.bio, providers.pricing, providers.specialties,
    providers.availability, providers.hero_image AS heroImage, providers.is_active AS isActive
  FROM providers JOIN categories ON categories.id = providers.category_id
`;

const serviceSelect = `
  SELECT services.id, services.provider_id AS providerId, services.category_id AS categoryId,
    categories.name AS category, services.title, services.price, services.description,
    services.is_active AS isActive, providers.name AS provider, providers.city
  FROM services
  JOIN categories ON categories.id = services.category_id
  JOIN providers ON providers.id = services.provider_id
`;

const bookingSelect = `
  SELECT bookings.id, bookings.date, bookings.time, bookings.notes, bookings.status, bookings.created_at AS createdAt,
    users.name AS customerName, users.email AS customerEmail,
    providers.id AS providerId, providers.name AS providerName, providers.city AS providerCity,
    services.id AS serviceId, services.title AS serviceTitle, services.price AS servicePrice
  FROM bookings
  JOIN users ON users.id = bookings.customer_id
  JOIN providers ON providers.id = bookings.provider_id
  JOIN services ON services.id = bookings.service_id
`;

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ message: 'Sign in to continue' });
  try {
    req.user = jwt.verify(token, jwtSecret);
    const account = req.user.role === 'Admin'
      ? database.prepare('SELECT id FROM admin_users WHERE id = ? AND email = ? COLLATE NOCASE').get(req.user.id, req.user.email)
      : database.prepare('SELECT id FROM users WHERE id = ? AND email = ? COLLATE NOCASE AND role = ?').get(req.user.id, req.user.email, req.user.role);
    if (!account) return res.status(401).json({ message: 'This account is no longer available. Sign in again.' });
    return next();
  } catch {
    return res.status(401).json({ message: 'Your session is invalid or expired' });
  }
};

const requireRole = (role) => (req, res, next) => {
  if (req.user?.role !== role) return res.status(403).json({ message: `${role} account required` });
  return next();
};

const adminOnly = [authenticate, requireRole('Admin')];
const isValidId = (value) => Number.isInteger(Number(value)) && Number(value) > 0;
const adminSummary = (row) => ({ id: row.id, email: row.email, role: 'Admin' });

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'task-it backend', storage: 'sqlite' });
});

app.get('/api/auth/me', authenticate, (req, res) => res.json({ user: req.user }));

app.post('/api/auth/login', (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !['Customer', 'Provider', 'Admin'].includes(role)) {
    return res.status(400).json({ message: 'Email, password, and account type are required' });
  }

  let user;
  if (role === 'Admin') {
    user = database.prepare('SELECT * FROM admin_users WHERE email = ? COLLATE NOCASE').get(email.trim());
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ message: 'Email or password is incorrect' });
    }
    user = adminSummary(user);
  } else {
    user = database.prepare('SELECT id, name, email, role, provider_id AS providerId, password_hash AS passwordHash FROM users WHERE email = ? COLLATE NOCASE AND role = ?')
      .get(email.trim(), role);
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(401).json({ message: 'Email or password is incorrect' });
    }
    delete user.passwordHash;
  }

  const token = jwt.sign(user, jwtSecret, { expiresIn: '12h' });
  return res.json({ token, user });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role, acceptedPolicies, city, categoryId, bio, pricing, specialties, availability } = req.body;
  if (!name?.trim() || !email?.trim() || !password || password.length < 10 || acceptedPolicies !== true || !['Customer', 'Provider'].includes(role)) {
    return res.status(400).json({ message: 'Name, email, a password of at least 10 characters, a valid account type, and policy acceptance are required' });
  }

  if (role === 'Provider' && (!city?.trim() || !isValidId(categoryId))) {
    return res.status(400).json({ message: 'City and service category are required for provider registration' });
  }

  if (role === 'Provider' && !database.prepare('SELECT id FROM categories WHERE id = ?').get(Number(categoryId))) {
    return res.status(400).json({ message: 'Select a category currently offered on Task-IT' });
  }

  try {
    const user = database.transaction(() => {
      let providerId = null;
      if (role === 'Provider') {
        const providerResult = database.prepare(`
          INSERT INTO providers (name, city, category_id, bio, pricing, specialties, availability)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          name.trim(),
          city.trim(),
          Number(categoryId),
          (bio || '').trim().slice(0, 2000),
          (pricing || '').trim().slice(0, 200),
          (specialties || '').trim().slice(0, 500),
          (availability || '').trim().slice(0, 500)
        );
        providerId = providerResult.lastInsertRowid;
      }

      const userResult = database.prepare(`
        INSERT INTO users (name, email, password_hash, role, provider_id, terms_accepted_at, privacy_accepted_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(name.trim(), email.trim(), bcrypt.hashSync(password, 12), role, providerId);

      return { id: userResult.lastInsertRowid, name: name.trim(), email: email.trim(), role, providerId };
    })();
    const token = jwt.sign(user, jwtSecret, { expiresIn: '12h' });
    return res.status(201).json({ token, user });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ message: 'An account with this email already exists' });
    throw error;
  }
});

app.patch('/api/account/password', authenticate, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (req.user.role === 'Admin') return res.status(400).json({ message: 'Use the environment configuration to change the admin password' });
  if (!currentPassword || !newPassword || newPassword.length < 10) {
    return res.status(400).json({ message: 'The current password and a new password of at least 10 characters are required' });
  }
  const user = database.prepare('SELECT password_hash AS passwordHash FROM users WHERE id = ?').get(req.user.id);
  if (!user || !bcrypt.compareSync(currentPassword, user.passwordHash)) {
    return res.status(401).json({ message: 'The current password is incorrect' });
  }
  database.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(newPassword, 12), req.user.id);
  return res.json({ message: 'Password changed successfully' });
});

app.get('/api/categories', (req, res) => {
  const categories = database.prepare(`
    SELECT categories.id, categories.name, COUNT(DISTINCT services.id) AS serviceCount
    FROM categories LEFT JOIN services ON services.category_id = categories.id AND services.is_active = 1
    GROUP BY categories.id ORDER BY categories.name
  `).all();
  res.json(categories);
});

app.get('/api/services', (req, res) => {
  const query = `%${(req.query.q || '').toString().trim()}%`;
  const categoryId = isValidId(req.query.categoryId) ? Number(req.query.categoryId) : null;
  const city = (req.query.city || '').toString().trim();
  const cityQuery = city ? `%${city}%` : null;
  const services = database.prepare(`
    ${serviceSelect}
    WHERE services.is_active = 1 AND providers.is_active = 1
      AND (services.title LIKE ? OR categories.name LIKE ? OR providers.name LIKE ? OR providers.city LIKE ?)
      AND (? IS NULL OR services.category_id = ?)
      AND (? IS NULL OR providers.city LIKE ?)
    ORDER BY services.created_at DESC, services.id DESC
  `).all(query, query, query, query, categoryId, categoryId, cityQuery, cityQuery);
  res.json({ count: services.length, services });
});

app.get('/api/providers', (req, res) => {
  const providers = database.prepare(`${providerSelect} WHERE providers.is_active = 1 ORDER BY providers.name`).all();
  res.json({ count: providers.length, providers });
});

app.get('/api/providers/:id', (req, res) => {
  const provider = database.prepare(`${providerSelect} WHERE providers.id = ? AND providers.is_active = 1`).get(Number(req.params.id));
  if (!provider) return res.status(404).json({ message: 'Provider not found' });
  const services = database.prepare(`${serviceSelect} WHERE services.provider_id = ? AND services.is_active = 1 ORDER BY services.title`)
    .all(provider.id);
  return res.json({ provider, services });
});

app.get('/api/bookings/mine', authenticate, requireRole('Customer'), (req, res) => {
  const bookings = database.prepare(`${bookingSelect} WHERE bookings.customer_id = ? ORDER BY bookings.date DESC, bookings.time DESC`).all(req.user.id);
  return res.json({ count: bookings.length, bookings });
});

app.get('/api/provider/dashboard', authenticate, requireRole('Provider'), (req, res) => {
  if (!req.user.providerId) return res.status(403).json({ message: 'Provider profile is not configured' });
  const bookings = database.prepare(`${bookingSelect} WHERE bookings.provider_id = ? ORDER BY bookings.date, bookings.time`).all(req.user.providerId);
  const totals = database.prepare(`
    SELECT COUNT(*) AS total,
      SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN status = 'Accepted' THEN 1 ELSE 0 END) AS accepted,
      SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed,
      COALESCE(SUM(CASE WHEN status = 'Completed' THEN services.price ELSE 0 END), 0) AS earnings
    FROM bookings JOIN services ON services.id = bookings.service_id WHERE bookings.provider_id = ?
  `).get(req.user.providerId);
  return res.json({ totals, bookings });
});

app.post('/api/bookings', authenticate, requireRole('Customer'), (req, res) => {
  const { providerId, serviceId, date, time, notes } = req.body;
  if (!isValidId(providerId) || !isValidId(serviceId) || !/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !/^\d{2}:\d{2}$/.test(time || '')) {
    return res.status(400).json({ message: 'Select a provider, service, valid date, and time' });
  }

  const selectedDate = new Date(`${date}T${time}:00`);
  if (Number.isNaN(selectedDate.getTime()) || selectedDate <= new Date()) {
    return res.status(400).json({ message: 'Choose a future date and time' });
  }

  const service = database.prepare('SELECT id FROM services WHERE id = ? AND provider_id = ? AND is_active = 1').get(Number(serviceId), Number(providerId));
  const provider = database.prepare('SELECT id FROM providers WHERE id = ? AND is_active = 1').get(Number(providerId));
  if (!service || !provider) return res.status(404).json({ message: 'Service is no longer available' });

  const conflictingBooking = database.prepare(`
    SELECT id FROM bookings
    WHERE provider_id = ? AND date = ? AND time = ? AND status IN ('Pending', 'Accepted')
  `).get(Number(providerId), date, time);
  if (conflictingBooking) return res.status(409).json({ message: 'The provider already has a request at that date and time' });

  const result = database.prepare('INSERT INTO bookings (customer_id, provider_id, service_id, date, time, notes) VALUES (?, ?, ?, ?, ?, ?)')
    .run(req.user.id, Number(providerId), Number(serviceId), date, time, (notes || '').toString().slice(0, 2000));
  const booking = database.prepare(`${bookingSelect} WHERE bookings.id = ?`).get(result.lastInsertRowid);
  return res.status(201).json({ booking });
});

app.patch('/api/bookings/:id/cancel', authenticate, requireRole('Customer'), (req, res) => {
  const existing = database.prepare(`
    SELECT id, customer_id AS customerId, status
    FROM bookings WHERE id = ?
  `).get(Number(req.params.id));
  if (!existing) return res.status(404).json({ message: 'Booking not found' });
  if (existing.customerId !== req.user.id) return res.status(403).json({ message: 'You cannot cancel this booking' });
  if (!['Pending', 'Accepted'].includes(existing.status)) {
    return res.status(409).json({ message: `A ${existing.status.toLowerCase()} booking cannot be cancelled` });
  }
  database.prepare("UPDATE bookings SET status = 'Cancelled' WHERE id = ?").run(existing.id);
  return res.json({ booking: database.prepare(`${bookingSelect} WHERE bookings.id = ?`).get(existing.id) });
});

app.patch('/api/provider/profile', authenticate, requireRole('Provider'), (req, res) => {
  if (!req.user.providerId) return res.status(403).json({ message: 'Provider profile is not configured' });
  const { city, categoryId, bio, pricing, specialties, availability } = req.body;
  if (!city?.trim() || !isValidId(categoryId)) {
    return res.status(400).json({ message: 'City and service category are required' });
  }
  if (!database.prepare('SELECT id FROM categories WHERE id = ?').get(Number(categoryId))) {
    return res.status(400).json({ message: 'Choose an existing category' });
  }
  database.prepare(`
    UPDATE providers
    SET city = ?, category_id = ?, bio = ?, pricing = ?, specialties = ?, availability = ?
    WHERE id = ?
  `).run(city.trim(), Number(categoryId), (bio || '').trim().slice(0, 2000), (pricing || '').trim().slice(0, 200), (specialties || '').trim().slice(0, 500), (availability || '').trim().slice(0, 500), req.user.providerId);
  return res.json({ provider: database.prepare(`${providerSelect} WHERE providers.id = ?`).get(req.user.providerId) });
});

app.patch('/api/bookings/:id/status', authenticate, (req, res, next) => {
  if (!['Provider', 'Admin'].includes(req.user.role)) return res.status(403).json({ message: 'Provider or admin account required' });
  return next();
}, (req, res) => {
  const { status } = req.body;
  const existing = database.prepare('SELECT status, provider_id FROM bookings WHERE id = ?').get(Number(req.params.id));
  if (!existing) return res.status(404).json({ message: 'Booking not found' });
  if (req.user.role === 'Provider' && existing.provider_id !== req.user.providerId) {
    return res.status(403).json({ message: 'You cannot update this booking' });
  }

  const allowedStatuses = req.user.role === 'Admin'
    ? ['Pending', 'Accepted', 'Completed', 'Declined']
    : ({ Pending: ['Accepted', 'Declined'], Accepted: ['Completed'] }[existing.status] || []);
  if (!allowedStatuses.includes(status)) return res.status(409).json({ message: `Cannot move booking from ${existing.status} to ${status}` });

  database.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, Number(req.params.id));
  return res.json({ booking: database.prepare(`${bookingSelect} WHERE bookings.id = ?`).get(Number(req.params.id)) });
});

app.get('/api/admin/summary', ...adminOnly, (req, res) => {
  const counts = {
    providers: database.prepare('SELECT COUNT(*) AS count FROM providers').get().count,
    services: database.prepare('SELECT COUNT(*) AS count FROM services').get().count,
    categories: database.prepare('SELECT COUNT(*) AS count FROM categories').get().count,
    bookings: database.prepare('SELECT COUNT(*) AS count FROM bookings').get().count,
    customers: database.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'Customer'").get().count
  };
  return res.json(counts);
});

app.get('/api/admin/categories', ...adminOnly, (req, res) => {
  return res.json(database.prepare('SELECT * FROM categories ORDER BY name').all());
});

app.post('/api/admin/categories', ...adminOnly, (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name || name.length > 80) return res.status(400).json({ message: 'Category name is required (max 80 characters)' });
  try {
    const result = database.prepare('INSERT INTO categories (name) VALUES (?)').run(name);
    return res.status(201).json(database.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid));
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ message: 'That category already exists' });
    throw error;
  }
});

app.delete('/api/admin/categories/:id', ...adminOnly, (req, res) => {
  try {
    const result = database.prepare('DELETE FROM categories WHERE id = ?').run(Number(req.params.id));
    if (!result.changes) return res.status(404).json({ message: 'Category not found' });
    return res.status(204).end();
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') return res.status(409).json({ message: 'Remove or reassign listings in this category first' });
    throw error;
  }
});

app.get('/api/admin/providers', ...adminOnly, (req, res) => {
  const providers = database.prepare(`${providerSelect} ORDER BY providers.created_at DESC`).all();
  return res.json(providers);
});

app.post('/api/admin/providers', ...adminOnly, (req, res) => {
  const { name, email, password, city, categoryId, bio, pricing, specialties, availability } = req.body;
  if (!name?.trim() || !email?.trim() || !password || password.length < 10 || !city?.trim() || !isValidId(categoryId)) {
    return res.status(400).json({ message: 'Name, email, password (10+ characters), city, and category are required' });
  }
  if (!database.prepare('SELECT id FROM categories WHERE id = ?').get(Number(categoryId))) {
    return res.status(400).json({ message: 'Choose an existing category' });
  }

  try {
    const createProvider = database.transaction(() => {
      const providerResult = database.prepare(`
        INSERT INTO providers (name, city, category_id, bio, pricing, specialties, availability)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(name.trim(), city.trim(), Number(categoryId), (bio || '').trim(), (pricing || '').trim(), (specialties || '').trim(), (availability || '').trim());
      database.prepare('INSERT INTO users (name, email, password_hash, role, provider_id) VALUES (?, ?, ?, \'Provider\', ?)')
        .run(name.trim(), email.trim(), bcrypt.hashSync(password, 12), providerResult.lastInsertRowid);
      return providerResult.lastInsertRowid;
    });
    const provider = database.prepare(`${providerSelect} WHERE providers.id = ?`).get(createProvider());
    return res.status(201).json(provider);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ message: 'An account with this email already exists' });
    throw error;
  }
});

app.patch('/api/admin/providers/:id', ...adminOnly, (req, res) => {
  const { name, city, categoryId, bio, pricing, specialties, availability, isActive } = req.body;
  if (!name?.trim() || !city?.trim() || !isValidId(categoryId) || typeof isActive !== 'boolean') {
    return res.status(400).json({ message: 'Name, city, category, and active status are required' });
  }
  const updateProvider = database.transaction(() => {
    const result = database.prepare(`
      UPDATE providers SET name = ?, city = ?, category_id = ?, bio = ?, pricing = ?, specialties = ?, availability = ?, is_active = ?
      WHERE id = ?
    `).run(name.trim(), city.trim(), Number(categoryId), (bio || '').trim(), (pricing || '').trim(), (specialties || '').trim(), (availability || '').trim(), isActive ? 1 : 0, Number(req.params.id));
    if (!result.changes) return false;
    database.prepare('UPDATE users SET name = ? WHERE provider_id = ?').run(name.trim(), Number(req.params.id));
    return true;
  });
  if (!updateProvider()) return res.status(404).json({ message: 'Provider not found' });
  return res.json(database.prepare(`${providerSelect} WHERE providers.id = ?`).get(Number(req.params.id)));
});

app.delete('/api/admin/providers/:id', ...adminOnly, (req, res) => {
  const removeProvider = database.transaction(() => {
    database.prepare('DELETE FROM users WHERE provider_id = ?').run(Number(req.params.id));
    return database.prepare('DELETE FROM providers WHERE id = ?').run(Number(req.params.id));
  });
  try {
    const result = removeProvider();
    if (!result.changes) return res.status(404).json({ message: 'Provider not found' });
    return res.status(204).end();
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') return res.status(409).json({ message: 'A provider with bookings cannot be deleted; deactivate the profile instead' });
    throw error;
  }
});

app.get('/api/admin/services', ...adminOnly, (req, res) => {
  return res.json(database.prepare(`${serviceSelect} ORDER BY services.created_at DESC`).all());
});

app.post('/api/admin/services', ...adminOnly, (req, res) => {
  const { providerId, categoryId, title, price, description } = req.body;
  if (!isValidId(providerId) || !isValidId(categoryId) || !title?.trim() || !Number.isInteger(Number(price)) || Number(price) < 0) {
    return res.status(400).json({ message: 'Provider, category, title, and a non-negative whole-number price are required' });
  }
  const providerExists = database.prepare('SELECT id FROM providers WHERE id = ?').get(Number(providerId));
  const categoryExists = database.prepare('SELECT id FROM categories WHERE id = ?').get(Number(categoryId));
  if (!providerExists || !categoryExists) return res.status(400).json({ message: 'Select an existing provider and category' });
  const result = database.prepare('INSERT INTO services (provider_id, category_id, title, price, description) VALUES (?, ?, ?, ?, ?)')
    .run(Number(providerId), Number(categoryId), title.trim(), Number(price), (description || '').trim());
  return res.status(201).json(database.prepare(`${serviceSelect} WHERE services.id = ?`).get(result.lastInsertRowid));
});

app.patch('/api/admin/services/:id', ...adminOnly, (req, res) => {
  const { providerId, categoryId, title, price, description, isActive } = req.body;
  if (!isValidId(providerId) || !isValidId(categoryId) || !title?.trim() || !Number.isInteger(Number(price)) || Number(price) < 0 || typeof isActive !== 'boolean') {
    return res.status(400).json({ message: 'Provider, category, title, price, and active status are required' });
  }
  const result = database.prepare(`
    UPDATE services SET provider_id = ?, category_id = ?, title = ?, price = ?, description = ?, is_active = ? WHERE id = ?
  `).run(Number(providerId), Number(categoryId), title.trim(), Number(price), (description || '').trim(), isActive ? 1 : 0, Number(req.params.id));
  if (!result.changes) return res.status(404).json({ message: 'Service not found' });
  return res.json(database.prepare(`${serviceSelect} WHERE services.id = ?`).get(Number(req.params.id)));
});

app.delete('/api/admin/services/:id', ...adminOnly, (req, res) => {
  try {
    const result = database.prepare('DELETE FROM services WHERE id = ?').run(Number(req.params.id));
    if (!result.changes) return res.status(404).json({ message: 'Service not found' });
    return res.status(204).end();
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') return res.status(409).json({ message: 'A service with bookings cannot be deleted; deactivate it instead' });
    throw error;
  }
});

app.get('/api/admin/bookings', ...adminOnly, (req, res) => {
  return res.json(database.prepare(`${bookingSelect} ORDER BY bookings.created_at DESC`).all());
});

app.use((error, req, res, next) => {
  console.error(error);
  return res.status(500).json({ message: 'An unexpected server error occurred' });
});

app.listen(port, () => {
  console.log(`Task-IT backend running on http://localhost:${port}`);
});
