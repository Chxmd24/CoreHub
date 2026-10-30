import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Cpu,
  Plus,
  Edit,
  Trash2,
  Eye,
  Tag,
  AlertCircle,
  CheckCircle,
  X,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { api, ApiClientError } from '../api/client';
import {
  ComponentResponse,
  ComponentRequest,
  ListingType,
  ComponentStatus,
} from '../api/types';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';

export const COMPONENT_CATEGORIES = [
  'Microcontrollers',
  'Sensors & Transducers',
  'Wireless & IoT',
  'Development Kits',
  'Lab & Prototyping',
  'Power & Discrete',
  'Passives & Components',
];

interface FormState {
  title: string;
  category: string;
  listingType: ListingType;
  price: string;
  description: string;
  specifications: string;
}

const INITIAL_FORM_STATE: FormState = {
  title: '',
  category: 'Microcontrollers',
  listingType: ListingType.SELL,
  price: '',
  description: '',
  specifications: '',
};

export const MyListingsPage: React.FC = () => {
  const { user } = useAuth();

  const [listings, setListings] = useState<ComponentResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Feedback banner state (success / error)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);

  // Form modal state (Create / Edit)
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingComponent, setEditingComponent] = useState<ComponentResponse | null>(null);
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM_STATE);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [modalGeneralError, setModalGeneralError] = useState<string | null>(null);

  // Delete modal state
  const [deletingComponent, setDeletingComponent] = useState<ComponentResponse | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchMyListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.components.getMy();
      setListings(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        if (err.status === 401) {
          setError('Session expired or unauthorized. Please log in again.');
        } else if (err.status === 0) {
          setError('Unable to connect to CoreHub server. Please verify the backend is running.');
        } else {
          setError(err.message || 'Failed to load your component listings.');
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while fetching your listings.');
      }
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyListings();
  }, [fetchMyListings]);

  // Handle escape key to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFormModalOpen && !formSubmitting) {
          closeFormModal();
        }
        if (deletingComponent && !deleteSubmitting) {
          closeDeleteDialog();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFormModalOpen, formSubmitting, deletingComponent, deleteSubmitting]);

  // Filter listings
  const filteredListings = listings.filter((item) => {
    if (filterStatus === 'ALL') return true;
    return item.status === filterStatus;
  });

  const availableCount = listings.filter((i) => i.status === ComponentStatus.AVAILABLE).length;
  const reservedCount = listings.filter((i) => i.status === ComponentStatus.RESERVED).length;
  const exchangedCount = listings.filter((i) => i.status === ComponentStatus.EXCHANGED).length;

  // Open Create Modal
  const openCreateModal = () => {
    setEditingComponent(null);
    setFormData(INITIAL_FORM_STATE);
    setFormErrors({});
    setModalGeneralError(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (component: ComponentResponse) => {
    // Front-end ownership check before opening
    if (user && component.ownerId !== user.id) {
      setFeedback({
        type: 'error',
        message: 'You are not authorized to edit this listing because you are not the owner.',
      });
      return;
    }

    setEditingComponent(component);
    setFormData({
      title: component.title || '',
      category: component.category || 'Microcontrollers',
      listingType: component.listingType || ListingType.SELL,
      price: component.price != null ? component.price.toString() : '',
      description: component.description || '',
      specifications: component.specifications || '',
    });
    setFormErrors({});
    setModalGeneralError(null);
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setEditingComponent(null);
    setFormData(INITIAL_FORM_STATE);
    setFormErrors({});
    setModalGeneralError(null);
  };

  // Open Delete Confirmation Dialog
  const openDeleteDialog = (component: ComponentResponse) => {
    if (user && component.ownerId !== user.id) {
      setFeedback({
        type: 'error',
        message: 'You are not authorized to delete this listing because you are not the owner.',
      });
      return;
    }

    setDeletingComponent(component);
    setDeleteError(null);
  };

  const closeDeleteDialog = () => {
    setDeletingComponent(null);
    setDeleteError(null);
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.trim().length > 150) {
      errors.title = 'Title cannot exceed 150 characters';
    }

    if (!formData.category.trim()) {
      errors.category = 'Category is required';
    } else if (formData.category.trim().length > 100) {
      errors.category = 'Category cannot exceed 100 characters';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    } else if (formData.description.trim().length > 5000) {
      errors.description = 'Description cannot exceed 5000 characters';
    }

    if (formData.specifications && formData.specifications.trim().length > 5000) {
      errors.specifications = 'Specifications cannot exceed 5000 characters';
    }

    if (!formData.listingType) {
      errors.listingType = 'Listing type is required';
    }

    if (formData.listingType === ListingType.SELL) {
      if (!formData.price.trim()) {
        errors.price = 'Price is required for SELL listings';
      } else {
        const numPrice = parseFloat(formData.price.trim());
        if (isNaN(numPrice)) {
          errors.price = 'Price must be a valid number';
        } else if (numPrice < 0) {
          errors.price = 'Price cannot be negative';
        }
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Form Submission (Create or Edit)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setFormSubmitting(true);
    setModalGeneralError(null);

    const payload: ComponentRequest = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category.trim(),
      specifications: formData.specifications.trim() || null,
      listingType: formData.listingType,
      price:
        formData.listingType === ListingType.SELL
          ? parseFloat(formData.price.trim())
          : null,
    };

    try {
      if (editingComponent) {
        // Edit existing listing
        const updated = await api.components.update(editingComponent.id, payload);
        setListings((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
        setFeedback({
          type: 'success',
          message: `Listing "${updated.title}" updated successfully!`,
        });
      } else {
        // Create new listing
        const created = await api.components.create(payload);
        setListings((prev) => [created, ...prev]);
        setFeedback({
          type: 'success',
          message: `Listing "${created.title}" created successfully!`,
        });
      }
      closeFormModal();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        if (err.status === 400 && err.errorData?.validationErrors) {
          setFormErrors(err.errorData.validationErrors);
        } else if (err.status === 403) {
          setModalGeneralError(
            'You are not authorized to update this listing as you are not the owner.'
          );
        } else if (err.status === 404) {
          setModalGeneralError('Component listing not found or has already been removed.');
        } else {
          setModalGeneralError(err.message || 'Failed to save component listing.');
        }
      } else if (err instanceof Error) {
        setModalGeneralError(err.message);
      } else {
        setModalGeneralError('An unexpected error occurred while saving.');
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Delete Confirmation
  const confirmDelete = async () => {
    if (!deletingComponent) return;

    setDeleteSubmitting(true);
    setDeleteError(null);

    try {
      await api.components.delete(deletingComponent.id);
      setListings((prev) => prev.filter((item) => item.id !== deletingComponent.id));
      setFeedback({
        type: 'success',
        message: `Listing "${deletingComponent.title}" has been successfully deleted.`,
      });
      closeDeleteDialog();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        if (err.status === 409) {
          // HTTP 409 Conflict: reservation exists
          setDeleteError(
            'Cannot delete listing: this component has an active or historical reservation. To preserve university audit logs and handover records, listings with reservation history are permanently preserved.'
          );
        } else if (err.status === 403) {
          setDeleteError(
            'You are not authorized to delete this listing as you are not the owner.'
          );
        } else if (err.status === 404) {
          setDeleteError('Listing not found or has already been removed.');
        } else {
          setDeleteError(err.message || 'Failed to delete component listing.');
        }
      } else if (err instanceof Error) {
        setDeleteError(err.message);
      } else {
        setDeleteError('An unexpected error occurred while deleting.');
      }
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const getListingBadgeClass = (type: ListingType) => {
    switch (type) {
      case ListingType.SELL:
        return 'badge-sell';
      case ListingType.SWAP:
        return 'badge-swap';
      case ListingType.BORROW:
        return 'badge-borrow';
      default:
        return '';
    }
  };

  const getStatusBadgeClass = (status: ComponentStatus) => {
    switch (status) {
      case ComponentStatus.AVAILABLE:
        return 'badge-available';
      case ComponentStatus.RESERVED:
        return 'badge-warning';
      case ComponentStatus.EXCHANGED:
        return 'badge-exchanged';
      default:
        return '';
    }
  };

  return (
    <div>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Cpu size={26} color="var(--color-primary-800)" />
            <h1 className="page-title" style={{ margin: 0 }}>My Hardware Listings</h1>
          </div>
          <p className="page-description" style={{ margin: 0 }}>
            Manage the electronics components and lab equipment you offered to fellow engineering students.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={openCreateModal}
          data-testid="create-listing-btn"
        >
          <Plus size={16} />
          <span>New Component Listing</span>
        </button>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`alert-banner alert-banner-${feedback.type}`}
          role="status"
          aria-live="polite"
        >
          {feedback.type === 'success' && <CheckCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />}
          {feedback.type === 'error' && <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />}
          {feedback.type === 'warning' && <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />}
          <div style={{ flex: 1 }}>{feedback.message}</div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              padding: 0,
            }}
            aria-label="Dismiss message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.75rem',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <button
          type="button"
          className={`btn btn-sm ${filterStatus === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setFilterStatus('ALL')}
          style={{ borderRadius: 'var(--radius-full)', padding: '0.35rem 0.85rem' }}
        >
          All ({listings.length})
        </button>
        <button
          type="button"
          className={`btn btn-sm ${filterStatus === ComponentStatus.AVAILABLE ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setFilterStatus(ComponentStatus.AVAILABLE)}
          style={{ borderRadius: 'var(--radius-full)', padding: '0.35rem 0.85rem' }}
        >
          Available ({availableCount})
        </button>
        <button
          type="button"
          className={`btn btn-sm ${filterStatus === ComponentStatus.RESERVED ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setFilterStatus(ComponentStatus.RESERVED)}
          style={{ borderRadius: 'var(--radius-full)', padding: '0.35rem 0.85rem' }}
        >
          Reserved ({reservedCount})
        </button>
        <button
          type="button"
          className={`btn btn-sm ${filterStatus === ComponentStatus.EXCHANGED ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setFilterStatus(ComponentStatus.EXCHANGED)}
          style={{ borderRadius: 'var(--radius-full)', padding: '0.35rem 0.85rem' }}
        >
          Exchanged ({exchangedCount})
        </button>
      </div>

      {/* Loading State */}
      {loading && <LoadingState message="Fetching your hardware listings from CoreHub..." />}

      {/* Error State */}
      {error && !loading && (
        <ErrorState
          title="Could not load your listings"
          message={error}
          onRetry={fetchMyListings}
        />
      )}

      {/* Content State */}
      {!loading && !error && (
        <>
          {listings.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
              <Cpu size={44} style={{ color: 'var(--color-primary-500)', marginBottom: '1rem' }} />
              <h3 style={{ marginBottom: '0.5rem' }}>No component listings yet</h3>
              <p style={{ maxWidth: '460px', margin: '0 auto 1.5rem auto' }}>
                You have not listed any electronics components or lab equipment. Share your surplus microcontrollers, sensors, or modules with fellow engineering students.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={openCreateModal}
              >
                <Plus size={16} />
                <span>Create Your First Listing</span>
              </button>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>No listings with status "{filterStatus}"</h3>
              <p style={{ maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
                None of your component listings currently match the selected status filter.
              </p>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setFilterStatus('ALL')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <RotateCcw size={14} />
                <span>Show All Listings</span>
              </button>
            </div>
          ) : (
            <div className="grid-cards">
              {filteredListings.map((item) => (
                <div key={item.id} className="card card-hoverable component-card" data-testid={`my-listing-card-${item.id}`}>
                  {/* Badges Row */}
                  <div className="component-card-header">
                    <span className={`badge ${getListingBadgeClass(item.listingType)}`}>
                      {item.listingType}
                    </span>
                    <span className={`badge ${getStatusBadgeClass(item.status)}`}>
                      {item.status}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="component-card-title">
                    <Link to={`/components/${item.id}`}>
                      {item.title}
                    </Link>
                  </h3>

                  {/* Category */}
                  <div className="component-card-category">
                    <Tag size={13} style={{ flexShrink: 0 }} />
                    <span>{item.category}</span>
                  </div>

                  {/* Description */}
                  <p className="component-card-description">
                    {item.description}
                  </p>

                  {/* Specifications */}
                  {item.specifications && (
                    <div className="component-card-specs" title={item.specifications}>
                      {item.specifications}
                    </div>
                  )}

                  {/* Price Row */}
                  <div className="component-card-footer" style={{ marginBottom: '1rem' }}>
                    <div className="component-card-price">
                      {item.listingType === ListingType.SELL && item.price != null ? (
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary-900)' }}>
                          LKR {item.price.toFixed(2)}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-accent-600)' }}>
                          {item.listingType === ListingType.SWAP ? 'Exchange / Swap' : 'Free Lab Borrow'}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>
                      Updated {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '0.5rem',
                      marginTop: 'auto',
                    }}
                  >
                    <Link
                      to={`/components/${item.id}`}
                      className="btn btn-outline btn-sm"
                      style={{ padding: '0.35rem 0.25rem' }}
                      title="View public listing"
                    >
                      <Eye size={14} />
                      <span>View</span>
                    </Link>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ padding: '0.35rem 0.25rem' }}
                      onClick={() => openEditModal(item)}
                      title="Edit component listing"
                      data-testid={`edit-btn-${item.id}`}
                    >
                      <Edit size={14} />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      style={{ padding: '0.35rem 0.25rem' }}
                      onClick={() => openDeleteDialog(item)}
                      title="Delete component listing"
                      data-testid={`delete-btn-${item.id}`}
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* CREATE / EDIT LISTING MODAL */}
      {isFormModalOpen && (
        <div
          className="modal-backdrop"
          onClick={closeFormModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="form-modal-title"
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '620px' }}
          >
            {/* Modal Header */}
            <div className="modal-header">
              <h2 id="form-modal-title" className="modal-title">
                {editingComponent ? 'Edit Component Listing' : 'Create New Component Listing'}
              </h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={closeFormModal}
                disabled={formSubmitting}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div className="modal-body">
                {modalGeneralError && (
                  <div className="alert-banner alert-banner-error" role="alert">
                    <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>{modalGeneralError}</div>
                  </div>
                )}

                {/* Title */}
                <div className="form-group">
                  <label htmlFor="listing-title" className="form-label">
                    Component Title <span style={{ color: 'var(--color-danger-600)' }}>*</span>
                  </label>
                  <input
                    id="listing-title"
                    type="text"
                    className="form-input"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    maxLength={150}
                    placeholder="e.g., STM32F401RE Nucleo-64 ARM Cortex-M4 Board"
                    required
                    disabled={formSubmitting}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    {formErrors.title ? (
                      <span className="form-error-text">{formErrors.title}</span>
                    ) : (
                      <span className="form-helper-text">Specific board model, revision, or IC name</span>
                    )}
                    <span className="form-char-count">{formData.title.length}/150</span>
                  </div>
                </div>

                {/* Category & Listing Type Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                  {/* Category */}
                  <div>
                    <label htmlFor="listing-category" className="form-label">
                      Category <span style={{ color: 'var(--color-danger-600)' }}>*</span>
                    </label>
                    <select
                      id="listing-category"
                      className="form-select"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                      disabled={formSubmitting}
                    >
                      {COMPONENT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    {formErrors.category && <span className="form-error-text">{formErrors.category}</span>}
                  </div>

                  {/* Listing Type */}
                  <div>
                    <label htmlFor="listing-type" className="form-label">
                      Listing Type <span style={{ color: 'var(--color-danger-600)' }}>*</span>
                    </label>
                    <select
                      id="listing-type"
                      className="form-select"
                      value={formData.listingType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          listingType: e.target.value as ListingType,
                          price: e.target.value === ListingType.SELL ? formData.price : '',
                        })
                      }
                      required
                      disabled={formSubmitting}
                    >
                      <option value={ListingType.SELL}>For Sale (SELL)</option>
                      <option value={ListingType.SWAP}>For Swap (SWAP)</option>
                      <option value={ListingType.BORROW}>For Borrow (BORROW)</option>
                    </select>
                    {formErrors.listingType && (
                      <span className="form-error-text">{formErrors.listingType}</span>
                    )}
                  </div>
                </div>

                {/* Price (LKR) - Only applicable for SELL */}
                <div className="form-group">
                  <label htmlFor="listing-price" className="form-label">
                    Price (LKR){' '}
                    {formData.listingType === ListingType.SELL ? (
                      <span style={{ color: 'var(--color-danger-600)' }}>*</span>
                    ) : (
                      <span style={{ fontWeight: 400, color: 'var(--color-text-subtle)' }}>(Not applicable)</span>
                    )}
                  </label>
                  <input
                    id="listing-price"
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    disabled={formData.listingType !== ListingType.SELL || formSubmitting}
                    placeholder={
                      formData.listingType === ListingType.SELL
                        ? 'e.g., 1850.00'
                        : 'Price is not applicable for SWAP or BORROW'
                    }
                    required={formData.listingType === ListingType.SELL}
                  />
                  {formErrors.price ? (
                    <span className="form-error-text">{formErrors.price}</span>
                  ) : (
                    <span className="form-helper-text">
                      {formData.listingType === ListingType.SELL
                        ? 'Asking student price in Sri Lankan Rupees (non-negative)'
                        : 'SWAP and BORROW listings must have no asking price (stored as null)'}
                    </span>
                  )}
                </div>

                {/* Description */}
                <div className="form-group">
                  <label htmlFor="listing-description" className="form-label">
                    Description & Condition <span style={{ color: 'var(--color-danger-600)' }}>*</span>
                  </label>
                  <textarea
                    id="listing-description"
                    className="form-textarea"
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    maxLength={5000}
                    placeholder="Describe working condition, lab usage history, headers soldered, tested peripherals, or what you want to swap for..."
                    required
                    disabled={formSubmitting}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    {formErrors.description ? (
                      <span className="form-error-text">{formErrors.description}</span>
                    ) : (
                      <span className="form-helper-text">Give clear details to help peers verify compatibility</span>
                    )}
                    <span className="form-char-count">{formData.description.length}/5000</span>
                  </div>
                </div>

                {/* Technical Specifications */}
                <div className="form-group">
                  <label htmlFor="listing-specs" className="form-label">
                    Technical Specifications & Pinout <span style={{ fontWeight: 400, color: 'var(--color-text-subtle)' }}>(Optional)</span>
                  </label>
                  <textarea
                    id="listing-specs"
                    className="form-textarea"
                    rows={3}
                    style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.85rem' }}
                    value={formData.specifications}
                    onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                    maxLength={5000}
                    placeholder="e.g., Clock: 84MHz, Flash: 512KB, Voltage: 3.3V/5V, ST-LINK v2.1, Micro-USB"
                    disabled={formSubmitting}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    {formErrors.specifications ? (
                      <span className="form-error-text">{formErrors.specifications}</span>
                    ) : (
                      <span className="form-helper-text">Key electrical parameters, interfaces (I2C/SPI), or pinout summary</span>
                    )}
                    <span className="form-char-count">{formData.specifications.length}/5000</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={closeFormModal}
                  disabled={formSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={formSubmitting}
                  data-testid="submit-listing-btn"
                >
                  {formSubmitting
                    ? 'Saving...'
                    : editingComponent
                    ? 'Save Changes'
                    : 'Create Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingComponent && (
        <div
          className="modal-backdrop"
          onClick={!deleteSubmitting ? closeDeleteDialog : undefined}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={20} color="var(--color-danger-600)" />
                <h2 id="delete-dialog-title" className="modal-title" style={{ fontSize: '1.15rem' }}>
                  Delete Component Listing
                </h2>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={closeDeleteDialog}
                disabled={deleteSubmitting}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {deleteError ? (
                <div className="alert-banner alert-banner-warning" role="alert">
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>{deleteError}</div>
                </div>
              ) : (
                <>
                  <p style={{ marginBottom: '1rem', color: 'var(--color-text-main)' }}>
                    Are you sure you want to permanently delete{' '}
                    <strong>"{deletingComponent.title}"</strong>?
                  </p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    This action will remove the listing from the hardware marketplace.
                  </p>
                  <div
                    style={{
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--color-bg-subtle)',
                      fontSize: '0.8rem',
                      color: 'var(--color-text-muted)',
                      marginTop: '1rem',
                      lineHeight: 1.45,
                    }}
                  >
                    <strong>CoreHub Audit Policy:</strong> Listings with active or historical reservations cannot be hard deleted. This preserves campus handover records and student trust.
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={closeDeleteDialog}
                disabled={deleteSubmitting}
              >
                {deleteError ? 'Close' : 'Cancel'}
              </button>
              {!deleteError && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={confirmDelete}
                  disabled={deleteSubmitting}
                  data-testid="confirm-delete-btn"
                >
                  {deleteSubmitting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
