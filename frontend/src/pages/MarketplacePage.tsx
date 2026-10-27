import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, Tag, Cpu, User } from 'lucide-react';
import { api } from '../api/client';
import { ComponentResponse, ListingType, ComponentStatus } from '../api/types';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';

// Sample preview components for offline / initial development
const SAMPLE_COMPONENTS: ComponentResponse[] = [
  {
    id: 1,
    title: 'STM32F401RE Nucleo-64 Board',
    description: 'ARM Cortex-M4 microcontroller board with ST-LINK/V2-1 debugger. Ideal for Embedded Systems (CO324/CO326) labs.',
    category: 'Microcontrollers',
    specifications: '84MHz, 512KB Flash, 96KB SRAM, Arduino Uno V3 pinout',
    listingType: ListingType.SELL,
    price: 4500.0,
    status: ComponentStatus.AVAILABLE,
    ownerId: 101,
    ownerName: 'Danula Bandara',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    title: 'ESP32-WROOM-32 DevKit V1',
    description: 'Dual-core Wi-Fi & Bluetooth microcontroller module with micro-USB. Used once for IoT term project.',
    category: 'Wireless & IoT',
    specifications: '240MHz Dual Core, 4MB Flash, integrated antenna',
    listingType: ListingType.SWAP,
    price: null,
    status: ComponentStatus.AVAILABLE,
    ownerId: 102,
    ownerName: 'Nipuni Perera',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 3,
    title: 'Hantek 2D42 Handheld Oscilloscope',
    description: 'Portable 40MHz dual-channel digital oscilloscope & multimeter. Available to borrow for final-year project signal debugging.',
    category: 'Lab & Prototyping',
    specifications: '40MHz bandwidth, 250MSa/s real-time sampling rate',
    listingType: ListingType.BORROW,
    price: null,
    status: ComponentStatus.AVAILABLE,
    ownerId: 103,
    ownerName: 'Malith Fernando',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 4,
    title: 'MPU-6050 6-DOF IMU Accelerometer + Gyro',
    description: 'I2C breakout sensor module with 3-axis accelerometer and 3-axis gyroscope. Brand new on breadboard header pins.',
    category: 'Sensors & Transducers',
    specifications: '3.3V-5V compatible, standard I2C address 0x68',
    listingType: ListingType.SELL,
    price: 850.0,
    status: ComponentStatus.AVAILABLE,
    ownerId: 104,
    ownerName: 'Kavindi Silva',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 5,
    title: 'Arduino Uno R3 (ATmega328P)',
    description: 'Original board in great condition. Includes blue USB Type-B cable.',
    category: 'Microcontrollers',
    specifications: '16MHz, 32KB Flash, 2KB SRAM, 14 digital I/O',
    listingType: ListingType.SELL,
    price: 2500.0,
    status: ComponentStatus.RESERVED,
    ownerId: 105,
    ownerName: 'Chamod Jayasundara',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 6,
    title: 'nRF24L01+ 2.4GHz Wireless Transceiver Pair',
    description: 'Pair of 2.4GHz radio modules with SMA antennas for long-range robot remote control.',
    category: 'Wireless & IoT',
    specifications: 'SPI interface, 2Mbps, 100m+ range with antenna',
    listingType: ListingType.SWAP,
    price: null,
    status: ComponentStatus.AVAILABLE,
    ownerId: 106,
    ownerName: 'Sahan Wickramasinghe',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const MarketplacePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const searchParam = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category') || '';
  const listingTypeParam = searchParams.get('listingType') || '';
  const statusParam = searchParams.get('status') || 'AVAILABLE';

  const [components, setComponents] = useState<ComponentResponse[]>(SAMPLE_COMPONENTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParam);

  const fetchComponents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.components.getAll({
        search: searchParam || undefined,
        category: categoryParam || undefined,
        listingType: listingTypeParam || undefined,
        status: statusParam || undefined,
        page: 0,
        size: 20,
      });

      if (response && response.content && response.content.length > 0) {
        setComponents(response.content);
      } else {
        // Filter sample components locally if backend returns empty or in standalone dev
        let filtered = [...SAMPLE_COMPONENTS];
        if (searchParam) {
          const q = searchParam.toLowerCase();
          filtered = filtered.filter(
            (c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
          );
        }
        if (categoryParam) {
          filtered = filtered.filter((c) => c.category === categoryParam);
        }
        if (listingTypeParam) {
          filtered = filtered.filter((c) => c.listingType === listingTypeParam);
        }
        if (statusParam) {
          filtered = filtered.filter((c) => c.status === statusParam);
        }
        setComponents(filtered);
      }
    } catch {
      // Fallback gracefully to mock components in local development without backend
      let filtered = [...SAMPLE_COMPONENTS];
      if (searchParam) {
        const q = searchParam.toLowerCase();
        filtered = filtered.filter(
          (c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
        );
      }
      if (categoryParam) {
        filtered = filtered.filter((c) => c.category === categoryParam);
      }
      if (listingTypeParam) {
        filtered = filtered.filter((c) => c.listingType === listingTypeParam);
      }
      if (statusParam) {
        filtered = filtered.filter((c) => c.status === statusParam);
      }
      setComponents(filtered);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComponents();
  }, [searchParam, categoryParam, listingTypeParam, statusParam]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchQuery.trim()) {
      newParams.set('search', searchQuery.trim());
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams);
  };

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const getListingBadgeClass = (type: ListingType) => {
    switch (type) {
      case 'SELL': return 'badge-sell';
      case 'SWAP': return 'badge-swap';
      case 'BORROW': return 'badge-borrow';
      default: return '';
    }
  };

  const getStatusBadgeClass = (status: ComponentStatus) => {
    switch (status) {
      case 'AVAILABLE': return 'badge-available';
      case 'RESERVED': return 'badge-reserved';
      case 'EXCHANGED': return 'badge-exchanged';
      default: return '';
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Hardware Marketplace</h1>
        <p className="page-description">
          Browse, swap, or reserve electronics components and development boards from fellow engineering students.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 280px' }}>
            <Search
              size={18}
              style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-subtle)' }}
            />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search components (e.g. STM32, ESP32, IMU, Arduino)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search components"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-primary-800)', fontSize: '0.875rem', fontWeight: 600 }}>
            <Filter size={16} />
            <span>Filters:</span>
          </div>

          {/* Category Dropdown */}
          <div style={{ minWidth: '180px' }}>
            <select
              className="form-select"
              value={categoryParam}
              onChange={(e) => updateFilter('category', e.target.value)}
              aria-label="Filter by category"
            >
              <option value="">All Categories</option>
              <option value="Microcontrollers">Microcontrollers</option>
              <option value="Sensors & Transducers">Sensors & Transducers</option>
              <option value="Wireless & IoT">Wireless & IoT</option>
              <option value="Power & Discrete">Power & Discrete</option>
              <option value="Development Kits">Development Kits</option>
              <option value="Lab & Prototyping">Lab & Prototyping</option>
            </select>
          </div>

          {/* Listing Type Filter */}
          <div style={{ minWidth: '150px' }}>
            <select
              className="form-select"
              value={listingTypeParam}
              onChange={(e) => updateFilter('listingType', e.target.value)}
              aria-label="Filter by listing type"
            >
              <option value="">All Types (Sell, Swap, Borrow)</option>
              <option value="SELL">For Sale</option>
              <option value="SWAP">For Swap</option>
              <option value="BORROW">For Borrow</option>
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ minWidth: '150px' }}>
            <select
              className="form-select"
              value={statusParam}
              onChange={(e) => updateFilter('status', e.target.value)}
              aria-label="Filter by status"
            >
              <option value="AVAILABLE">Available Only</option>
              <option value="RESERVED">Reserved</option>
              <option value="EXCHANGED">Exchanged</option>
              <option value="">All Statuses</option>
            </select>
          </div>

          {(searchParam || categoryParam || listingTypeParam || statusParam !== 'AVAILABLE') && (
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => setSearchParams(new URLSearchParams({ status: 'AVAILABLE' }))}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Listing Content States */}
      {loading && <LoadingState message="Fetching marketplace components..." />}

      {error && (
        <ErrorState
          title="Could not load components"
          message={error}
          onRetry={fetchComponents}
        />
      )}

      {!loading && !error && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              Showing <strong>{components.length}</strong> component listing{components.length === 1 ? '' : 's'}
            </span>
          </div>

          {components.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
              <Cpu size={40} style={{ color: 'var(--color-primary-500)', marginBottom: '1rem' }} />
              <h3 style={{ marginBottom: '0.5rem' }}>No matching components found</h3>
              <p style={{ maxWidth: '400px', margin: '0 auto 1.5rem auto' }}>
                Try adjusting your search terms or clearing category and listing type filters.
              </p>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setSearchParams(new URLSearchParams({ status: 'AVAILABLE' }))}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid-cards">
              {components.map((item) => (
                <div key={item.id} className="card card-hoverable" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span className={`badge ${getListingBadgeClass(item.listingType)}`}>
                      {item.listingType}
                    </span>
                    <span className={`badge ${getStatusBadgeClass(item.status)}`}>
                      {item.status}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', lineHeight: 1.3 }}>
                    <Link to={`/components/${item.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                      {item.title}
                    </Link>
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-primary-600)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                    <Tag size={13} />
                    <span>{item.category}</span>
                  </div>

                  <p style={{ fontSize: '0.875rem', marginBottom: '1rem', flex: '1 0 auto', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.description}
                  </p>

                  {item.specifications && (
                    <div style={{ backgroundColor: 'var(--color-bg-subtle)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem', fontFamily: 'var(--font-family-mono)' }}>
                      {item.specifications}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.875rem', borderTop: '1px solid var(--color-border)', marginTop: 'auto' }}>
                    <div>
                      {item.listingType === 'SELL' && item.price != null ? (
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary-900)' }}>
                          LKR {item.price.toFixed(2)}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-accent-600)' }}>
                          {item.listingType === 'SWAP' ? 'Exchange / Swap' : 'Free Borrow'}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>
                      <User size={13} />
                      <span>{item.ownerName}</span>
                    </div>
                  </div>

                  <Link
                    to={`/components/${item.id}`}
                    className="btn btn-outline btn-sm"
                    style={{ marginTop: '1rem', width: '100%' }}
                  >
                    View Details & Reserve
                  </Link>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
