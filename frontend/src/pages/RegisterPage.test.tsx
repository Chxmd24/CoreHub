import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RegisterPage } from './RegisterPage';
import * as AuthContextModule from '../context/AuthContext';
import { ApiError } from '../api/client';
import { UserResponse, Role } from '../api/types';

const mockRegisteredUser: UserResponse = {
  id: 10,
  name: 'Nuwan Bandara',
  studentId: 'E/20/150',
  email: 'e20150@eng.pdn.ac.lk',
  phone: '+94779876543',
  department: 'Computer Engineering',
  role: Role.USER,
  createdAt: '2026-10-27T10:00:00Z',
};

const renderRegisterPage = () => {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<div>Destination Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('RegisterPage', () => {
  const mockRegister = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      register: mockRegister,
      logout: vi.fn(),
      refreshProfile: vi.fn(),
    });
  });

  it('renders registration form fields with accessible labels and hints', () => {
    renderRegisterPage();

    expect(screen.getByRole('heading', { name: /join corehub/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/student registration id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/institutional email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contact phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/department/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /complete registration/i })).toBeInTheDocument();
  });

  it('validates client-side constraints for empty fields and short password', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    // Submit empty form
    await user.click(screen.getByRole('button', { name: /complete registration/i }));

    expect(mockRegister).not.toHaveBeenCalled();
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Student ID is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();

    // Fill valid name, studentId, email, but short password (5 chars < 6 backend minimum)
    await user.type(screen.getByLabelText(/full name/i), 'Nuwan Bandara');
    await user.type(screen.getByLabelText(/student registration id/i), 'E/20/150');
    await user.type(screen.getByLabelText(/institutional email/i), 'e20150@eng.pdn.ac.lk');
    await user.type(screen.getByLabelText(/^password/i), '12345');

    await user.click(screen.getByRole('button', { name: /complete registration/i }));

    expect(mockRegister).not.toHaveBeenCalled();
    expect(screen.getByText('Password must be at least 6 characters long')).toBeInTheDocument();
  });

  it('successfully creates account and shows student confirmation card with login guide', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValueOnce(mockRegisteredUser);

    renderRegisterPage();

    await user.type(screen.getByLabelText(/full name/i), 'Nuwan Bandara');
    await user.type(screen.getByLabelText(/student registration id/i), 'E/20/150');
    await user.type(screen.getByLabelText(/institutional email/i), 'e20150@eng.pdn.ac.lk');
    await user.type(screen.getByLabelText(/^password/i), 'securepass123');
    await user.type(screen.getByLabelText(/contact phone/i), '+94779876543');
    await user.selectOptions(screen.getByLabelText(/department/i), 'Computer Engineering');

    await user.click(screen.getByRole('button', { name: /complete registration/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: 'Nuwan Bandara',
        studentId: 'E/20/150',
        email: 'e20150@eng.pdn.ac.lk',
        password: 'securepass123',
        phone: '+94779876543',
        department: 'Computer Engineering',
      });
    });

    // Confirmation card is displayed
    expect(screen.getByRole('heading', { name: /account created successfully!/i })).toBeInTheDocument();
    expect(screen.getByText('Nuwan Bandara')).toBeInTheDocument();
    expect(screen.getByText('E/20/150')).toBeInTheDocument();
    expect(screen.getByText('e20150@eng.pdn.ac.lk')).toBeInTheDocument();

    // Clicking "Proceed to Sign In" guides user to login
    await user.click(screen.getByRole('button', { name: /proceed to sign in/i }));

    expect(screen.getByText('Destination Login Page')).toBeInTheDocument();
  });

  it('handles duplicate registration conflict (HTTP 409)', async () => {
    const user = userEvent.setup();
    mockRegister.mockRejectedValueOnce(
      new ApiError('Email is already registered: e20150@eng.pdn.ac.lk', 409, {
        status: 409,
        message: 'Email is already registered: e20150@eng.pdn.ac.lk',
      })
    );

    renderRegisterPage();

    await user.type(screen.getByLabelText(/full name/i), 'Nuwan Bandara');
    await user.type(screen.getByLabelText(/student registration id/i), 'E/20/150');
    await user.type(screen.getByLabelText(/institutional email/i), 'e20150@eng.pdn.ac.lk');
    await user.type(screen.getByLabelText(/^password/i), 'securepass123');

    await user.click(screen.getByRole('button', { name: /complete registration/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'An account with this email or student registration number already exists'
      );
    });
  });

  it('handles backend validation errors (HTTP 400)', async () => {
    const user = userEvent.setup();
    mockRegister.mockRejectedValueOnce(
      new ApiError('Validation failed', 400, {
        status: 400,
        validationErrors: {
          email: 'must be a well-formed email address',
        },
      })
    );

    renderRegisterPage();

    await user.type(screen.getByLabelText(/full name/i), 'Nuwan Bandara');
    await user.type(screen.getByLabelText(/student registration id/i), 'E/20/150');
    await user.type(screen.getByLabelText(/institutional email/i), 'invalid-domain@unknown.com');
    await user.type(screen.getByLabelText(/^password/i), 'securepass123');

    await user.click(screen.getByRole('button', { name: /complete registration/i }));

    await waitFor(() => {
      expect(screen.getByText('must be a well-formed email address')).toBeInTheDocument();
    });
  });
});
