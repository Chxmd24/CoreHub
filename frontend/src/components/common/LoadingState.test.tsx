import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingState } from './LoadingState';

describe('LoadingState Component', () => {
  it('renders with default message when no message is provided', () => {
    render(<LoadingState />);
    const statusElement = screen.getByRole('status');
    expect(statusElement).toBeInTheDocument();
    expect(screen.getByText('Loading CoreHub data...')).toBeInTheDocument();
  });

  it('renders custom loading message', () => {
    render(<LoadingState message="Fetching microcontroller listings..." />);
    expect(screen.getByText('Fetching microcontroller listings...')).toBeInTheDocument();
  });

  it('has accessible status role and aria attributes', () => {
    render(<LoadingState message="Processing request..." />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
  });
});
