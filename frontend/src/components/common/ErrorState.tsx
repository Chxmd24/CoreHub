import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showHomeLink?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to Load Content',
  message = 'An unexpected error occurred while fetching information from the server.',
  onRetry,
  showHomeLink = true,
}) => {
  return (
    <div
      className="state-container"
      role="alert"
      style={{ borderColor: 'var(--color-danger-100)' }}
    >
      <div className="error-icon-wrapper" aria-hidden="true">
        <AlertTriangle size={28} />
      </div>

      <h3 style={{ fontSize: '1.25rem', color: 'var(--color-danger-700)', marginBottom: '0.5rem' }}>
        {title}
      </h3>

      <p style={{ maxWidth: '480px', marginBottom: '1.5rem', fontSize: '0.925rem' }}>
        {message}
      </p>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {onRetry && (
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={onRetry}
          >
            <RotateCcw size={15} />
            <span>Try Again</span>
          </button>
        )}
        {showHomeLink && (
          <Link to="/" className="btn btn-sm btn-outline">
            <Home size={15} />
            <span>Return to Home</span>
          </Link>
        )}
      </div>
    </div>
  );
};
