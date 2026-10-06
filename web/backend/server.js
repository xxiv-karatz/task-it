import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

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

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'task-it backend',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/categories', (req, res) => {
  const categories = services.reduce((acc, service) => {
    acc[service.category] = (acc[service.category] || 0) + 1;
    return acc;
  }, {});

  res.json(
    Object.entries(categories).map(([name, count]) => ({
      name,
      count
    }))
  );
});

app.get('/api/services', (req, res) => {
  const query = (req.query.q || '').toString().trim().toLowerCase();

  let filtered = services;

  if (query) {
    filtered = services.filter((service) =>
      [service.title, service.category, service.provider, service.city]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }

  res.json({
    count: filtered.length,
    services: filtered
  });
});

app.get('/api/providers', (req, res) => {
  res.json({
    count: providers.length,
    providers
  });
});

app.get('/api/providers/:id', (req, res) => {
  const providerId = Number(req.params.id);
  const provider = providers.find((entry) => entry.id === providerId);

  if (!provider) {
    return res.status(404).json({ message: 'Provider not found' });
  }

  const providerServices = services.filter((service) => service.providerId === providerId);

  return res.json({
    provider,
    services: providerServices
  });
});

app.post('/api/bookings', (req, res) => {
  const { providerId, serviceId, customerName, customerEmail, date, time, notes } = req.body;

  if (!providerId || !serviceId || !customerName || !customerEmail || !date || !time) {
    return res.status(400).json({ message: 'Missing required booking details' });
  }

  const provider = providers.find((entry) => entry.id === Number(providerId));
  const service = services.find((entry) => entry.id === Number(serviceId));

  if (!provider || !service) {
    return res.status(404).json({ message: 'Provider or service not found' });
  }

  return res.status(201).json({
    bookingId: `TK-${Math.floor(1000 + Math.random() * 9000)}`,
    status: 'Confirmed',
    customerName,
    customerEmail,
    service: service.title,
    provider: provider.name,
    date,
    time,
    notes: notes || 'No additional notes',
    total: `R${service.price}`
  });
});

app.listen(port, () => {
  console.log(`Task-IT backend running on http://localhost:${port}`);
});
