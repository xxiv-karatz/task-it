import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';
import database from './database.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const jwtSecret = process.env.JWT_SECRET || randomBytes(32).toString('hex');

const providers = [
  {
    id: 1,
    name: 'Anele M.',
    city: 'Johannesburg',
    rating: 4.9,
    reviewCount: 128,
    category: 'Barber',
    responseTime: 'Within 30 mins',
    bio: 'Experienced barber helping professionals and families with premium grooming and beard styling.',
    experience: '8 years',
    pricing: 'From R180',
    specialties: ['Haircuts', 'Beard trims', 'Styling'],
    availability: ['Mon', 'Tue', 'Thu', 'Sat'],
    heroImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 2,
    name: 'Lehlohonolo P.',
    city: 'Cape Town',
    rating: 4.8,
    reviewCount: 94,
    category: 'Tutor',
    responseTime: 'Within 1 hour',
    bio: 'High-school tutor specializing in maths, science, and exam preparation with personalized lesson plans.',
    experience: '6 years',
    pricing: 'From R220',
    specialties: ['Math tutoring', 'Exam prep', 'Homework support'],
    availability: ['Mon', 'Wed', 'Fri', 'Sun'],
    heroImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 3,
    name: 'Sipho K.',
    city: 'Durban',
    rating: 4.7,
    reviewCount: 76,
    category: 'Plumber',
    responseTime: 'Within 45 mins',
    bio: 'Emergency plumber focused on fast leak repairs, pipe replacements, and home maintenance support.',
    experience: '10 years',
    pricing: 'From R420',
    specialties: ['Leak fixes', 'Pipe installations', 'Bathroom plumbing'],
    availability: ['Tue', 'Thu', 'Fri', 'Sat'],
    heroImage: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 4,
    name: 'Mpho D.',
    city: 'Pretoria',
    rating: 4.9,
    reviewCount: 141,
    category: 'Electrician',
    responseTime: 'Within 30 mins',
    bio: 'Certified electrician offering efficient rewiring, light install, and home safety inspections.',
    experience: '9 years',
    pricing: 'From R380',
    specialties: ['Wiring checks', 'Lighting', 'Electrical repairs'],
    availability: ['Mon', 'Wed', 'Thu', 'Sat'],
    heroImage: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 5,
    name: 'Lethabo N.',
    city: 'Sandton',
    rating: 5.0,
    reviewCount: 162,
    category: 'Makeup',
    responseTime: 'Within 2 hours',
    bio: 'Bridal and event makeup artist with a focus on natural glam, quick touch-ups, and polished finishes.',
    experience: '7 years',
    pricing: 'From R650',
    specialties: ['Bridal makeup', 'Event glam', 'Trial sessions'],
    availability: ['Tue', 'Wed', 'Fri', 'Sun'],
    heroImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 6,
    name: 'Zanele T.',
    city: 'Gqeberha',
    rating: 4.8,
    reviewCount: 83,
    category: 'Cleaner',
    responseTime: 'Within 90 mins',
    bio: 'Detail-oriented cleaner helping families and small businesses with regular and deep cleaning services.',
    experience: '5 years',
    pricing: 'From R340',
    specialties: ['Deep cleaning', 'Home resets', 'Office tidying'],
    availability: ['Mon', 'Tue', 'Thu', 'Fri'],
    heroImage: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80'
  }
];

const services = [
  {
    id: 1,
    providerId: 1,
    category: 'Barber',
    title: 'Signature Haircut',
    provider: 'Anele M.',
    city: 'Johannesburg',
    rating: 4.9,
    price: 180,
    description: 'Precision cuts, beard shaping, and grooming for busy professionals.'
  },
  {
    id: 2,
    providerId: 2,
    category: 'Tutor',
    title: 'Math Booster Session',
    provider: 'Lehlohonolo P.',
    city: 'Cape Town',
    rating: 4.8,
    price: 220,
    description: 'Support for Grade 8 to 12 learners with focused weekly tutoring.'
  },
  {
    id: 3,
    providerId: 3,
    category: 'Plumber',
    title: 'Emergency Pipe Fix',
    provider: 'Sipho K.',
    city: 'Durban',
    rating: 4.7,
    price: 420,
    description: 'Leak detection and quick repairs for kitchens, bathrooms, and outdoor pipes.'
  },
  {
    id: 4,
    providerId: 4,
    category: 'Electrician',
    title: 'Home Wiring Check',
    provider: 'Mpho D.',
    city: 'Pretoria',
    rating: 4.9,
    price: 380,
    description: 'Safety inspections and light fixture upgrades for modern homes.'
  },
  {
    id: 5,
    providerId: 5,
    category: 'Makeup',
    title: 'Bridal Makeup Trial',
    provider: 'Lethabo N.',
    city: 'Sandton',
    rating: 5.0,
    price: 650,
    description: 'Elegant bridal styling with a polished finish and personalized planning.'
  },
  {
    id: 6,
    providerId: 6,
    category: 'Cleaner',
    title: 'Deep Home Cleaning',
    provider: 'Zanele T.',
    city: 'Gqeberha',
    rating: 4.8,
    price: 340,
    description: 'Reliable weekly and monthly cleaning with eco-friendly products.'
  }
];

const seed = database.transaction(() => {
  const addProvider = database.prepare(`
    INSERT OR IGNORE INTO providers
      (id, name, city, rating, review_count, category, response_time, bio, experience, pricing, specialties, availability, hero_image)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const addService = database.prepare(`
    INSERT OR IGNORE INTO services (id, provider_id, category, title, rating, price, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const addUser = database.prepare(`
    INSERT OR IGNORE INTO users (name, email, role, provider_id, password_hash) VALUES (?, ?, ?, ?, ?)
  `);
  const demoPasswordHash = bcrypt.hashSync('taskit-demo', 10);

  for (const provider of providers) {
    addProvider.run(
      provider.id,
      provider.name,
      provider.city,
      provider.rating,
      provider.reviewCount,
      provider.category,
      provider.responseTime,
      provider.bio,
      provider.experience,
      provider.pricing,
      JSON.stringify(provider.specialties),
      JSON.stringify(provider.availability),
      provider.heroImage
    );
    addUser.run(provider.name, `${provider.name.split(' ')[0].toLowerCase()}@taskit.test`, 'Provider', provider.id, demoPasswordHash);
  }

  addUser.run('Nandi M.', 'nandi@example.com', 'Customer', null, demoPasswordHash);
  database.prepare('UPDATE users SET password_hash = ? WHERE password_hash IS NULL').run(demoPasswordHash);

  for (const service of services) {
    addService.run(
      service.id,
      service.providerId,
      service.category,
      service.title,
      service.rating,
      service.price,
      service.description
    );
  }
});

seed();

const mapProvider = (provider) => ({
  id: provider.id,
  name: provider.name,
  city: provider.city,
  rating: provider.rating,
  reviewCount: provider.review_count,
  category: provider.category,
  responseTime: provider.response_time,
  bio: provider.bio,
  experience: provider.experience,
  pricing: provider.pricing,
  specialties: JSON.parse(provider.specialties),
  availability: JSON.parse(provider.availability),
  heroImage: provider.hero_image
});

const bookingSelect = `
  SELECT bookings.id, bookings.date, bookings.time, bookings.notes, bookings.status, bookings.created_at,
    users.name AS customer_name, users.email AS customer_email,
    providers.id AS provider_id, providers.name AS provider_name,
    providers.city AS provider_city, services.id AS service_id,
    services.title AS service_title, services.price AS service_price
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
    return next();
  } catch {
    return res.status(401).json({ message: 'Your session is invalid or expired' });
  }
};

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'task-it backend',
    storage: 'sqlite'
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !['Customer', 'Provider'].includes(role)) {
    return res.status(400).json({ message: 'Email, password, and account type are required' });
  }

  const user = database.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE AND role = ?')
    .get(email.trim(), role);

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ message: 'Email or password is incorrect' });
  }

  const publicUser = { id: user.id, name: user.name, email: user.email, role: user.role, providerId: user.provider_id };
  const token = jwt.sign(publicUser, jwtSecret, { expiresIn: '12h' });
  return res.json({ token, user: publicUser });
});

app.get('/api/categories', (req, res) => {
  const categories = database.prepare(`
    SELECT category AS name, COUNT(*) AS count FROM services GROUP BY category ORDER BY category
  `).all();
  res.json(categories);
});

app.get('/api/services', (req, res) => {
  const query = `%${(req.query.q || '').toString().trim()}%`;
  const filtered = database.prepare(`
    SELECT services.id, services.provider_id AS providerId, services.category, services.title,
      providers.name AS provider, providers.city, services.rating, services.price, services.description
    FROM services JOIN providers ON providers.id = services.provider_id
    WHERE services.title LIKE ? OR services.category LIKE ? OR providers.name LIKE ? OR providers.city LIKE ?
    ORDER BY services.id
  `).all(query, query, query, query);
  res.json({
    count: filtered.length,
    services: filtered
  });
});

app.get('/api/providers', (req, res) => {
  const providerList = database.prepare('SELECT * FROM providers ORDER BY id').all().map(mapProvider);
  res.json({
    count: providerList.length,
    providers: providerList
  });
});

app.get('/api/providers/:id', (req, res) => {
  const providerId = Number(req.params.id);
  const provider = database.prepare('SELECT * FROM providers WHERE id = ?').get(providerId);

  if (!provider) {
    return res.status(404).json({ message: 'Provider not found' });
  }

  const providerServices = database.prepare(`
    SELECT id, provider_id AS providerId, category, title, rating, price, description
    FROM services WHERE provider_id = ? ORDER BY id
  `).all(providerId);

  return res.json({
    provider: mapProvider(provider),
    services: providerServices
  });
});

app.get('/api/bookings/mine', authenticate, (req, res) => {
  if (req.user.role !== 'Customer') return res.status(403).json({ message: 'Customer account required' });

  const bookings = database.prepare(`${bookingSelect} WHERE bookings.customer_id = ? ORDER BY bookings.date DESC, bookings.time DESC`)
    .all(req.user.id);
  return res.json({ count: bookings.length, bookings });
});

app.get('/api/provider/dashboard', authenticate, (req, res) => {
  if (req.user.role !== 'Provider' || !req.user.providerId) {
    return res.status(403).json({ message: 'Provider account required' });
  }

  const provider = database.prepare('SELECT * FROM providers WHERE id = ?').get(req.user.providerId);
  const bookings = database.prepare(`${bookingSelect} WHERE bookings.provider_id = ? ORDER BY bookings.date, bookings.time`)
    .all(req.user.providerId);
  const totals = database.prepare(`
    SELECT COUNT(*) AS total,
      SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN status = 'Accepted' THEN 1 ELSE 0 END) AS accepted,
      SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed,
      COALESCE(SUM(CASE WHEN status = 'Completed' THEN services.price ELSE 0 END), 0) AS earnings
    FROM bookings JOIN services ON services.id = bookings.service_id
    WHERE bookings.provider_id = ?
  `).get(req.user.providerId);

  return res.json({ provider: mapProvider(provider), totals, bookings });
});

app.post('/api/bookings', authenticate, (req, res) => {
  const { providerId, serviceId, date, time, notes } = req.body;
  if (req.user.role !== 'Customer') return res.status(403).json({ message: 'Customer account required' });
  if (!providerId || !serviceId || !date || !time) {
    return res.status(400).json({ message: 'Provider, service, date, and time are required' });
  }

  const service = database.prepare('SELECT id FROM services WHERE id = ? AND provider_id = ?')
    .get(Number(serviceId), Number(providerId));
  if (!service) return res.status(404).json({ message: 'Service not found for this provider' });

  const result = database.prepare(`
    INSERT INTO bookings (customer_id, provider_id, service_id, date, time, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.user.id, Number(providerId), Number(serviceId), date, time, notes || '');

  const booking = database.prepare(`${bookingSelect} WHERE bookings.id = ?`).get(result.lastInsertRowid);
  return res.status(201).json({ booking });
});

app.patch('/api/bookings/:id/status', authenticate, (req, res) => {
  const { status } = req.body;
  const transitions = {
    Pending: ['Accepted', 'Declined'],
    Accepted: ['Completed']
  };
  if (req.user.role !== 'Provider') return res.status(403).json({ message: 'Provider account required' });
  const existing = database.prepare('SELECT status FROM bookings WHERE id = ? AND provider_id = ?')
    .get(Number(req.params.id), req.user.providerId);
  if (!existing) return res.status(404).json({ message: 'Booking not found for this provider' });
  if (!transitions[existing.status]?.includes(status)) {
    return res.status(409).json({ message: `Cannot move booking from ${existing.status} to ${status}` });
  }

  const result = database.prepare(`
    UPDATE bookings SET status = ? WHERE id = ? AND provider_id = ? AND status = ?
  `).run(status, Number(req.params.id), req.user.providerId, existing.status);
  if (!result.changes) return res.status(409).json({ message: 'Booking status changed; refresh and try again' });

  const booking = database.prepare(`${bookingSelect} WHERE bookings.id = ?`).get(Number(req.params.id));
  return res.json({ booking });
});

app.listen(port, () => {
  console.log(`Task-IT backend running on http://localhost:${port}`);
});
