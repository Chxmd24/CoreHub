import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { MyProfilePage } from './MyProfilePage';
import { api, ApiClientError } from '../api/client';
import * as AuthContextModule from '../context/AuthContext';
import { UserResponse, Role } from '../api/types';

const mockProfile: UserResponse = {
  id: 1,
  name: 'Chamod Perera',
  studentId: 'EG/2020/0001',
  email: 'eg200001@engug.ruh.ac.lk',
  phone: '+94771234567',
  department: 'Computer Engineering',
  role: Role.SUPER_ADMIN,
  createdAt: '2026-10-20T10:00:00Z',
};

describe('MyProfilePage Component', () => {
  const mockRefreshProfile = vi.fn().mockResolvedValue(mockProfile);

  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: mockProfile,
      token: 'jwt-token-123',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshProfile: mockRefreshProfile,
    });
  });

  it('renders student profile details correctly in read mode', async () => {
    vi.spyOn(api.users, 'getMe').mockResolvedValue(mockProfile);

    render(
      <BrowserRouter>
        <MyProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('profile-display-name')).toHaveTextContent('Chamod Perera');
    });

    expect(screen.getAllByText('eg200001@engug.ruh.ac.lk').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('EG/2020/0001').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('+94771234567')).toBeInTheDocument();
    expect(screen.getByText('Computer Engineering')).toBeInTheDocument();
    expect(screen.getAllByText('SUPER ADMIN').length).toBeGreaterThan(0);
    expect(screen.getByText(/October 20, 2026/i)).toBeInTheDocument();

    // Verify Read-Only indicators are removed
    expect(screen.queryByText(/read-only/i)).not.toBeInTheDocument();
    expect(screen.getByText('University Email')).toBeInTheDocument();
    expect(screen.getByText('Student Registration Number')).toBeInTheDocument();
    expect(screen.getByText('Platform Role')).toBeInTheDocument();
    expect(screen.getByText('Member Since')).toBeInTheDocument();

    // Edit button is visible
    expect(screen.getByRole('button', { name: /edit profile/i })).toBeInTheDocument();
  });

  it('switches to edit mode, validates blank name, and shows error message', async () => {
    const user = userEvent.setup();
    vi.spyOn(api.users, 'getMe').mockResolvedValue(mockProfile);

    render(
      <BrowserRouter>
        <MyProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('profile-display-name')).toHaveTextContent('Chamod Perera');
    });

    // Click Edit Profile
    await user.click(screen.getByRole('button', { name: /edit profile/i }));

    const nameInput = screen.getByLabelText(/full name/i);
    expect(nameInput).toBeInTheDocument();
    expect(nameInput).toHaveValue('Chamod Perera');

    // Clear name
    await user.clear(nameInput);

    // Click Save Changes
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(screen.getByText(/full name is required/i)).toBeInTheDocument();
  });

  it('updates allowed profile fields and displays success message', async () => {
    const user = userEvent.setup();
    vi.spyOn(api.users, 'getMe').mockResolvedValue(mockProfile);

    const updatedProfile: UserResponse = {
      ...mockProfile,
      name: 'Chamod Perera Updated',
      phone: '+94779998877',
      department: 'Electrical and Information Engineering',
    };

    const updateProfileSpy = vi.spyOn(api.users, 'updateProfile').mockResolvedValue(updatedProfile);

    render(
      <BrowserRouter>
        <MyProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('profile-display-name')).toHaveTextContent('Chamod Perera');
    });

    // Enter edit mode
    await user.click(screen.getByRole('button', { name: /edit profile/i }));

    // Modify fields
    const nameInput = screen.getByLabelText(/full name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Chamod Perera Updated');

    const phoneInput = screen.getByLabelText(/contact phone/i);
    await user.clear(phoneInput);
    await user.type(phoneInput, '+94779998877');

    const deptSelect = screen.getByLabelText(/department/i);
    await user.selectOptions(deptSelect, 'Electrical and Information Engineering');

    // Submit form
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(updateProfileSpy).toHaveBeenCalledWith({
        name: 'Chamod Perera Updated',
        phone: '+94779998877',
        department: 'Electrical and Information Engineering',
      });
    });

    // Check success feedback banner
    expect(await screen.findByText(/profile updated successfully/i)).toBeInTheDocument();
    expect(mockRefreshProfile).toHaveBeenCalledTimes(1);

    // Displays updated values
    expect(screen.getByTestId('profile-display-name')).toHaveTextContent('Chamod Perera Updated');
  });

  it('validates blank phone and department on profile edit', async () => {
    const user = userEvent.setup();
    vi.spyOn(api.users, 'getMe').mockResolvedValue(mockProfile);

    render(
      <BrowserRouter>
        <MyProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('profile-display-name')).toHaveTextContent('Chamod Perera');
    });

    await user.click(screen.getByRole('button', { name: /edit profile/i }));

    const phoneInput = screen.getByLabelText(/contact phone/i);
    await user.clear(phoneInput);

    const deptSelect = screen.getByLabelText(/department/i);
    await user.selectOptions(deptSelect, '');

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(screen.getByText(/contact phone number is required/i)).toBeInTheDocument();
    expect(screen.getByText(/department is required/i)).toBeInTheDocument();
  });

  it('displays legacy department in read mode and enforces selecting a valid department in edit mode', async () => {
    const user = userEvent.setup();
    const legacyProfile: UserResponse = {
      ...mockProfile,
      department: 'Legacy Nonstandard Dept',
    };
    vi.spyOn(api.users, 'getMe').mockResolvedValue(legacyProfile);

    render(
      <BrowserRouter>
        <MyProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('profile-display-name')).toHaveTextContent('Chamod Perera');
    });

    // In read mode, the legacy department string is displayed as-is
    expect(screen.getByText('Legacy Nonstandard Dept')).toBeInTheDocument();

    // Enter edit mode
    await user.click(screen.getByRole('button', { name: /edit profile/i }));

    // Dropdown is not set to any valid option (defaults to placeholder)
    const deptSelect = screen.getByLabelText(/department/i) as HTMLSelectElement;
    expect(deptSelect.value).toBe('');

    // Attempting to save without selecting a valid option fails
    await user.click(screen.getByRole('button', { name: /save changes/i }));
    expect(screen.getByText(/department is required/i)).toBeInTheDocument();

    // Selecting a valid department allows saving
    const updateSpy = vi.spyOn(api.users, 'updateProfile').mockResolvedValue({
      ...legacyProfile,
      department: 'Mechanical and Manufacturing Engineering',
    });

    await user.selectOptions(deptSelect, 'Mechanical and Manufacturing Engineering');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          department: 'Mechanical and Manufacturing Engineering',
        })
      );
    });
  });

  it('cancels edit mode and restores original profile values', async () => {
    const user = userEvent.setup();
    vi.spyOn(api.users, 'getMe').mockResolvedValue(mockProfile);

    render(
      <BrowserRouter>
        <MyProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('profile-display-name')).toHaveTextContent('Chamod Perera');
    });

    await user.click(screen.getByRole('button', { name: /edit profile/i }));

    const nameInput = screen.getByLabelText(/full name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Temporary Typed Name');

    // Cancel edit
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    // Returned to read mode with original name
    expect(screen.getByTestId('profile-display-name')).toHaveTextContent('Chamod Perera');
    expect(screen.queryByLabelText(/full name/i)).not.toBeInTheDocument();
  });

  it('handles backend validation errors from API response', async () => {
    const user = userEvent.setup();
    vi.spyOn(api.users, 'getMe').mockResolvedValue(mockProfile);

    const apiError = new ApiClientError(400, 'Validation failed for one or more fields', {
      timestamp: '2026-10-30T10:00:00Z',
      status: 400,
      error: 'Bad Request',
      message: 'Validation failed for one or more fields',
      validationErrors: {
        phone: 'Phone must not exceed 20 characters',
      },
    });

    vi.spyOn(api.users, 'updateProfile').mockRejectedValue(apiError);

    render(
      <BrowserRouter>
        <MyProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('profile-display-name')).toHaveTextContent('Chamod Perera');
    });

    await user.click(screen.getByRole('button', { name: /edit profile/i }));

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(await screen.findByText('Phone must not exceed 20 characters')).toBeInTheDocument();
    expect(screen.getByText('Validation failed for one or more fields')).toBeInTheDocument();
  });

  it('handles server loading failure with ErrorState component', async () => {
    vi.spyOn(api.users, 'getMe').mockRejectedValue(new Error('Connection to CoreHub backend failed.'));

    render(
      <BrowserRouter>
        <MyProfilePage />
      </BrowserRouter>
    );

    expect(await screen.findByText('Profile Unavailable')).toBeInTheDocument();
    expect(screen.getByText('Connection to CoreHub backend failed.')).toBeInTheDocument();
  });
});
