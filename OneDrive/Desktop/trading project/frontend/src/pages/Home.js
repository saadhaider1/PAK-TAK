import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

export const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);

  const features = [
    {
      icon: '📈',
      title: 'Live Trading',
      description: 'Real-time stock prices and instant trade execution at the best market rates'
    },
    {
      icon: '🛡️',
      title: 'Secure & Reliable',
      description: 'Your account is protected with bank-level JWT authentication and encryption'
    },
    {
      icon: '📊',
      title: 'Advanced Analytics',
      description: 'Track portfolio performance with detailed charts and gain/loss calculations'
    },
    {
      icon: '💰',
      title: 'Virtual Trading',
      description: 'Start with $10,000 virtual balance and trade risk-free to learn'
    },
    {
      icon: '⚡',
      title: 'Instant Execution',
      description: 'Execute trades in milliseconds with our optimized trading engine'
    },
    {
      icon: '📱',
      title: 'Easy to Use',
      description: 'Intuitive interface designed for beginners and professional traders alike'
    }
  ];

  // Auto-advance slides every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % features.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + features.length) % features.length);
  };

  return (
    <div className="home-container">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="logo">✈️ Fly</div>
        </div>
        <div className="navbar-menu">
          <a href="#features" className="nav-link">Features</a>
          <a href="#about" className="nav-link">About</a>
          <a href="#contact" className="nav-link">Contact</a>
        </div>
        <div className="navbar-buttons">
          {user ? (
            <>
              <button onClick={() => navigate('/dashboard')} className="nav-btn secondary">
                Dashboard
              </button>
              <button onClick={() => navigate('/trade')} className="nav-btn primary">
                Trade Now
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/signin')} className="nav-btn secondary">
                Login
              </button>
              <button onClick={() => navigate('/signup')} className="nav-btn primary">
                Sign up
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-logo-glow">
          <svg 
            className="hero-logo" 
            viewBox="0 0 400 300" 
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Left side - Lightning bolt shape */}
            <g className="logo-left-part">
              <polygon points="170,85 140,180 190,180 125,270 200,140 150,140" fill="white" />
            </g>
            
            {/* Right side - Triangle shape */}
            <g className="logo-right-part">
              <polygon points="200,85 330,85 380,200 330,200" fill="white" />
              <polygon points="210,200 280,200 210,270" fill="white" />
            </g>
          </svg>
        </div>

        <div className="hero-content">
          <h1>Elevate Your<br />Trading Experience</h1>
          <p>Unlock your trading potential with a fully regulated environment, powered by Fly</p>
          
          <button onClick={() => !user ? navigate('/signup') : navigate('/trade')} className="cta-button">
            <span>Sign Up & Trade</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7 10h6M13 7l3 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Floating Elements */}
        <div className="hero-visual">
          <div className="glow-ball"></div>
          <div className="floating-card trading-stats">
            <div className="stat-item">
              <div className="stat-label">Trading Pairs</div>
              <div className="stat-value">500+</div>
              <div className="stat-desc">Unparalleled Market Access</div>
            </div>
          </div>
          <div className="floating-card success-rate">
            <div className="stat-label-small">Success Rate</div>
            <div className="stat-percent">96%</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="section-header">
          <h2>Why Choose Fly?</h2>
          <p>Everything you need for successful trading</p>
        </div>

        <div className="features-slideshow">
          <div className="slideshow-container">
            <div className="feature-card active">
              <div className="feature-icon">{features[currentSlide].icon}</div>
              <h3>{features[currentSlide].title}</h3>
              <p>{features[currentSlide].description}</p>
            </div>
          </div>

          <button className="slide-nav slide-prev" onClick={prevSlide}>
            <span>❮</span>
          </button>
          <button className="slide-nav slide-next" onClick={nextSlide}>
            <span>❯</span>
          </button>

          <div className="slide-indicators">
            {features.map((_, index) => (
              <button
                key={index}
                className={`indicator ${index === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Start Trading?</h2>
          <p>Join thousands of traders on Fly today</p>
          <button onClick={() => !user ? navigate('/signup') : navigate('/trade')} className="cta-button large">
            <span>Get Started Now</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7 10h6M13 7l3 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </section>

      {/* About Section */}
      <section className="about-section" id="about">
        <div className="section-header">
          <h2>About Fly</h2>
          <p>Leading the future of democratic trading</p>
        </div>

        <div className="about-content">
          <div className="about-grid">
            <div className="about-card">
              <div className="about-icon">🚀</div>
              <h3>Our Mission</h3>
              <p>To democratize trading and make financial markets accessible to everyone, from beginners to experienced investors. We believe everyone deserves the opportunity to grow their wealth.</p>
            </div>
            <div className="about-card">
              <div className="about-icon">👁️</div>
              <h3>Our Vision</h3>
              <p>To become the world's most trusted and user-friendly trading platform. We envision a future where financial literacy and trading are empowering tools for wealth creation.</p>
            </div>
            <div className="about-card">
              <div className="about-icon">⭐</div>
              <h3>Our Values</h3>
              <p>Transparency, security, and user empowerment are at the core of everything we do. We're committed to ethical trading practices and continuous innovation.</p>
            </div>
          </div>

          <div className="about-stats">
            <div className="stat-box">
              <div className="stat-number">50K+</div>
              <div className="stat-label">Active Traders</div>
            </div>
            <div className="stat-box">
              <div className="stat-number">$100M+</div>
              <div className="stat-label">Trading Volume</div>
            </div>
            <div className="stat-box">
              <div className="stat-number">500+</div>
              <div className="stat-label">Trading Pairs</div>
            </div>
            <div className="stat-box">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Support Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section" id="contact">
        <div className="section-header">
          <h2>Get in Touch</h2>
          <p>We'd love to hear from you. Reach out anytime!</p>
        </div>

        <div className="contact-content">
          <div className="contact-form">
            <form onSubmit={(e) => { e.preventDefault(); alert('Thank you for contacting us! We will get back to you soon.'); }}>
              <div className="form-group">
                <input 
                  type="text" 
                  placeholder="Your Name" 
                  required 
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <input 
                  type="email" 
                  placeholder="Your Email" 
                  required 
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <textarea 
                  placeholder="Your Message" 
                  rows="5" 
                  required 
                  className="form-input"
                ></textarea>
              </div>
              <button type="submit" className="cta-button">
                <span>Send Message</span>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M7 10h6M13 7l3 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </form>
          </div>

          <div className="contact-info">
            <div className="contact-item">
              <div className="contact-icon">📧</div>
              <h4>Email</h4>
              <p><a href="mailto:support@fly.com">support@fly.com</a></p>
              <p><a href="mailto:info@fly.com">info@fly.com</a></p>
            </div>
            <div className="contact-item">
              <div className="contact-icon">📞</div>
              <h4>Phone</h4>
              <p><a href="tel:+1-800-123-4567">+1 (800) 123-4567</a></p>
              <p>Monday – Friday, 9 AM – 6 PM EST</p>
            </div>
            <div className="contact-item">
              <div className="contact-icon">📍</div>
              <h4>Location</h4>
              <p>123 Trading Street</p>
              <p>New York, NY 10001</p>
            </div>
            <div className="contact-item">
              <div className="contact-icon">💬</div>
              <h4>Social Media</h4>
              <div className="social-links">
                <a href="#" className="social-link">Twitter</a>
                <a href="#" className="social-link">LinkedIn</a>
                <a href="#" className="social-link">Discord</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <p>&copy; 2026 Fly. All rights reserved.</p>
          <div className="footer-links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
