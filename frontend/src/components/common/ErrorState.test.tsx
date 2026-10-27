import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ErrorState } from './ErrorState';

describe('ErrorState Component', () => {
  it('renders default error message and title', () => {
    render(
      <BrowserRouter>
        <ErrorState />
      </BrowserRouter>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Unable to Load Content')).toBeInTheDocument();
    expect(
      screen.getByText('An unexpected error occurred while fetching information from the server.')
    ).toBeInTheDocument();
  });

  it('renders custom error title and message', () => {
    render(
      <BrowserRouter>
        <ErrorState
          title="Component Fetch Failed"
          message="Could not reach Spring Boot backend at localhost:8080."
        />
      </BrowserRouter>
    );

    expect(screen.getByText('Component Fetch Failed')).toBeInTheDocument();
    expect(
      screen.getByText('Could not reach Spring Boot backend at localhost:8080.')
    ).toBeInTheDocument();
  });

  it('calls onRetry callback when retry button is clicked', async () => {
    const handleRetry = vi.fn();
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <ErrorState onRetry={handleRetry} />
      </BrowserRouter>
    );

    const retryButton = screen.getByRole('button', { name: /try again/i });
    expect(retryButton).toBeInTheDocument();

    await user.click(retryButton);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('renders return home link by default', () => {
    render(
      <BrowserRouter>
        <ErrorState />
      </BrowserRouter>
    );

    const homeLink = screen.getByRole('link', { name: /return to home/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('hides home link when showHomeLink is false', () => {
    render(
      <BrowserRouter>
        <ErrorState showHomeLink={false} />
      </BrowserRouter>
    );

    expect(screen.queryByRole('link', { name: /return to home/i })).not.toBeInTheDocument();
  });
});
