import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Plus, AlertCircle, Edit, Trash2, Eye, Info } from 'lucide-react';
import { ComponentResponse, ListingType, ComponentStatus } from '../api/types';

const INITIAL_MOCK_LISTINGS: ComponentResponse[] = [
  {
    id: 101,
    title: 'Raspberry Pi 4 Model B (4GB)',
    description: 'Barely used for EE322 Embedded Systems project. Comes with official 5V 3A USB-C power adapter and aluminum heat sinks.',
    category: 'MICROCONTROLLERS',
    listingType: ListingType.SELL,
    price: 18500,
    status: ComponentStatus.AVAILABLE,
    ownerId: 1,
    ownerName: 'Chamod Perera',
    createdAt: '2026-10-25T10:00:00Z',
    updatedAt: '2026-10-25T10:00:00Z',
  },
  {
    id: 102,
    title: 'STM32F401 Black Pill Board',
    description: 'Pre-soldered headers, flashed with MicroPython. Ideal for Real-Time Operating Systems assignments.',
    category: 'MICROCONTROLLERS',
    listingType: ListingType.BORROW,
    price: 0,
    status: ComponentStatus.RESERVED,
    ownerId: 1,
    ownerName: 'Chamod Perera',
    createdAt: '2026-10-24T14:30:00Z',
    updatedAt: '2026-10-25T11:00:00Z',
  },
  {
    id: 103,
    title: 'MPU-6050 6-DOF Accelerometer & Gyro',
    description: 'Tested I2C module with breadboard jumper wires. Willing to swap for a MAX30102 pulse oximeter.',
    category: 'SENSORS',
    listingType: ListingType.SWAP,
    price: 0,
    status: ComponentStatus.EXCHANGED,
    ownerId: 1,
    ownerName: 'Chamod Perera',
    createdAt: '2026-10-20T09:15:00Z',
    updatedAt: '2026-10-22T16:00:00Z',
  },
];

export const MyListingsPage: React.FC = () => {
  const [listings] = useState<ComponentResponse[]>(INITIAL_MOCK_LISTINGS);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredListings = listings.filter((item) => {
    if (filterStatus === 'ALL') return true;
    return item.status === filterStatus;
  });

  const getStatusBadgeClass = (status: ComponentStatus) => {
    switch (status) {
      case ComponentStatus.AVAILABLE:
        return 'badge-success';
      case ComponentStatus.RESERVED:
        return 'badge-warning';
      case ComponentStatus.EXCHANGED:
        return 'badge-neutral';
      default:
        return 'badge-neutral';
    }
  };

  const getListingTypeBadgeClass = (type: ListingType) => {
    switch (type) {
      case ListingType.SELL:
        return 'badge-primary';
      case ListingType.SWAP:
        return 'badge-info';
      case ListingType.BORROW:
        return 'badge-warning';
      default:
        return 'badge-neutral';
    }
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Cpu size={24} color="var(--color-primary)" />
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>My Listings</h1>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>
            Track and manage hardware you offered to university peers
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => alert('Milestone 7 Foundation: Component creation form will be integrated in Milestone 8.')}
        >
          <Plus size={16} />
          <span>New Component Listing</span>
        </button>
      </div>

      {/* Milestone 7 Preview Notice */}
      <div
        style={{
          padding: '0.75rem 1rem',
          backgroundColor: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          fontSize: '0.85rem',
          color: 'var(--color-primary-light)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <Info size={16} style={{ flexShrink: 0 }} />
        <span>
          <strong>Milestone 7 Foundation Preview:</strong> Displaying demonstration listings and status badges. Creation, editing, and listing operations will be connected to authenticated sessions in Milestone 8.
        </span>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['ALL', 'AVAILABLE', 'RESERVED', 'EXCHANGED'].map((status) => (
          <button
            key={status}
            type="button"
            className={`btn btn-sm ${filterStatus === status ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilterStatus(status)}
            style={{
              borderRadius: '9999px',
              padding: '0.35rem 0.85rem',
            }}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Listings Table / Cards */}
      {filteredListings.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <AlertCircle size={36} color="var(--color-text-muted)" style={{ margin: '0 auto 0.75rem auto' }} />
          <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0' }}>No listings found</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            No component listings match the selected status filter.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredListings.map((item) => (
            <div
              key={item.id}
              className="card"
              style={{
                padding: '1.25rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div style={{ flex: '1 1 300px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span className={`badge ${getListingTypeBadgeClass(item.listingType)}`}>
                    {item.listingType}
                  </span>
                  <span className={`badge ${getStatusBadgeClass(item.status)}`}>
                    {item.status}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Category: {item.category}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 0.35rem 0' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  {item.description}
                </p>
                {item.listingType === ListingType.SELL && (
                  <div style={{ marginTop: '0.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    LKR {item.price?.toLocaleString()}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Link
                  to={`/components/${item.id}`}
                  className="btn btn-sm btn-outline"
                  title="View Public Details"
                >
                  <Eye size={15} />
                  <span>View</span>
                </Link>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  title="Edit Listing"
                  disabled={item.status === ComponentStatus.EXCHANGED}
                  onClick={() => alert('Milestone 7 Foundation: Listing editing will be connected in Milestone 8.')}
                >
                  <Edit size={15} />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  title="Delete Listing"
                  style={{ color: 'var(--color-danger)' }}
                  onClick={() => {
                    if (item.status === ComponentStatus.RESERVED) {
                      alert('Conflict: Active reservation prevents component deletion (HTTP 409). Safe deletion will be enforced in Milestone 8.');
                    } else {
                      alert('Milestone 7 Foundation: Safe component deletion will be connected in Milestone 8.');
                    }
                  }}
                >
                  <Trash2 size={15} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
