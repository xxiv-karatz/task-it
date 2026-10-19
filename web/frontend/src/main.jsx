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
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationRole, setRegistrationRole] = useState('Customer');
  const [adminSummary, setAdminSummary] = useState(null);
  const [adminBookings, setAdminBookings] = useState([]);
  const [adminCategories, setAdminCategories] = useState([]);
  const [adminProviders, setAdminProviders] = useState([]);
  const [adminServices, setAdminServices] = useState([]);
  const [adminError, setAdminError] = useState('');
  const [adminNotice, setAdminNotice] = useState('');
  const [legalPage, setLegalPage] = useState('terms');
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
  }, [query, view]);

  useEffect(() => {
    if (!session?.token) return;
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${session.token}` } })
      .then((response) => {
        if (response.ok) return;
        localStorage.removeItem('taskit-session');
        setSession(null);
      })
      .catch(() => {
        localStorage.removeItem('taskit-session');
        setSession(null);
      });
  }, []);

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

  useEffect(() => {
    if (view !== 'admin-dashboard' || user?.role !== 'Admin') return;

    const loadAdmin = async () => {
      setAccountLoading(true);
      setAdminError('');
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const responses = await Promise.all([
          fetch('/api/admin/summary', { headers }),
          fetch('/api/admin/categories', { headers }),
          fetch('/api/admin/providers', { headers }),
          fetch('/api/admin/services', { headers }),
          fetch('/api/admin/bookings', { headers })
        ]);
        const results = await Promise.all(responses.map((response) => response.json()));
        const failed = responses.findIndex((response) => !response.ok);
        if (failed >= 0) throw new Error(results[failed].message || 'Could not load admin data');
        setAdminSummary(results[0]);
        setAdminCategories(results[1]);
        setAdminProviders(results[2]);
        setAdminServices(results[3]);
        setAdminBookings(results[4]);
      } catch (error) {
        setAdminError(error.message);
      } finally {
        setAccountLoading(false);
      }
    };

    loadAdmin();
  }, [view, token, user?.role]);

  const filteredProviders = useMemo(() => {
    if (!query) return providers;

    const haystack = query.toLowerCase();
    return providers.filter((provider) =>
      [provider.name, provider.city, provider.category, provider.specialties]
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
      const response = await fetch(isRegistering ? '/api/auth/register' : '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isRegistering
          ? { ...form, role: registrationRole, acceptedPolicies: form.acceptedPolicies === 'on' }
          : form)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Sign in failed');
      const nextSession = { user: result.user, token: result.token };
      localStorage.setItem('taskit-session', JSON.stringify(nextSession));
      setSession(nextSession);
      setView(result.user.role === 'Admin'
        ? 'admin-dashboard'
        : selectedService && result.user.role === 'Customer'
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
    setAdminSummary(null);
    setAdminBookings([]);
    setView('home');
  };

  const adminRequest = async (path, options = {}) => {
    const response = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers
      }
    });
    const result = response.status === 204 ? null : await response.json();
    if (!response.ok) throw new Error(result?.message || 'Admin action failed');
    return result;
  };

  const reloadAdmin = () => {
    setView('home');
    requestAnimationFrame(() => setView('admin-dashboard'));
  };

  const submitAdminForm = async (event, path, method = 'POST', successMessage = 'Saved') => {
    event.preventDefault();
    const form = event.currentTarget;
    setAdminError('');
    setAdminNotice('');
    const values = Object.fromEntries(new FormData(form).entries());
    try {
      await adminRequest(path, { method, body: JSON.stringify(values) });
      form.reset();
      setAdminNotice(successMessage);
      reloadAdmin();
    } catch (error) {
      setAdminError(error.message);
    }
  };

  const saveProvider = async (event, provider) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      await adminRequest(`/api/admin/providers/${provider.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ ...values, isActive: values.isActive === 'on' })
      });
      setAdminNotice('Provider profile updated');
      reloadAdmin();
    } catch (error) {
      setAdminError(error.message);
    }
  };

  const saveService = async (event, service) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      await adminRequest(`/api/admin/services/${service.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ ...values, isActive: values.isActive === 'on' })
      });
      setAdminNotice('Service listing updated');
      reloadAdmin();
    } catch (error) {
      setAdminError(error.message);
    }
  };

  const deleteAdminRecord = async (path, successMessage) => {
    setAdminError('');
    try {
      await adminRequest(path, { method: 'DELETE' });
      setAdminNotice(successMessage);
      reloadAdmin();
    } catch (error) {
      setAdminError(error.message);
    }
  };

  const changeAdminBookingStatus = async (bookingId, status) => {
    try {
      await adminRequest(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      setAdminNotice(`Booking #${bookingId} updated`);
      reloadAdmin();
    } catch (error) {
      setAdminError(error.message);
    }
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
          <img className="brand-mark" src="/favicon.svg" alt="" aria-hidden="true" />
          <span>Task-IT</span>
        </div>

        <nav className="nav-links">
          <button onClick={() => setView('home')}>Browse</button>
          {user && (
            <button onClick={() => setView(user.role === 'Admin' ? 'admin-dashboard' : user.role === 'Provider' ? 'provider-dashboard' : 'customer-bookings')}>
              {user.role === 'Admin' ? 'Admin' : user.role === 'Provider' ? 'Provider dashboard' : 'My bookings'}
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
          if (user) setView(user.role === 'Admin' ? 'admin-dashboard' : user.role === 'Provider' ? 'provider-dashboard' : 'customer-bookings');
          else setView('login');
        }}>
          {user ? user.name?.split(' ')[0] || 'Admin' : 'Sign in'}
        </button>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Task-IT marketplace</p>
            <h1>Find a local service. Make it yours.</h1>
            <p className="lead">
              Browse service listings, compare details, and send a booking request directly to a provider.
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

        </section>

        <section className="categories-section">
          <div className="section-heading">
            <h2>Popular categories</h2>
          </div>

          <div className="category-list">
            {categories.map((category) => (
              <div className="category-card" key={category.name}>
                <span>{category.name}</span>
                <strong>{category.serviceCount} services</strong>
              </div>
            ))}
          </div>
          {!loading && categories.length === 0 && <p className="status-copy">No categories have been added yet.</p>}
        </section>

        <section className="provider-highlight">
          <div className="section-heading">
            <h2>Provider profiles</h2>
          </div>

          <div className="provider-grid">
            {filteredProviders.filter((provider) => provider.isActive).map((provider) => (
              <div className="provider-card" key={provider.id}>
                {provider.heroImage && <div className="provider-image" style={{ backgroundImage: `url(${provider.heroImage})` }} />}
                <div className="provider-copy">
                  <div className="provider-topline">
                    <span>{provider.category}</span>
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
          {!loading && filteredProviders.filter((provider) => provider.isActive).length === 0 && (
            <p className="status-copy">No provider profiles are listed yet.</p>
          )}
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
              <p>Search provider listings by service, city, or category.</p>
            </div>
            <div>
              <span>2</span>
              <h3>Book</h3>
              <p>Choose a convenient slot and confirm your service request.</p>
            </div>
            <div>
              <span>3</span>
              <h3>Track</h3>
              <p>Follow the booking request as the provider responds and completes the work.</p>
            </div>
          </div>
        </section>
        <footer className="site-footer">
          <span>Task-IT marketplace</span>
          <div>
            <button onClick={() => { setLegalPage('terms'); setView('legal'); }}>Terms of service</button>
            <button onClick={() => { setLegalPage('privacy'); setView('legal'); }}>Privacy policy</button>
            {!user && <button onClick={() => { setIsRegistering(false); setView('login'); }}>Admin sign in</button>}
          </div>
        </footer>
      </main>
    </div>
  );

  const renderLogin = () => (
    <div className="auth-page">
      <div className="auth-card">
        <button className="back-button" onClick={() => setView('home')}>← Back</button>
        <p className="eyebrow">{isRegistering ? 'Create your account' : 'Account access'}</p>
        <h1>{isRegistering ? 'Join Task-IT' : 'Sign in to Task-IT'}</h1>

        <form
          className="auth-form"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            handleLogin(Object.fromEntries(form.entries()));
          }}
        >
          {isRegistering && <label>Full name<input name="name" autoComplete="name" required />
          </label>}
          {isRegistering && (
            <label>Account type
              <select value={registrationRole} onChange={(event) => setRegistrationRole(event.target.value)}>
                <option value="Customer">Customer</option>
                <option value="Provider">Provider</option>
              </select>
            </label>
          )}
          <label>
            Email address
            <input name="email" type="email" autoComplete="email" required />
          </label>

          {isRegistering && registrationRole === 'Provider' && (
            <>
              <label>City<input name="city" autoComplete="address-level2" required /></label>
              <label>Service category
                <select name="categoryId" required defaultValue="">
                  <option value="" disabled>Select category</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>
              <label>About your services<textarea name="bio" rows="3" maxLength="2000" placeholder="Describe your experience and the services you offer" /></label>
              <label>Pricing information<input name="pricing" maxLength="200" placeholder="For example, hourly rate or starting price" /></label>
              <label>Specialties<input name="specialties" maxLength="500" placeholder="Separate specialties with commas" /></label>
              <label>Availability<input name="availability" maxLength="500" placeholder="Days and times you are usually available" /></label>
              {categories.length === 0 && <p className="form-hint">No categories are available yet. An administrator needs to add a category before providers can register.</p>}
            </>
          )}

          {!isRegistering && <label>
            Account type
            <select name="role" defaultValue="Customer">
              <option value="Customer">Customer</option>
              <option value="Provider">Provider</option>
              <option value="Admin">Admin</option>
            </select>
          </label>}

          <label>
            Password
            <input name="password" type="password" autoComplete={isRegistering ? 'new-password' : 'current-password'} minLength={10} required />
          </label>

          {isRegistering && <label className="policy-consent"><input type="checkbox" name="acceptedPolicies" required />
            <span>I agree to the <button type="button" onClick={() => { setLegalPage('terms'); setView('legal'); }}>Terms of Service</button> and acknowledge the <button type="button" onClick={() => { setLegalPage('privacy'); setView('legal'); }}>Privacy Policy</button>.</span>
          </label>}
          {accountError && <p className="form-error" role="alert">{accountError}</p>}
          <button className="primary-button" type="submit">{isRegistering ? 'Create account' : 'Sign in'}</button>
        </form>
        <button className="text-button" onClick={() => { setIsRegistering(!isRegistering); setAccountError(''); }}>
          {isRegistering ? 'Already have an account? Sign in' : 'Create a customer account'}
        </button>
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
          {selectedProvider.heroImage && <div className="provider-image large" style={{ backgroundImage: `url(${selectedProvider.heroImage})` }} />}
          <div className="provider-summary">
            <span className="pill">{selectedProvider.category}</span>
            <h1>{selectedProvider.name}</h1>
            <p>{selectedProvider.city}</p>
            <p>{selectedProvider.bio}</p>
            <div className="provider-badges">
              {(selectedProvider.specialties || '').split(',').map((specialty) => specialty.trim()).filter(Boolean).map((specialty) => (
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
            <h3>Pricing</h3>
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
                <input value={user?.name || ''} readOnly />
              </label>

              <label>
                Email
                <input value={user?.email || ''} type="email" readOnly />
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

  const renderAdminDashboard = () => (
    <div className="page-shell admin-page">
      <header className="account-heading">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>Marketplace management</h1>
          <p>Manage the records shown in the live marketplace.</p>
        </div>
        <button className="back-button" onClick={handleLogout}>Sign out</button>
      </header>

      {adminError && <p className="form-error" role="alert">{adminError}</p>}
      {adminNotice && <p className="admin-notice" role="status">{adminNotice}</p>}
      {accountLoading && <p className="status-copy">Loading marketplace records...</p>}

      <section className="dashboard-metrics admin-metrics">
        <div><span>Providers</span><strong>{adminSummary?.providers || 0}</strong></div>
        <div><span>Services</span><strong>{adminSummary?.services || 0}</strong></div>
        <div><span>Categories</span><strong>{adminSummary?.categories || 0}</strong></div>
        <div><span>Bookings</span><strong>{adminSummary?.bookings || 0}</strong></div>
      </section>

      <section className="admin-section">
        <div className="section-heading"><h2>Categories</h2></div>
        <form className="admin-inline-form" onSubmit={(event) => submitAdminForm(event, '/api/admin/categories', 'POST', 'Category created')}>
          <label>New category<input name="name" maxLength="80" placeholder="Category name" required /></label>
          <button className="primary-button small" type="submit">Add category</button>
        </form>
        <div className="admin-tag-list">
          {adminCategories.map((category) => (
            <div className="admin-tag" key={category.id}>
              <span>{category.name} <small>{category.serviceCount ?? 0} services</small></span>
              <button className="quiet-button" onClick={() => deleteAdminRecord(`/api/admin/categories/${category.id}`, 'Category deleted')}>Delete</button>
            </div>
          ))}
          {adminCategories.length === 0 && <p className="status-copy">Create a category before adding provider listings.</p>}
        </div>
      </section>

      <section className="admin-section">
        <div className="section-heading"><h2>Providers</h2></div>
        <form className="admin-form" onSubmit={(event) => submitAdminForm(event, '/api/admin/providers', 'POST', 'Provider account created')}>
          <label>Provider name<input name="name" required /></label>
          <label>Sign-in email<input name="email" type="email" required /></label>
          <label>Temporary password<input name="password" type="password" minLength="10" required /></label>
          <label>City<input name="city" required /></label>
          <label>Category<select name="categoryId" required defaultValue=""><option value="" disabled>Select category</option>{adminCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <label>Pricing details<input name="pricing" placeholder="Pricing details (optional)" /></label>
          <label className="wide-field">Profile description<textarea name="bio" rows="3" /></label>
          <label>Specialties<input name="specialties" placeholder="Comma-separated (optional)" /></label>
          <label>Availability<input name="availability" placeholder="Provider-entered availability" /></label>
          <button className="primary-button" type="submit">Create provider</button>
        </form>

        <div className="admin-record-list">
          {adminProviders.map((provider) => (
            <form className="admin-record" key={provider.id} onSubmit={(event) => saveProvider(event, provider)}>
              <div className="admin-record-title"><strong>{provider.name}</strong><span>{provider.isActive ? 'Active' : 'Inactive'}</span></div>
              <div className="admin-form compact-form">
                <label>Name<input name="name" defaultValue={provider.name} required /></label>
                <label>City<input name="city" defaultValue={provider.city} required /></label>
                <label>Category<select name="categoryId" defaultValue={provider.categoryId} required>{adminCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
                <label>Pricing<input name="pricing" defaultValue={provider.pricing} /></label>
                <label className="wide-field">Description<textarea name="bio" rows="2" defaultValue={provider.bio} /></label>
                <label>Specialties<input name="specialties" defaultValue={provider.specialties} /></label>
                <label>Availability<input name="availability" defaultValue={provider.availability} /></label>
                <label className="admin-checkbox"><input type="checkbox" name="isActive" defaultChecked={Boolean(provider.isActive)} /> Public listing active</label>
              </div>
              <button className="quiet-button" type="submit">Save provider</button>
              <button className="quiet-button danger-action" type="button" onClick={() => deleteAdminRecord(`/api/admin/providers/${provider.id}`, 'Provider removed')}>Delete</button>
            </form>
          ))}
          {adminProviders.length === 0 && <p className="status-copy">No provider records yet.</p>}
        </div>
      </section>

      <section className="admin-section">
        <div className="section-heading"><h2>Service listings</h2></div>
        <form className="admin-form" onSubmit={(event) => submitAdminForm(event, '/api/admin/services', 'POST', 'Service listing created')}>
          <label>Provider<select name="providerId" required defaultValue=""><option value="" disabled>Select provider</option>{adminProviders.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}</select></label>
          <label>Category<select name="categoryId" required defaultValue=""><option value="" disabled>Select category</option>{adminCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <label>Service title<input name="title" required /></label>
          <label>Price (ZAR)<input name="price" type="number" min="0" step="1" required /></label>
          <label className="wide-field">Description<textarea name="description" rows="3" /></label>
          <button className="primary-button" type="submit">Add service</button>
        </form>

        <div className="admin-record-list">
          {adminServices.map((service) => (
            <form className="admin-record" key={service.id} onSubmit={(event) => saveService(event, service)}>
              <div className="admin-record-title"><strong>{service.title}</strong><span>{service.provider} · {service.isActive ? 'Active' : 'Inactive'}</span></div>
              <div className="admin-form compact-form">
                <label>Provider<select name="providerId" defaultValue={service.providerId} required>{adminProviders.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}</select></label>
                <label>Category<select name="categoryId" defaultValue={service.categoryId} required>{adminCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
                <label>Title<input name="title" defaultValue={service.title} required /></label>
                <label>Price (ZAR)<input name="price" type="number" min="0" step="1" defaultValue={service.price} required /></label>
                <label className="wide-field">Description<textarea name="description" rows="2" defaultValue={service.description} /></label>
                <label className="admin-checkbox"><input type="checkbox" name="isActive" defaultChecked={Boolean(service.isActive)} /> Public listing active</label>
              </div>
              <button className="quiet-button" type="submit">Save service</button>
              <button className="quiet-button danger-action" type="button" onClick={() => deleteAdminRecord(`/api/admin/services/${service.id}`, 'Service removed')}>Delete</button>
            </form>
          ))}
          {adminServices.length === 0 && <p className="status-copy">No service listings yet.</p>}
        </div>
      </section>

      <section className="admin-section">
        <div className="section-heading"><h2>Bookings</h2><span>{adminBookings.length}</span></div>
        <div className="booking-list">
          {adminBookings.map((booking) => (
            <article className="booking-row" key={booking.id}>
              <div className="booking-row-main">
                <div><span className={`status-chip status-${booking.status.toLowerCase()}`}>{booking.status}</span><h2>{booking.serviceTitle}</h2><p>{booking.customerName} · {booking.providerName}</p></div>
                <strong>R{booking.servicePrice}</strong>
              </div>
              <div className="booking-row-detail"><span>{booking.date} at {booking.time}</span><span>Booking #{booking.id}</span></div>
              <label className="status-control">Booking status<select value={booking.status} onChange={(event) => changeAdminBookingStatus(booking.id, event.target.value)}><option>Pending</option><option>Accepted</option><option>Completed</option><option>Declined</option></select></label>
            </article>
          ))}
          {adminBookings.length === 0 && <p className="status-copy">No booking records yet.</p>}
        </div>
      </section>
    </div>
  );

  const renderLegal = () => (
    <div className="page-shell legal-page">
      <header className="legal-header">
        <button className="back-button" onClick={() => setView('login')}>← Back</button>
        <div className="legal-tabs" role="tablist" aria-label="Legal documents">
          <button className={legalPage === 'terms' ? 'selected' : ''} onClick={() => setLegalPage('terms')}>Terms of Service</button>
          <button className={legalPage === 'privacy' ? 'selected' : ''} onClick={() => setLegalPage('privacy')}>Privacy Policy</button>
        </div>
      </header>

      {legalPage === 'terms' ? (
        <article className="legal-copy">
          <p className="eyebrow">Effective 19 October 2026 · Draft for review</p>
          <h1>Terms of Service</h1>
          <p>These terms describe the current Task-IT marketplace service. By creating an account or using the marketplace, you agree to them. These draft terms are not legal advice and should be reviewed by a South African lawyer before public launch.</p>
          <h2>1. What Task-IT provides</h2>
          <p>Task-IT provides online tools for customers to discover provider listings and request services. Task-IT is not currently a payment processor, employer, or party to the service contract between a customer and provider. Payments are not collected through this MVP.</p>
          <h2>2. Accounts and accurate information</h2>
          <p>You must provide accurate account and listing information, keep your sign-in credentials private, and tell us promptly if you suspect unauthorized access. You are responsible for activity performed using your account.</p>
          <h2>3. Booking requests</h2>
          <p>A booking submitted through the app is a request, not a confirmed appointment. It becomes accepted only when the provider updates its status. Customers and providers are responsible for agreeing on scope, access, timing, price changes, and any cancellation arrangements directly.</p>
          <h2>4. Providers and service arrangements</h2>
          <p>Providers are independent service providers. A listing is not a guarantee of identity, qualifications, availability, quality, or suitability. Customers should verify credentials and agree the work details before proceeding. Task-IT does not currently conduct identity or professional-license verification.</p>
          <h2>5. Safe and lawful use</h2>
          <p>Do not use the service for unlawful, misleading, abusive, discriminatory, fraudulent, or unsafe activity. Do not post another person’s private information without permission or attempt to access accounts or data that are not yours.</p>
          <h2>6. Content and listing moderation</h2>
          <p>Administrators may correct, suspend, or remove listings and accounts that are inaccurate, unlawful, unsafe, or inconsistent with these terms. We may limit access while investigating a report.</p>
          <h2>7. Availability and liability</h2>
          <p>The MVP is provided while it is being developed and may be changed or unavailable. To the extent permitted by law, Task-IT is not responsible for disputes, loss, injury, damage, or service outcomes arising from arrangements between customers and providers. Nothing in these terms limits rights that cannot lawfully be excluded under South African law.</p>
          <h2>8. Suspension and termination</h2>
          <p>You may stop using the service at any time. Task-IT may suspend or close access for security, legal, operational, or terms-enforcement reasons. Booking and account records may be retained where required for legitimate operational or legal purposes.</p>
          <h2>9. Changes and contact</h2>
          <p>We will publish updated terms in the app. The effective date above identifies this version. For account or service questions, use the operator’s published contact details.</p>
        </article>
      ) : (
        <article className="legal-copy">
          <p className="eyebrow">Effective 19 October 2026 · Draft for review</p>
          <h1>Privacy Policy</h1>
          <p>This policy explains how the current Task-IT MVP handles personal information. It is a draft for transparency, not legal advice, and must be reviewed for compliance with South Africa’s Protection of Personal Information Act (POPIA) before public launch.</p>
          <h2>1. Information we handle</h2>
          <p>Account information includes your name, email address, account type, and a protected password hash. Booking information includes the selected provider and service, requested date and time, notes you submit, and booking status. Provider listings contain the profile and service details entered by the provider or an administrator.</p>
          <h2>2. How information is used</h2>
          <p>Information is used to create and secure accounts, display marketplace listings, submit and manage booking requests, support customer-provider communication about a request, and operate or protect the service.</p>
          <h2>3. Storage and sharing</h2>
          <p>This local MVP stores data in a SQLite database controlled by the operator. Booking details are visible to the customer who made the request and the provider associated with it; administrators can access marketplace records to operate the service. The MVP does not currently integrate payment processing or advertising services.</p>
          <h2>4. Browser storage and security</h2>
          <p>A sign-in token is stored in your browser’s local storage to keep you signed in. Anyone with access to your browser session may be able to use your account. Passwords are stored as hashes, but no internet-connected system can be guaranteed completely secure. Do not reuse a password you use elsewhere.</p>
          <h2>5. Retention and your choices</h2>
          <p>Account and booking records are retained in the operator’s database until they are removed or retention is required for operational or legal reasons. You may request access to or correction or deletion of personal information using the operator’s published contact details, subject to applicable legal obligations.</p>
          <h2>6. Children</h2>
          <p>The service is intended for people able to enter into service arrangements. A parent or guardian should manage use by a minor and any related booking.</p>
          <h2>7. Updates and questions</h2>
          <p>This policy may change as the service develops. The effective date above identifies this version. For privacy requests or questions, contact the operator using its published contact details.</p>
        </article>
      )}
    </div>
  );

  const renderConfirmation = () => (
    <div className="page-shell confirmation-page">
      <div className="confirmation-card">
        <div className="confirmation-badge">Request submitted</div>
        <h1>Your booking request is in</h1>
        <p>
          {bookingSummary?.serviceTitle} with {bookingSummary?.providerName} is waiting for provider confirmation.
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
            <strong>R{bookingSummary?.servicePrice || 0}</strong>
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
  if (view === 'admin-dashboard') return renderAdminDashboard();
  if (view === 'legal') return renderLegal();
  if (view === 'confirmation') return renderConfirmation();

  return renderHome();
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
