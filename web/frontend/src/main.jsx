import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

function App() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('taskit-session'));
    } catch {
      return null;
    }
  });
  const [accountBookings, setAccountBookings] = useState([]);
  const [accountTotals, setAccountTotals] = useState(null);
  const [accountError, setAccountError] = useState('');
  const [accountLoading, setAccountLoading] = useState(false);
  const [view, setView] = useState('home');
  const [selectedProviderId, setSelectedProviderId] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [bookingSummary, setBookingSummary] = useState(null);
  const user = session?.user || null;
  const token = session?.token || '';

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

  useEffect(() => {
    if (!session || !['customer-bookings', 'provider-dashboard'].includes(view)) return;

    const loadAccount = async () => {
      setAccountLoading(true);
      setAccountError('');
      const endpoint = user.role === 'Provider'
        ? '/api/provider/dashboard'
        : '/api/bookings/mine';

      try {
        const response = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Could not load account data');
        setAccountBookings(user.role === 'Provider' ? result.bookings : result.bookings);
        setAccountTotals(result.totals || null);
      } catch (error) {
        setAccountError(error.message);
      } finally {
        setAccountLoading(false);
      }
    };

    loadAccount();
  }, [session, token, user?.role, view]);

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

  const handleLogin = async (form) => {
    setAccountError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Sign in failed');
      const nextSession = { user: result.user, token: result.token };
      localStorage.setItem('taskit-session', JSON.stringify(nextSession));
      setSession(nextSession);
      setView(selectedService && result.user.role === 'Customer'
        ? 'booking'
        : result.user.role === 'Provider' ? 'provider-dashboard' : 'home');
    } catch (error) {
      setAccountError(error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('taskit-session');
    setSession(null);
    setAccountBookings([]);
    setAccountTotals(null);
    setView('home');
  };

  const updateBookingStatus = async (bookingId, status) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not update booking');
      setAccountBookings((bookings) => bookings.map((booking) =>
        booking.id === bookingId ? { ...booking, status: result.booking.status } : booking
      ));
      const dashboardResponse = await fetch('/api/provider/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dashboard = await dashboardResponse.json();
      if (dashboardResponse.ok) {
        setAccountBookings(dashboard.bookings);
        setAccountTotals(dashboard.totals);
      }
    } catch (error) {
      setAccountError(error.message);
    }
  };

  const handleBookingSubmit = async (booking) => {
    const payload = {
      providerId: selectedProvider.id,
      serviceId: selectedService.id,
      date: booking.date,
      time: booking.time,
      notes: booking.notes
    };

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Booking failed');
      setBookingSummary(result.booking);
      setView('confirmation');
    } catch (error) {
      console.error('Booking failed:', error);
      setAccountError(error.message);
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
          {user && (
            <button onClick={() => setView(user.role === 'Provider' ? 'provider-dashboard' : 'customer-bookings')}>
              {user.role === 'Provider' ? 'Provider dashboard' : 'My bookings'}
            </button>
          )}
          <button onClick={() => user ? handleLogout() : setView('login')}>
            {user ? 'Sign out' : 'Login'}
          </button>
          <button onClick={() => {
            setSelectedProviderId(providers[0]?.id || null);
            setView('provider');
          }}>Providers</button>
        </nav>

        <button className="primary-button" onClick={() => {
          if (user) setView(user.role === 'Provider' ? 'provider-dashboard' : 'customer-bookings');
          else setView('login');
        }}>
          {user ? user.name.split(' ')[0] : 'Book a service'}
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
                        setView(user?.role === 'Customer' ? 'booking' : 'login');
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
            handleLogin({ email: form.get('email'), password: form.get('password'), role: form.get('role') });
          }}
        >
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
            <input name="password" type="password" defaultValue="taskit-demo" required />
          </label>

          <p className="form-hint">Demo customer: nandi@example.com. Provider: anele@taskit.test. Password: taskit-demo.</p>
          {accountError && <p className="form-error" role="alert">{accountError}</p>}
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
                setView(user?.role === 'Customer' ? 'booking' : 'login');
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
                      setView(user?.role === 'Customer' ? 'booking' : 'login');
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
            {accountError && <p className="form-error" role="alert">{accountError}</p>}
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

  const renderCustomerBookings = () => (
    <div className="page-shell account-page">
      <header className="account-heading">
        <div>
          <p className="eyebrow">Customer account</p>
          <h1>My bookings</h1>
          <p>Track upcoming requests and revisit completed services.</p>
        </div>
        <button className="back-button" onClick={() => setView('home')}>Back to marketplace</button>
      </header>

      {accountLoading ? <p className="status-copy">Loading your bookings...</p> : null}
      {accountError && <p className="form-error" role="alert">{accountError}</p>}
      {!accountLoading && !accountError && accountBookings.length === 0 && (
        <div className="empty-bookings">
          <h2>No bookings yet</h2>
          <p>When you book a service, its status and details will appear here.</p>
          <button className="primary-button" onClick={() => setView('home')}>Browse services</button>
        </div>
      )}

      <div className="booking-list">
        {accountBookings.map((booking) => (
          <article className="booking-row" key={booking.id}>
            <div className="booking-row-main">
              <div>
                <span className={`status-chip status-${booking.status.toLowerCase()}`}>{booking.status}</span>
                <h2>{booking.service_title}</h2>
                <p>{booking.provider_name} · {booking.provider_city}</p>
              </div>
              <strong>R{booking.service_price}</strong>
            </div>
            <div className="booking-row-detail">
              <span>{booking.date} at {booking.time}</span>
              <span>Booking #{booking.id}</span>
            </div>
            {booking.notes && <p className="booking-notes">{booking.notes}</p>}
          </article>
        ))}
      </div>
    </div>
  );

  const renderProviderDashboard = () => (
    <div className="page-shell account-page">
      <header className="account-heading">
        <div>
          <p className="eyebrow">Provider workspace</p>
          <h1>{user?.name} dashboard</h1>
          <p>Manage booking requests and track completed work.</p>
        </div>
        <button className="back-button" onClick={() => setView('home')}>Marketplace</button>
      </header>

      {accountLoading ? <p className="status-copy">Loading dashboard...</p> : null}
      {accountError && <p className="form-error" role="alert">{accountError}</p>}

      <section className="dashboard-metrics">
        <div><span>All bookings</span><strong>{accountTotals?.total || 0}</strong></div>
        <div><span>Waiting for you</span><strong>{accountTotals?.pending || 0}</strong></div>
        <div><span>Accepted</span><strong>{accountTotals?.accepted || 0}</strong></div>
        <div><span>Completed earnings</span><strong>R{accountTotals?.earnings || 0}</strong></div>
      </section>

      <div className="section-heading">
        <h2>Booking requests</h2>
        <span>{accountBookings.length} total</span>
      </div>

      {!accountLoading && accountBookings.length === 0 && (
        <div className="empty-bookings">
          <h2>Nothing to manage yet</h2>
          <p>New customer requests for your services will appear here.</p>
        </div>
      )}

      <div className="booking-list">
        {accountBookings.map((booking) => (
          <article className="booking-row" key={booking.id}>
            <div className="booking-row-main">
              <div>
                <span className={`status-chip status-${booking.status.toLowerCase()}`}>{booking.status}</span>
                <h2>{booking.service_title}</h2>
                <p>{booking.customer_name} · {booking.customer_email}</p>
              </div>
              <strong>R{booking.service_price}</strong>
            </div>
            <div className="booking-row-detail">
              <span>{booking.date} at {booking.time}</span>
              <span>Booking #{booking.id}</span>
            </div>
            {booking.notes && <p className="booking-notes">{booking.notes}</p>}
            {booking.status === 'Pending' && (
              <div className="booking-actions">
                <button className="quiet-button" onClick={() => updateBookingStatus(booking.id, 'Declined')}>Decline</button>
                <button className="primary-button small" onClick={() => updateBookingStatus(booking.id, 'Accepted')}>Accept request</button>
              </div>
            )}
            {booking.status === 'Accepted' && (
              <div className="booking-actions">
                <button className="primary-button small" onClick={() => updateBookingStatus(booking.id, 'Completed')}>Mark complete</button>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );

  const renderConfirmation = () => (
    <div className="page-shell confirmation-page">
      <div className="confirmation-card">
        <div className="confirmation-badge">Request submitted</div>
        <h1>Your booking request is in</h1>
        <p>
          {bookingSummary?.service_title} with {bookingSummary?.provider_name} is waiting for provider confirmation.
        </p>

        <div className="confirmation-summary">
          <div>
            <span>Booking ID</span>
            <strong>#{bookingSummary?.id}</strong>
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
            <strong>R{bookingSummary?.service_price || 0}</strong>
          </div>
        </div>

        <button className="primary-button" onClick={() => setView('customer-bookings')}>View my bookings</button>
      </div>
    </div>
  );

  if (view === 'login') return renderLogin();
  if (view === 'provider') return renderProvider();
  if (view === 'booking') return renderBooking();
  if (view === 'customer-bookings') return renderCustomerBookings();
  if (view === 'provider-dashboard') return renderProviderDashboard();
  if (view === 'confirmation') return renderConfirmation();

  return renderHome();
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
