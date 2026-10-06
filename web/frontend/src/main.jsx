import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

function App() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [servicesResponse, categoriesResponse] = await Promise.all([
          fetch(`/api/services?q=${encodeURIComponent(query)}`),
          fetch('/api/categories')
        ]);

        const servicesData = await servicesResponse.json();
        const categoriesData = await categoriesResponse.json();

        setServices(servicesData.services || []);
        setCategories(categoriesData || []);
      } catch (error) {
        console.error('Failed to load marketplace data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [query]);

  const highlightText = useMemo(() => {
    return query.trim();
  }, [query]);

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand-block">
          <span className="brand-mark">T</span>
          <span>Task-IT</span>
        </div>

        <nav className="nav-links">
          <a href="#services">Services</a>
          <a href="#how-it-works">How it works</a>
          <a href="#providers">Providers</a>
        </nav>

        <button className="primary-button">Book a service</button>
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
              <button className="primary-button">Search</button>
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

        <section id="services" className="services-section">
          <div className="section-heading">
            <h2>
              {highlightText
                ? `Results for “${highlightText}”`
                : 'Featured services nearby'}
            </h2>
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
                    <button>View details</button>
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
              <p>Choose a preferred time and confirm your booking in a few steps.</p>
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
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
