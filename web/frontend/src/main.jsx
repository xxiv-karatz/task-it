import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

function App() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home');
  const [selectedProviderId, setSelectedProviderId] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [bookingSummary, setBookingSummary] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [servicesResponse, categoriesResponse, providersResponse] = await Promise.all([
          fetch(`/api/services?q=${encodeURIComponent(query)}`),
          fetch('/api/categories'),
          fetch('/api/providers')
        ]);

        const servicesData = await servicesResponse.json();
        const categoriesData = await categoriesResponse.json();
        const providersData = await providersResponse.json();

        setServices(servicesData.services || []);
        setCategories(categoriesData || []);
        setProviders(providersData.providers || []);
      } catch (error) {
        console.error('Failed to load marketplace data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [query]);

  const filteredProviders = useMemo(() => {
    if (!query) return providers;

    const haystack = query.toLowerCase();
    return providers.filter((provider) =>
      [provider.name, provider.city, provider.category, provider.specialties.join(' ')]
        .join(' ')
        .toLowerCase()
        .includes(haystack)
    );
  }, [providers, query]);

  const selectedProvider =
    providers.find((provider) => provider.id === selectedProviderId) ||
    (selectedService && providers.find((provider) => provider.id === selectedService.providerId)) ||
    null;

  const handleLogin = (form) => {
    setUser({
      name: form.name || 'Task-IT Customer',
      email: form.email,
      role: form.role || 'Customer'
    });
    setView('home');
  };

  const handleBookingSubmit = async (booking) => {
    const payload = {
      providerId: selectedProvider.id,
      serviceId: selectedService.id,
      customerName: user?.name || booking.customerName,
      customerEmail: user?.email || booking.customerEmail,
      date: booking.date,
      time: booking.time,
      notes: booking.notes
    };

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      setBookingSummary(result);
      setView('confirmation');
    } catch (error) {
      console.error('Booking failed:', error);
      setBookingSummary({
        status: 'Pending review',
        customerName: payload.customerName,
        service: selectedService.title,
        provider: selectedProvider.name,
        date: payload.date,
        time: payload.time,
        total: `R${selectedService.price}`
      });
      setView('confirmation');
    }
  };

  const renderHome = () => (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand-block">
          <span className="brand-mark">T</span>
          <span>Task-IT</span>
        </div>

        <nav className="nav-links">
          <button onClick={() => setView('home')}>Browse</button>
          <button onClick={() => setView('login')}>{user ? 'Account' : 'Login'}</button>
          <button onClick={() => setSelectedProviderId(providers[0]?.id || null) || setView('provider')}>
            Providers
          </button>
        </nav>

        <button className="primary-button" onClick={() => setView('login')}>
          {user ? `Hi, ${user.name.split(' ')[0]}` : 'Book a service'}
        </button>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Trusted local professionals</p>
            <h1>From quick fixes to everyday essentials.</h1>
            <p className="lead">
              Find vetted local experts in your city for grooming, tutoring, repairs,
              cleaning, and more.
            </p>

            <div className="search-box">
              <input
                type="text"
                placeholder="Search a service or city"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <button className="primary-button" onClick={() => setView('home')}>Search</button>
            </div>
          </div>

          <div className="hero-panel">
            <div className="metric">
              <strong>4.8/5</strong>
              <span>Average customer rating</span>
            </div>
            <div className="metric">
              <strong>1,200+</strong>
              <span>Verified providers</span>
            </div>
            <div className="metric">
              <strong>35 cities</strong>
              <span>Active coverage</span>
            </div>
          </div>
        </section>

        <section className="categories-section">
          <div className="section-heading">
            <h2>Popular categories</h2>
          </div>

          <div className="category-list">
            {categories.map((category) => (
              <div className="category-card" key={category.name}>
                <span>{category.name}</span>
                <strong>{category.count} listings</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="provider-highlight">
          <div className="section-heading">
            <h2>Top providers</h2>
          </div>

          <div className="provider-grid">
            {filteredProviders.slice(0, 4).map((provider) => (
              <div className="provider-card" key={provider.id}>
                <div className="provider-image" style={{ backgroundImage: `url(${provider.heroImage})` }} />
                <div className="provider-copy">
                  <div className="provider-topline">
                    <span>{provider.category}</span>
                    <strong>★ {provider.rating}</strong>
                  </div>
                  <h3>{provider.name}</h3>
                  <p>{provider.city}</p>
                  <button onClick={() => {
                    setSelectedProviderId(provider.id);
                    setView('provider');
                  }}>
                    View profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="services" className="services-section">
          <div className="section-heading">
            <h2>{query ? `Results for “${query}”` : 'Featured services nearby'}</h2>
            <span>{services.length} services</span>
          </div>

          {loading ? (
            <p className="status-copy">Loading services...</p>
          ) : services.length === 0 ? (
            <p className="status-copy">No matches found. Try a different keyword.</p>
          ) : (
            <div className="service-grid">
              {services.map((service) => (
                <article className="service-card" key={service.id}>
                  <div className="service-topline">
                    <span className="pill">{service.category}</span>
                    <span className="rating">★ {service.rating}</span>
                  </div>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                  <div className="service-meta">
                    <span>{service.provider}</span>
                    <span>{service.city}</span>
                  </div>
                  <div className="service-footer">
                    <strong>R{service.price}</strong>
                    <div className="service-actions">
                      <button onClick={() => {
                        setSelectedProviderId(service.providerId);
                        setView('provider');
                      }}>Profile</button>
                      <button className="primary-button small" onClick={() => {
                        setSelectedService(service);
                        setSelectedProviderId(service.providerId);
                        setView('booking');
                      }}>Book</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section id="how-it-works" className="steps-section">
          <div className="section-heading">
            <h2>How it works</h2>
          </div>

          <div className="steps-grid">
            <div>
              <span>1</span>
              <h3>Browse</h3>
              <p>Search trusted providers by service, city, or category.</p>
            </div>
            <div>
              <span>2</span>
              <h3>Book</h3>
              <p>Choose a convenient slot and confirm your service request.</p>
            </div>
            <div>
              <span>3</span>
              <h3>Review</h3>
              <p>Track progress, pay securely, and leave feedback after the job.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );

  const renderLogin = () => (
    <div className="auth-page">
      <div className="auth-card">
        <button className="back-button" onClick={() => setView('home')}>← Back</button>
        <p className="eyebrow">Welcome back</p>
        <h1>Login to Task-IT</h1>

        <form
          className="auth-form"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            handleLogin({
              name: form.get('name') || 'Nandi M.',
              email: form.get('email') || 'customer@example.com',
              role: form.get('role') || 'Customer'
            });
          }}
        >
          <label>
            Full name
            <input name="name" defaultValue="Nandi M." required />
          </label>

          <label>
            Email address
            <input name="email" type="email" defaultValue="nandi@example.com" required />
          </label>

          <label>
            Account type
            <select name="role" defaultValue="Customer">
              <option value="Customer">Customer</option>
              <option value="Provider">Provider</option>
            </select>
          </label>

          <label>
            Password
            <input name="password" type="password" defaultValue="password123" required />
          </label>

          <button className="primary-button" type="submit">Continue</button>
        </form>
      </div>
    </div>
  );

  const renderProvider = () => {
    if (!selectedProvider) {
      return (
        <div className="empty-state">
          <h2>No provider selected</h2>
          <button className="primary-button" onClick={() => setView('home')}>Back to marketplace</button>
        </div>
      );
    }

    return (
      <div className="page-shell provider-page">
        <button className="back-button" onClick={() => setView('home')}>← Back</button>

        <div className="provider-hero">
          <div className="provider-image large" style={{ backgroundImage: `url(${selectedProvider.heroImage})` }} />
          <div className="provider-summary">
            <span className="pill">{selectedProvider.category}</span>
            <h1>{selectedProvider.name}</h1>
            <p>{selectedProvider.city}</p>
            <div className="provider-meta-row">
              <span>★ {selectedProvider.rating}</span>
              <span>{selectedProvider.reviewCount}+ reviews</span>
              <span>{selectedProvider.responseTime}</span>
            </div>
            <p>{selectedProvider.bio}</p>
            <div className="provider-badges">
              {selectedProvider.specialties.map((specialty) => (
                <span key={specialty}>{specialty}</span>
              ))}
            </div>
            <button
              className="primary-button"
              onClick={() => {
                const firstService = services.find((service) => service.providerId === selectedProvider.id);
                setSelectedService(firstService || null);
                setView('booking');
              }}
            >
              Book with {selectedProvider.name}
            </button>
          </div>
        </div>

        <section className="provider-cards-row">
          <div className="info-card">
            <h3>Experience</h3>
            <p>{selectedProvider.experience}</p>
          </div>
          <div className="info-card">
            <h3>Availability</h3>
            <p>{selectedProvider.availability.join(', ')}</p>
          </div>
          <div className="info-card">
            <h3>Starting price</h3>
            <p>{selectedProvider.pricing}</p>
          </div>
        </section>

        <section className="services-section">
          <div className="section-heading">
            <h2>Services offered</h2>
          </div>

          <div className="service-grid">
            {services
              .filter((service) => service.providerId === selectedProvider.id)
              .map((service) => (
                <article className="service-card" key={service.id}>
                  <div className="service-topline">
                    <span className="pill">{service.category}</span>
                    <span className="rating">★ {service.rating}</span>
                  </div>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                  <div className="service-footer">
                    <strong>R{service.price}</strong>
                    <button className="primary-button small" onClick={() => {
                      setSelectedService(service);
                      setView('booking');
                    }}>Book now</button>
                  </div>
                </article>
              ))}
          </div>
        </section>
      </div>
    );
  };

  const renderBooking = () => {
    if (!selectedProvider || !selectedService) {
      return (
        <div className="empty-state">
          <h2>Select a service first</h2>
          <button className="primary-button" onClick={() => setView('home')}>Go to marketplace</button>
        </div>
      );
    }

    return (
      <div className="page-shell booking-page">
        <button className="back-button" onClick={() => setView('provider')}>← Back</button>

        <div className="booking-card">
          <div className="booking-header">
            <div>
              <p className="eyebrow">Booking request</p>
              <h1>{selectedService.title}</h1>
            </div>
            <div className="price-tag">R{selectedService.price}</div>
          </div>

          <form
            className="booking-form"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              handleBookingSubmit({
                customerName: form.get('customerName') || user?.name || 'Guest customer',
                customerEmail: form.get('customerEmail') || user?.email || 'guest@example.com',
                date: form.get('date'),
                time: form.get('time'),
                notes: form.get('notes')
              });
            }}
          >
            <div className="booking-grid">
              <label>
                Full name
                <input name="customerName" defaultValue={user?.name || 'Nandi M.'} required />
              </label>

              <label>
                Email
                <input name="customerEmail" type="email" defaultValue={user?.email || 'nandi@example.com'} required />
              </label>

              <label>
                Preferred date
                <input name="date" type="date" required />
              </label>

              <label>
                Preferred time
                <input name="time" type="time" required />
              </label>
            </div>

            <label>
              Optional notes
              <textarea name="notes" rows="4" placeholder="Tell the provider about your requirements" />
            </label>

            <div className="booking-summary-box">
              <div>
                <span>Service</span>
                <strong>{selectedService.title}</strong>
              </div>
              <div>
                <span>Provider</span>
                <strong>{selectedProvider.name}</strong>
              </div>
              <div>
                <span>Location</span>
                <strong>{selectedProvider.city}</strong>
              </div>
            </div>

            <button type="submit" className="primary-button">Confirm booking</button>
          </form>
        </div>
      </div>
    );
  };

  const renderConfirmation = () => (
    <div className="page-shell confirmation-page">
      <div className="confirmation-card">
        <div className="confirmation-badge">Confirmed</div>
        <h1>Your booking is ready</h1>
        <p>
          {bookingSummary?.service} with {bookingSummary?.provider} has been scheduled successfully.
        </p>

        <div className="confirmation-summary">
          <div>
            <span>Booking ID</span>
            <strong>{bookingSummary?.bookingId || 'TK-1024'}</strong>
          </div>
          <div>
            <span>Date</span>
            <strong>{bookingSummary?.date || 'TBD'}</strong>
          </div>
          <div>
            <span>Time</span>
            <strong>{bookingSummary?.time || 'TBD'}</strong>
          </div>
          <div>
            <span>Total</span>
            <strong>{bookingSummary?.total || 'R0'}</strong>
          </div>
        </div>

        <button className="primary-button" onClick={() => setView('home')}>Back to marketplace</button>
      </div>
    </div>
  );

  if (view === 'login') return renderLogin();
  if (view === 'provider') return renderProvider();
  if (view === 'booking') return renderBooking();
  if (view === 'confirmation') return renderConfirmation();

  return renderHome();
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
