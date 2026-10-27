import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Cpu,
  Layers,
  Repeat,
  Shield,
  Zap,
  CheckCircle2,
  ArrowRight,
  Radio,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { api } from '../api/client';

export const HomePage: React.FC = () => {
  const [backendStatus, setBackendStatus] = useState<'CHECKING' | 'ONLINE' | 'OFFLINE'>('CHECKING');

  useEffect(() => {
    let isMounted = true;
    api.health
      .check()
      .then((res) => {
        if (isMounted && res.status === 'UP') {
          setBackendStatus('ONLINE');
        }
      })
      .catch(() => {
        if (isMounted) {
          setBackendStatus('OFFLINE');
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const categories = [
    { name: 'Microcontrollers', icon: Cpu, count: 'STM32, ESP32, Arduino, PIC' },
    { name: 'Sensors & Transducers', icon: Sliders, count: 'IMU, Ultrasonic, Temp, Current' },
    { name: 'Wireless & IoT', icon: Radio, count: 'LoRa, Zigbee, BLE, NRF24' },
    { name: 'Power & Discrete', icon: Zap, count: 'Regulators, MOSFETs, Drivers' },
    { name: 'Development Kits', icon: Layers, count: 'FPGA boards, DSP, Shields' },
    { name: 'Lab & Prototyping', icon: Sparkles, count: 'Breadboards, Logic analyzers' },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="hero" aria-labelledby="hero-heading">
        <div className="container">
          <div style={{ maxWidth: '800px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'rgba(37, 99, 235, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#93c5fd',
                marginBottom: '1.25rem',
              }}
            >
              <Cpu size={14} />
              <span>Department of Computer Engineering Peer Marketplace</span>
            </div>

            <h1 id="hero-heading" className="hero-title">
              Smart Component Sharing for Engineering Makers
            </h1>

            <p className="hero-subtitle">
              Need an STM32 board for your embedded project tonight? Looking to swap a surplus IMU
              sensor or borrow an oscilloscope? CoreHub connects engineering students directly to
              trade, borrow, and share hardware components on campus.
            </p>

            <div className="hero-actions">
              <Link to="/marketplace" className="btn btn-lg btn-primary">
                <span>Browse Components</span>
                <ArrowRight size={18} />
              </Link>
              <Link to="/register" className="btn btn-lg btn-secondary">
                <span>Create Student Account</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Backend Health Status Banner */}
      <div style={{ backgroundColor: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)', padding: '0.75rem 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor:
                  backendStatus === 'ONLINE' ? 'var(--color-success-500)' : backendStatus === 'OFFLINE' ? 'var(--color-danger-500)' : 'var(--color-warning-500)',
                display: 'inline-block',
              }}
            />
            <span style={{ fontWeight: 600, color: 'var(--color-primary-900)' }}>
              Spring Boot CoreHub Backend:
            </span>
            <span style={{ color: 'var(--color-text-muted)' }}>
              {backendStatus === 'ONLINE'
                ? 'Connected and Operational (Port 8080)'
                : backendStatus === 'OFFLINE'
                ? 'Backend not detected at localhost:8080 (Start backend via mvn spring-boot:run)'
                : 'Probing API health status...'}
            </span>
          </div>
          <Link to="/marketplace" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
            View live listings &rarr;
          </Link>
        </div>
      </div>

      {/* Value Pillars */}
      <section style={{ padding: '4rem 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 3rem auto' }}>
            <h2 style={{ marginBottom: '0.75rem' }}>Built for the Needs of Engineering Labs</h2>
            <p>
              Traditional marketplaces aren't built for term project deadlines or component pinout
              compatibility. CoreHub gives you verified campus trading with built-in reservation safety.
            </p>
          </div>

          <div className="grid-cards">
            <div className="card">
              <div
                style={{
                  width: '3rem',
                  height: '3rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-accent-50)',
                  color: 'var(--color-accent-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}
              >
                <Repeat size={24} />
              </div>
              <h3 style={{ marginBottom: '0.5rem' }}>Sell, Swap, or Borrow</h3>
              <p style={{ fontSize: '0.925rem' }}>
                Flexible listing models accommodate student budgets. Offer components for cash,
                exchange for needed ICs, or lend test equipment for short-term lab evaluations.
              </p>
            </div>

            <div className="card">
              <div
                style={{
                  width: '3rem',
                  height: '3rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-warning-50)',
                  color: 'var(--color-warning-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}
              >
                <Shield size={24} />
              </div>
              <h3 style={{ marginBottom: '0.5rem' }}>Anti Double-Booking</h3>
              <p style={{ fontSize: '0.925rem' }}>
                Transactional database row locks guarantee only one student can hold an active
                reservation at a time. No phantom listings or awkward simultaneous claims.
              </p>
            </div>

            <div className="card">
              <div
                style={{
                  width: '3rem',
                  height: '3rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-success-50)',
                  color: 'var(--color-success-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}
              >
                <CheckCircle2 size={24} />
              </div>
              <h3 style={{ marginBottom: '0.5rem' }}>Privacy-Guarded Contact</h3>
              <p style={{ fontSize: '0.925rem' }}>
                Public browsing never leaks student emails or phone numbers. Contact details are
                only securely shared when an active reservation is in place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Hardware Categories */}
      <section style={{ padding: '3.5rem 0', backgroundColor: 'var(--color-bg-card)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ marginBottom: '0.5rem' }}>Hardware Categories</h2>
              <p>Explore electronics curated for computer, electrical, and mechatronic engineering.</p>
            </div>
            <Link to="/marketplace" className="btn btn-outline btn-sm">
              View All Categories
            </Link>
          </div>

          <div className="grid-cards">
            {categories.map((cat) => {
              const IconComponent = cat.icon;
              return (
                <Link
                  key={cat.name}
                  to={`/marketplace?category=${encodeURIComponent(cat.name)}`}
                  className="card card-hoverable"
                  style={{ textDecoration: 'none', display: 'flex', gap: '1rem', alignItems: 'center' }}
                >
                  <div
                    style={{
                      width: '3rem',
                      height: '3rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--color-bg-subtle)',
                      color: 'var(--color-accent-600)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <IconComponent size={22} />
                  </div>
                  <div>
                    <h4 style={{ color: 'var(--color-primary-900)', marginBottom: '0.25rem' }}>{cat.name}</h4>
                    <span style={{ fontSize: '0.825rem', color: 'var(--color-text-subtle)' }}>{cat.count}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
