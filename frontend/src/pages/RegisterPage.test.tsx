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
  studentId: 'EG/2020/0150',
  email: 'eg200150@engug.ruh.ac.lk',
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
    expect(screen.getByText('Contact phone number is required')).toBeInTheDocument();
    expect(screen.getByText('Engineering department is required')).toBeInTheDocument();

    // Fill valid name, studentId, email, phone, department, but short password (5 chars < 6 backend minimum)
    await user.type(screen.getByLabelText(/full name/i), 'Nuwan Bandara');
    await user.type(screen.getByLabelText(/student registration id/i), 'EG/2020/0150');
    await user.type(screen.getByLabelText(/institutional email/i), 'eg200150@engug.ruh.ac.lk');
    await user.type(screen.getByLabelText(/contact phone/i), '+94779876543');
    await user.selectOptions(screen.getByLabelText(/department/i), 'Computer Engineering');
    await user.type(screen.getByLabelText(/^password/i), '12345');

    await user.click(screen.getByRole('button', { name: /complete registration/i }));

    expect(mockRegister).not.toHaveBeenCalled();
    expect(screen.getByText('Password must be at least 6 characters long')).toBeInTheDocument();
  });

  it('rejects invalid faculty email formats', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    await user.type(screen.getByLabelText(/full name/i), 'Nuwan Bandara');
    await user.type(screen.getByLabelText(/student registration id/i), 'EG/2020/0150');
    await user.type(screen.getByLabelText(/contact phone/i), '+94779876543');
    await user.selectOptions(screen.getByLabelText(/department/i), 'Computer Engineering');
    await user.type(screen.getByLabelText(/^password/i), 'securepass123');

    // Invalid email 1: Gmail
    await user.type(screen.getByLabelText(/institutional email/i), 'student@gmail.com');
    await user.click(screen.getByRole('button', { name: /complete registration/i }));

    expect(mockRegister).not.toHaveBeenCalled();
    expect(screen.getByText(/email must be a valid faculty email/i)).toBeInTheDocument();

    // Invalid email 2: 5 digits instead of 6
    await user.clear(screen.getByLabelText(/institutional email/i));
    await user.type(screen.getByLabelText(/institutional email/i), 'eg12345@engug.ruh.ac.lk');
    await user.click(screen.getByRole('button', { name: /complete registration/i }));

    expect(mockRegister).not.toHaveBeenCalled();
    expect(screen.getByText(/email must be a valid faculty email/i)).toBeInTheDocument();
  });

  it('rejects invalid student registration ID formats', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    await user.type(screen.getByLabelText(/full name/i), 'Nuwan Bandara');
    await user.type(screen.getByLabelText(/institutional email/i), 'eg200150@engug.ruh.ac.lk');
    await user.type(screen.getByLabelText(/contact phone/i), '+94779876543');
    await user.selectOptions(screen.getByLabelText(/department/i), 'Computer Engineering');
    await user.type(screen.getByLabelText(/^password/i), 'securepass123');

    // Invalid student ID: Legacy E/20/0001
    await user.type(screen.getByLabelText(/student registration id/i), 'E/20/0001');
    await user.click(screen.getByRole('button', { name: /complete registration/i }));

    expect(mockRegister).not.toHaveBeenCalled();
    expect(screen.getByText(/student id must be in the format eg\/xxxx\/xxxx/i)).toBeInTheDocument();
  });

  it('successfully creates account with case normalization and shows student confirmation card', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValueOnce(mockRegisteredUser);

    renderRegisterPage();

    await user.type(screen.getByLabelText(/full name/i), 'Nuwan Bandara');
    // Type with lowercase / mixed-case to verify normalization
    await user.type(screen.getByLabelText(/student registration id/i), 'eg/2020/0150');
    await user.type(screen.getByLabelText(/institutional email/i), 'EG200150@ENGUG.RUH.AC.LK');
    await user.type(screen.getByLabelText(/^password/i), 'securepass123');
    await user.type(screen.getByLabelText(/contact phone/i), '+94779876543');
    await user.selectOptions(screen.getByLabelText(/department/i), 'Computer Engineering');

    await user.click(screen.getByRole('button', { name: /complete registration/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: 'Nuwan Bandara',
        studentId: 'EG/2020/0150',
        email: 'eg200150@engug.ruh.ac.lk',
        password: 'securepass123',
        phone: '+94779876543',
        department: 'Computer Engineering',
      });
    });

    // Confirmation card is displayed
    expect(screen.getByRole('heading', { name: /account created successfully!/i })).toBeInTheDocument();
    expect(screen.getByText('Nuwan Bandara')).toBeInTheDocument();
    expect(screen.getByText('EG/2020/0150')).toBeInTheDocument();
    expect(screen.getByText('eg200150@engug.ruh.ac.lk')).toBeInTheDocument();

    // Clicking "Proceed to Sign In" guides user to login
    await user.click(screen.getByRole('button', { name: /proceed to sign in/i }));

    expect(screen.getByText('Destination Login Page')).toBeInTheDocument();
  });

  it('handles duplicate registration conflict (HTTP 409)', async () => {
    const user = userEvent.setup();
    mockRegister.mockRejectedValueOnce(
      new ApiError('Email is already registered: eg200150@engug.ruh.ac.lk', 409, {
        status: 409,
        message: 'Email is already registered: eg200150@engug.ruh.ac.lk',
      })
    );

    renderRegisterPage();

    await user.type(screen.getByLabelText(/full name/i), 'Nuwan Bandara');
    await user.type(screen.getByLabelText(/student registration id/i), 'EG/2020/0150');
    await user.type(screen.getByLabelText(/institutional email/i), 'eg200150@engug.ruh.ac.lk');
    await user.type(screen.getByLabelText(/contact phone/i), '+94779876543');
    await user.selectOptions(screen.getByLabelText(/department/i), 'Computer Engineering');
    await user.type(screen.getByLabelText(/^password/i), 'securepass123');

    await user.click(screen.getByRole('button', { name: /complete registration/i }));

    await waitFor(() => {
      expect(screen.getByText(/already exists/i)).toBeInTheDocument();
    });
  });

  it('handles backend validation errors (HTTP 400)', async () => {
    const user = userEvent.setup();
    mockRegister.mockRejectedValueOnce(
      new ApiError('Bad Request', 400, {
        timestamp: '2026-10-27T10:00:00Z',
        status: 400,
        error: 'Bad Request',
        message: 'Validation failed',
        validationErrors: {
          email: 'Email must be a valid faculty email in the format egXXXXXX@engug.ruh.ac.lk',
        },
      })
    );

    renderRegisterPage();

    await user.type(screen.getByLabelText(/full name/i), 'Nuwan Bandara');
    await user.type(screen.getByLabelText(/student registration id/i), 'EG/2020/0150');
    await user.type(screen.getByLabelText(/institutional email/i), 'eg200150@engug.ruh.ac.lk');
    await user.type(screen.getByLabelText(/contact phone/i), '+94779876543');
    await user.selectOptions(screen.getByLabelText(/department/i), 'Computer Engineering');
    await user.type(screen.getByLabelText(/^password/i), 'securepass123');

    await user.click(screen.getByRole('button', { name: /complete registration/i }));

    await waitFor(() => {
      expect(screen.getByText('Email must be a valid faculty email in the format egXXXXXX@engug.ruh.ac.lk')).toBeInTheDocument();
    });
  });

  it('allows selecting each of the five official engineering departments', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    const select = screen.getByLabelText(/department/i) as HTMLSelectElement;
    const officialDepts = [
      'Electrical and Information Engineering',
      'Civil and Environmental Engineering',
      'Marine Engineering and Naval Architecture',
      'Mechanical and Manufacturing Engineering',
      'Computer Engineering',
    ];

    for (const dept of officialDepts) {
      await user.selectOptions(select, dept);
      expect(select.value).toBe(dept);
    }
  });
});
