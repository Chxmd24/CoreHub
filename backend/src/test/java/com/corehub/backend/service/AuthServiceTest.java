package com.corehub.backend.service;

import com.corehub.backend.dto.AuthResponse;
import com.corehub.backend.dto.LoginRequest;
import com.corehub.backend.dto.RegisterRequest;
import com.corehub.backend.dto.UserResponse;
import com.corehub.backend.entity.Role;
import com.corehub.backend.entity.User;
import com.corehub.backend.exception.DuplicateResourceException;
import com.corehub.backend.repository.UserRepository;
import com.corehub.backend.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    private PasswordEncoder passwordEncoder;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder();
        authService = new AuthService(userRepository, passwordEncoder, jwtService, authenticationManager);
    }

    @Test
    void shouldRegisterStudentWithHashedPasswordAndRoleUser() {
        RegisterRequest request = new RegisterRequest(
                "Chamod Udayanga",
                "E/20/001",
                "chamod@eng.pdn.ac.lk",
                "SecureP@ss123",
                "0712345678",
                "Electrical and Electronic"
        );

        when(userRepository.existsByEmail("chamod@eng.pdn.ac.lk")).thenReturn(false);
        when(userRepository.existsByStudentId("E/20/001")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(100L);
            user.setCreatedAt(LocalDateTime.now());
            return user;
        });

        UserResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals(100L, response.getId());
        assertEquals("Chamod Udayanga", response.getName());
        assertEquals("E/20/001", response.getStudentId());
        assertEquals("chamod@eng.pdn.ac.lk", response.getEmail());
        assertEquals(Role.USER, response.getRole(), "Role must always be assigned as USER on registration");

        // Verify captured entity has hashed password
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();

        assertNotEquals("SecureP@ss123", savedUser.getPasswordHash(), "Plaintext password must never be stored");
        assertTrue(passwordEncoder.matches("SecureP@ss123", savedUser.getPasswordHash()),
                "Password must be hashed with BCrypt and match raw password");
        assertEquals(Role.USER, savedUser.getRole());
    }

    @Test
    void shouldRejectDuplicateEmailWithConflictException() {
        RegisterRequest request = new RegisterRequest(
                "John Doe", "E/20/002", "duplicate@eng.pdn.ac.lk", "password123", null, null
        );

        when(userRepository.existsByEmail("duplicate@eng.pdn.ac.lk")).thenReturn(true);

        DuplicateResourceException exception = assertThrows(
                DuplicateResourceException.class,
                () -> authService.register(request)
        );

        assertTrue(exception.getMessage().contains("Email is already registered"));
    }

    @Test
    void shouldRejectDuplicateStudentIdWithConflictException() {
        RegisterRequest request = new RegisterRequest(
                "John Doe", "E/20/001", "unique@eng.pdn.ac.lk", "password123", null, null
        );

        when(userRepository.existsByEmail("unique@eng.pdn.ac.lk")).thenReturn(false);
        when(userRepository.existsByStudentId("E/20/001")).thenReturn(true);

        DuplicateResourceException exception = assertThrows(
                DuplicateResourceException.class,
                () -> authService.register(request)
        );

        assertTrue(exception.getMessage().contains("Student ID is already registered"));
    }

    @Test
    void shouldPreventAdminRoleAssignmentThroughRegistration() {
        // RegisterRequest does not allow setting a role, and service explicitly sets Role.USER
        RegisterRequest request = new RegisterRequest(
                "Hacker Attempt", "E/20/999", "hacker@eng.pdn.ac.lk", "hackPass123", null, null
        );

        when(userRepository.existsByEmail("hacker@eng.pdn.ac.lk")).thenReturn(false);
        when(userRepository.existsByStudentId("E/20/999")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserResponse response = authService.register(request);
        assertEquals(Role.USER, response.getRole(), "User role must strictly be USER, never ADMIN");
    }

    @Test
    void shouldLoginSuccessfullyAndReturnJwtToken() {
        LoginRequest request = new LoginRequest("chamod@eng.pdn.ac.lk", "SecureP@ss123");

        User existingUser = new User("E/20/001", "Chamod", "chamod@eng.pdn.ac.lk",
                passwordEncoder.encode("SecureP@ss123"), "0712345678", "EE", Role.USER);
        existingUser.setId(10L);

        when(userRepository.findByEmail("chamod@eng.pdn.ac.lk")).thenReturn(Optional.of(existingUser));
        when(jwtService.generateToken(existingUser)).thenReturn("sample.jwt.token");
        when(jwtService.getExpirationMs()).thenReturn(3600000L);

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("sample.jwt.token", response.getAccessToken());
        assertEquals("Bearer", response.getTokenType());
        assertEquals(3600000L, response.getExpiresIn());
        assertEquals("chamod@eng.pdn.ac.lk", response.getUser().getEmail());

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    void shouldRejectInvalidLoginCredentials() {
        LoginRequest request = new LoginRequest("chamod@eng.pdn.ac.lk", "WrongPassword");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        BadCredentialsException exception = assertThrows(
                BadCredentialsException.class,
                () -> authService.login(request)
        );

        assertEquals("Invalid email or password", exception.getMessage());
    }
}
