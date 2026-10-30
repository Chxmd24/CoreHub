import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, Tag, Cpu, User, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { api, ApiError } from '../api/client';
import { ComponentResponse, ListingType, ComponentStatus, PagedResponse } from '../api/types';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';

export const MarketplacePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const searchParam = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category') || '';
  const listingTypeParam = searchParams.get('listingType') || '';
  const statusParam = searchParams.get('status') || '';
  const pageParam = Math.max(0, parseInt(searchParams.get('page') || '0', 10) || 0);

  const [pagedData, setPagedData] = useState<PagedResponse<ComponentResponse> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState<string>(searchParam);

  // Sync searchInput when URL searchParam changes (e.g. browser back/forward or reset)
  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  const fetchComponents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.components.getAll({
        search: searchParam.trim() || undefined,
        category: categoryParam || undefined,
        listingType: (listingTypeParam as ListingType) || undefined,
        status: (statusParam as ComponentStatus) || undefined,
        page: pageParam,
        size: 9,
        sort: 'createdAt,desc',
      });
      setPagedData(response);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 0) {
          setError('Unable to connect to CoreHub server. Please verify the backend is running.');
        } else {
          setError(err.message || 'Failed to load marketplace components.');
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while loading components.');
      }
      setPagedData(null);
    } finally {
      setLoading(false);
    }
  }, [searchParam, categoryParam, listingTypeParam, statusParam, pageParam]);

  useEffect(() => {
    fetchComponents();
  }, [fetchComponents]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      newParams.set('search', searchInput.trim());
    } else {
      newParams.delete('search');
    }
    newParams.delete('page'); // Reset to first page
    setSearchParams(newParams);
  };

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.delete('page'); // Reset to first page
    setSearchParams(newParams);
  };

  const goToPage = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    if (newPage > 0) {
      newParams.set('page', newPage.toString());
    } else {
      newParams.delete('page');
    }
    setSearchParams(newParams);
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // Ignored in non-browser or test environments
    }
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = Boolean(
    searchParam || categoryParam || listingTypeParam || statusParam || pageParam > 0
  );

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
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Hardware Marketplace</h1>
        <p className="page-description">
          Browse, swap, or borrow electronics components and development boards from fellow engineering students.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="card marketplace-filter-card">
        <form onSubmit={handleSearchSubmit} className="marketplace-search-form">
          <div className="marketplace-search-input-wrapper">
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-subtle)',
              }}
            />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search components by name, description, or pinout..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search components"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>

        <div className="marketplace-filters-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-primary-800)', fontSize: '0.875rem', fontWeight: 600 }}>
            <Filter size={16} />
            <span>Filters:</span>
          </div>

          {/* Category Dropdown */}
          <div className="marketplace-filter-item">
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
              <option value="Development Kits">Development Kits</option>
              <option value="Lab & Prototyping">Lab & Prototyping</option>
              <option value="Power & Discrete">Power & Discrete</option>
              <option value="Passives & Components">Passives & Components</option>
            </select>
          </div>

          {/* Listing Type Filter */}
          <div className="marketplace-filter-item">
            <select
              className="form-select"
              value={listingTypeParam}
              onChange={(e) => updateFilter('listingType', e.target.value)}
              aria-label="Filter by listing type"
            >
              <option value="">All Listing Types</option>
              <option value="SELL">For Sale (SELL)</option>
              <option value="SWAP">For Swap (SWAP)</option>
              <option value="BORROW">For Borrow (BORROW)</option>
            </select>
          </div>

          {/* Availability Status Filter */}
          <div className="marketplace-filter-item">
            <select
              className="form-select"
              value={statusParam}
              onChange={(e) => updateFilter('status', e.target.value)}
              aria-label="Filter by status"
            >
              <option value="">Available (Default)</option>
              <option value="AVAILABLE">Available</option>
              <option value="RESERVED">Reserved</option>
              <option value="EXCHANGED">Exchanged</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={clearAllFilters}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <RotateCcw size={14} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Listing Content States */}
      {loading && <LoadingState message="Fetching marketplace components from database..." />}

      {error && !loading && (
        <ErrorState
          title="Could not load components"
          message={error}
          onRetry={fetchComponents}
        />
      )}

      {!loading && !error && pagedData && (
        <>
          {/* Results Summary Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span data-testid="results-count" style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              Showing <strong>{pagedData.content.length}</strong> of <strong>{pagedData.totalElements}</strong> component listing{pagedData.totalElements === 1 ? '' : 's'}
              {pagedData.totalPages > 1 && ` (Page ${pagedData.page + 1} of ${pagedData.totalPages})`}
            </span>
          </div>

          {pagedData.content.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
              <Cpu size={40} style={{ color: 'var(--color-primary-500)', marginBottom: '1rem' }} />
              <h3 style={{ marginBottom: '0.5rem' }}>No matching components found</h3>
              <p style={{ maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
                No active electronic components match your search and filter criteria. Try clearing filters to view all available listings.
              </p>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={clearAllFilters}
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              {/* Component Cards Grid */}
              <div className="grid-cards">
                {pagedData.content.map((item) => (
                  <div key={item.id} className="card card-hoverable component-card">
                    <div className="component-card-header">
                      <span className={`badge ${getListingBadgeClass(item.listingType)}`}>
                        {item.listingType}
                      </span>
                      <span className={`badge ${getStatusBadgeClass(item.status)}`}>
                        {item.status}
                      </span>
                    </div>

                    <h3 className="component-card-title">
                      <Link to={`/components/${item.id}`}>
                        {item.title}
                      </Link>
                    </h3>

                    <div className="component-card-category">
                      <Tag size={13} style={{ flexShrink: 0 }} />
                      <span>{item.category}</span>
                    </div>

                    <p className="component-card-description">
                      {item.description}
                    </p>

                    {item.specifications && (
                      <div
                        className="component-card-specs"
                        title={item.specifications}
                      >
                        {item.specifications}
                      </div>
                    )}

                    <div className="component-card-footer">
                      <div className="component-card-price">
                        {item.listingType === ListingType.SELL && item.price != null ? (
                          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary-900)', whiteSpace: 'nowrap' }}>
                            LKR {item.price.toFixed(2)}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-accent-600)', whiteSpace: 'nowrap' }}>
                            {item.listingType === ListingType.SWAP ? 'Exchange / Swap' : 'Free Lab Borrow'}
                          </span>
                        )}
                      </div>
                      <div className="component-card-seller">
                        <User size={13} style={{ flexShrink: 0 }} />
                        <span className="component-card-seller-name" title={item.ownerName}>
                          {item.ownerName}
                        </span>
                      </div>
                    </div>

                    <Link
                      to={`/components/${item.id}`}
                      className="btn btn-outline btn-sm"
                      style={{ marginTop: '1rem', width: '100%' }}
                    >
                      View Details
                    </Link>
                  </div>
                ))}
              </div>

              {/* Server-Side Pagination Controls */}
              {pagedData.totalPages > 1 && (
                <div className="pagination-container" aria-label="Pagination">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    disabled={pagedData.page === 0}
                    onClick={() => goToPage(pagedData.page - 1)}
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={16} />
                    <span>Previous</span>
                  </button>

                  <div className="pagination-pages">
                    {Array.from({ length: pagedData.totalPages }, (_, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`btn btn-sm ${i === pagedData.page ? 'btn-primary' : 'btn-outline'}`}
                        style={{ minWidth: '2.25rem', padding: '0.35rem 0.5rem' }}
                        onClick={() => goToPage(i)}
                        aria-current={i === pagedData.page ? 'page' : undefined}
                        aria-label={`Page ${i + 1}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    disabled={pagedData.last || pagedData.page >= pagedData.totalPages - 1}
                    onClick={() => goToPage(pagedData.page + 1)}
                    aria-label="Next page"
                  >
                    <span>Next</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};
