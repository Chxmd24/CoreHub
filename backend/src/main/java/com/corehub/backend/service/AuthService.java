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
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final String FACULTY_EMAIL_REGEX = "(?i)^eg[0-9]{6}@engug\\.ruh\\.ac\\.lk$";
    private static final String STUDENT_ID_REGEX = "(?i)^EG/[0-9]{4}/[0-9]{4}$";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        String normalizedStudentId = request.getStudentId().trim().toUpperCase();

        if (!normalizedEmail.matches(FACULTY_EMAIL_REGEX)) {
            throw new IllegalArgumentException("Email must be a valid faculty email in the format egXXXXXX@engug.ruh.ac.lk");
        }

        if (!normalizedStudentId.matches(STUDENT_ID_REGEX)) {
            throw new IllegalArgumentException("Student ID must be in the format EG/XXXX/XXXX");
        }

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new DuplicateResourceException("Email is already registered: " + normalizedEmail);
        }

        if (userRepository.existsByStudentId(normalizedStudentId)) {
            throw new DuplicateResourceException("Student ID is already registered: " + normalizedStudentId);
        }

        if (request.getPhone() == null || request.getPhone().trim().isBlank()) {
            throw new IllegalArgumentException("Phone number is required");
        }
        String normalizedPhone = request.getPhone().trim();
        if (normalizedPhone.length() > 20) {
            throw new IllegalArgumentException("Phone must not exceed 20 characters");
        }

        String normalizedDepartment = Department.normalizeOrThrow(request.getDepartment());

        User user = new User(
                normalizedStudentId,
                request.getName().trim(),
                normalizedEmail,
                passwordEncoder.encode(request.getPassword()),
                normalizedPhone,
                normalizedDepartment,
                Role.USER // Always assign USER role for public registration
        );

        User savedUser = userRepository.save(user);
        return UserResponse.fromEntity(savedUser);
    }

    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword())
            );
        } catch (BadCredentialsException e) {
            throw new BadCredentialsException("Invalid email or password");
        }

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, "Bearer", jwtService.getExpirationMs(), UserResponse.fromEntity(user));
    }
}
