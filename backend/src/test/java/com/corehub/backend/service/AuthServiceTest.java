package com.corehub.backend.service;

import com.corehub.backend.dto.AuthResponse;
import com.corehub.backend.dto.LoginRequest;
import com.corehub.backend.dto.RegisterRequest;
import com.corehub.backend.dto.UserResponse;
import com.corehub.backend.entity.Department;
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
                "Kasun Perera",
                "EG/2020/0001",
                "eg200001@engug.ruh.ac.lk",
                "SecureP@ss123",
                "0712345678",
                "Electrical and Information Engineering"
        );

        when(userRepository.existsByEmail("eg200001@engug.ruh.ac.lk")).thenReturn(false);
        when(userRepository.existsByStudentId("EG/2020/0001")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(100L);
            user.setCreatedAt(LocalDateTime.now());
            return user;
        });

        UserResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals(100L, response.getId());
        assertEquals("Kasun Perera", response.getName());
        assertEquals("EG/2020/0001", response.getStudentId());
        assertEquals("eg200001@engug.ruh.ac.lk", response.getEmail());
        assertEquals("0712345678", response.getPhone());
        assertEquals("Electrical and Information Engineering", response.getDepartment());
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
    void shouldNormalizeEmailToLowercaseAndStudentIdToUppercase() {
        RegisterRequest request = new RegisterRequest(
                "Kasun Perera",
                "  eg/2020/0001  ",
                "  EG200001@ENGUG.RUH.AC.LK  ",
                "Password123",
                "+94771234567",
                "Computer Engineering"
        );

        when(userRepository.existsByEmail("eg200001@engug.ruh.ac.lk")).thenReturn(false);
        when(userRepository.existsByStudentId("EG/2020/0001")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(101L);
            return user;
        });

        UserResponse response = authService.register(request);

        assertEquals("eg200001@engug.ruh.ac.lk", response.getEmail());
        assertEquals("EG/2020/0001", response.getStudentId());
    }

    @Test
    void shouldRejectInvalidFacultyEmailFormats() {
        String[] invalidEmails = {
                "student@gmail.com",
                "eg12345@engug.ruh.ac.lk", // 5 digits < 6
                "eg1234567@engug.ruh.ac.lk", // 7 digits > 6
                "eg123456@other.ac.lk", // wrong domain
                "plainaddress",
                "egABCDEF@engug.ruh.ac.lk"
        };

        for (String invalidEmail : invalidEmails) {
            RegisterRequest req = new RegisterRequest(
                    "Test User", "EG/2020/0001", invalidEmail, "Password123", "+94771234567", "Computer Engineering"
            );
            assertThrows(IllegalArgumentException.class, () -> authService.register(req),
                    "Expected invalid email to be rejected: " + invalidEmail);
        }
    }

    @Test
    void shouldRejectInvalidStudentIdFormats() {
        String[] invalidStudentIds = {
                "E/20/0001",
                "EG/20/0001",
                "EG/2020/00",
                "EG/2020/00001",
                "INVALID_ID"
        };

        for (String invalidId : invalidStudentIds) {
            RegisterRequest req = new RegisterRequest(
                    "Test User", invalidId, "eg200001@engug.ruh.ac.lk", "Password123", "+94771234567", "Computer Engineering"
            );
            assertThrows(IllegalArgumentException.class, () -> authService.register(req),
                    "Expected invalid student ID to be rejected: " + invalidId);
        }
    }

    @Test
    void shouldRejectBlankPhoneOnRegistration() {
        RegisterRequest req = new RegisterRequest(
                "Test User", "EG/2020/0001", "eg200001@engug.ruh.ac.lk", "Password123", "", "Computer Engineering"
        );
        assertThrows(IllegalArgumentException.class, () -> authService.register(req));
    }

    @Test
    void shouldRejectBlankOrInvalidDepartmentOnRegistration() {
        RegisterRequest blankDeptReq = new RegisterRequest(
                "Test User", "EG/2020/0001", "eg200001@engug.ruh.ac.lk", "Password123", "+94771234567", ""
        );
        assertThrows(IllegalArgumentException.class, () -> authService.register(blankDeptReq));

        RegisterRequest invalidDeptReq = new RegisterRequest(
                "Test User", "EG/2020/0001", "eg200001@engug.ruh.ac.lk", "Password123", "+94771234567", "Software Engineering"
        );
        assertThrows(IllegalArgumentException.class, () -> authService.register(invalidDeptReq));
    }

    @Test
    void shouldAcceptAllFiveSupportedDepartments() {
        for (String dept : Department.ALL_DISPLAY_NAMES) {
            RegisterRequest req = new RegisterRequest(
                    "Dept Student", "EG/2020/0001", "eg200001@engug.ruh.ac.lk", "Password123", "+94771234567", dept
            );
            when(userRepository.existsByEmail("eg200001@engug.ruh.ac.lk")).thenReturn(false);
            when(userRepository.existsByStudentId("EG/2020/0001")).thenReturn(false);
            when(userRepository.save(any(User.class))).thenAnswer(inv -> {
                User u = inv.getArgument(0);
                u.setId(200L);
                return u;
            });

            UserResponse res = authService.register(req);
            assertEquals(dept, res.getDepartment());
        }
    }

    @Test
    void shouldRejectDuplicateEmailWithConflictException() {
        RegisterRequest request = new RegisterRequest(
                "John Doe", "EG/2020/0002", "eg200002@engug.ruh.ac.lk", "password123", "+94771234567", "Civil and Environmental Engineering"
        );

        when(userRepository.existsByEmail("eg200002@engug.ruh.ac.lk")).thenReturn(true);

        DuplicateResourceException exception = assertThrows(DuplicateResourceException.class, () -> {
            authService.register(request);
        });

        assertTrue(exception.getMessage().contains("Email is already registered"));
    }

    @Test
    void shouldRejectDuplicateStudentIdWithConflictException() {
        RegisterRequest request = new RegisterRequest(
                "John Doe", "EG/2020/0002", "eg200002@engug.ruh.ac.lk", "password123", "+94771234567", "Civil and Environmental Engineering"
        );

        when(userRepository.existsByEmail("eg200002@engug.ruh.ac.lk")).thenReturn(false);
        when(userRepository.existsByStudentId("EG/2020/0002")).thenReturn(true);

        DuplicateResourceException exception = assertThrows(DuplicateResourceException.class, () -> {
            authService.register(request);
        });

        assertTrue(exception.getMessage().contains("Student ID is already registered"));
    }

    @Test
    void shouldAuthenticateValidUserAndReturnJwtToken() {
        LoginRequest request = new LoginRequest("eg200001@engug.ruh.ac.lk", "CorrectPassword123");

        User existingUser = new User(
                "EG/2020/0001",
                "Kasun Perera",
                "eg200001@engug.ruh.ac.lk",
                "$2a$10$hashedPassword",
                "+94771234567",
                "Computer Engineering",
                Role.USER
        );
        existingUser.setId(42L);

        when(userRepository.findByEmail("eg200001@engug.ruh.ac.lk")).thenReturn(Optional.of(existingUser));
        when(jwtService.generateToken(existingUser)).thenReturn("signed-jwt-token-string");
        when(jwtService.getExpirationMs()).thenReturn(3600000L);

        AuthResponse authResponse = authService.login(request);

        assertNotNull(authResponse);
        assertEquals("signed-jwt-token-string", authResponse.getAccessToken());
        assertEquals("Bearer", authResponse.getTokenType());
        assertEquals(3600000L, authResponse.getExpiresIn());
        assertEquals(42L, authResponse.getUser().getId());
        assertEquals("eg200001@engug.ruh.ac.lk", authResponse.getUser().getEmail());

        verify(authenticationManager).authenticate(
                any(UsernamePasswordAuthenticationToken.class)
        );
    }

    @Test
    void shouldAllowExistingLegacyAccountsToLogInWithoutBeingRejectedByRegistrationPattern() {
        // Legacy account created under older rules
        LoginRequest legacyLogin = new LoginRequest("legacy.student@pdn.ac.lk", "LegacyPass123");

        User legacyUser = new User(
                "E/18/001",
                "Legacy Student",
                "legacy.student@pdn.ac.lk",
                "$2a$10$hashedPassword",
                null,
                null,
                Role.USER
        );
        legacyUser.setId(99L);

        when(userRepository.findByEmail("legacy.student@pdn.ac.lk")).thenReturn(Optional.of(legacyUser));
        when(jwtService.generateToken(legacyUser)).thenReturn("legacy-jwt-token");
        when(jwtService.getExpirationMs()).thenReturn(3600000L);

        AuthResponse authResponse = authService.login(legacyLogin);

        assertNotNull(authResponse);
        assertEquals("legacy-jwt-token", authResponse.getAccessToken());
        assertEquals("legacy.student@pdn.ac.lk", authResponse.getUser().getEmail());
    }

    @Test
    void shouldThrowBadCredentialsExceptionWhenPasswordIsIncorrect() {
        LoginRequest request = new LoginRequest("eg200001@engug.ruh.ac.lk", "WrongPassword");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        BadCredentialsException exception = assertThrows(BadCredentialsException.class, () -> {
            authService.login(request);
        });

        assertEquals("Invalid email or password", exception.getMessage());
    }
}
