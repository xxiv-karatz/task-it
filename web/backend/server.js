import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const services = [
  {
    id: 1,
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

app.listen(port, () => {
  console.log(`Task-IT backend running on http://localhost:${port}`);
});
