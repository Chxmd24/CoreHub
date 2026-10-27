import React from 'react';

interface LoadingStateProps {
  message?: string;
  subtext?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading CoreHub data...',
  subtext = 'Connecting to the marketplace server',
}) => {
  return (
    <div
      className="state-container"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="spinner" aria-hidden="true" />
      <h3 style={{ fontSize: '1.15rem', color: 'var(--color-primary-900)', marginBottom: '0.375rem' }}>
        {message}
      </h3>
      {subtext && (
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-subtle)' }}>
          {subtext}
        </p>
      )}
    </div>
  );
};
