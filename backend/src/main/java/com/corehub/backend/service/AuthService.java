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
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

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
        String normalizedStudentId = request.getStudentId().trim();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new DuplicateResourceException("Email is already registered: " + normalizedEmail);
        }

        if (userRepository.existsByStudentId(normalizedStudentId)) {
            throw new DuplicateResourceException("Student ID is already registered: " + normalizedStudentId);
        }

        User user = new User(
                normalizedStudentId,
                request.getName().trim(),
                normalizedEmail,
                passwordEncoder.encode(request.getPassword()),
                request.getPhone(),
                request.getDepartment(),
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
