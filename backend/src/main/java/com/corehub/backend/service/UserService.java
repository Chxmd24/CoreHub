package com.corehub.backend.service;

import com.corehub.backend.dto.UpdateProfileRequest;
import com.corehub.backend.dto.UserResponse;
import com.corehub.backend.entity.Department;
import com.corehub.backend.entity.User;
import com.corehub.backend.repository.UserRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUserProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
        return UserResponse.fromEntity(user);
    }

    @Transactional
    public UserResponse updateCurrentUserProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        if (request.getName() != null) {
            String trimmedName = request.getName().trim();
            if (trimmedName.isEmpty()) {
                throw new IllegalArgumentException("Name cannot be blank");
            }
            if (trimmedName.length() > 100) {
                throw new IllegalArgumentException("Name must not exceed 100 characters");
            }
            user.setName(trimmedName);
        }

        if (request.getPhone() == null || request.getPhone().trim().isBlank()) {
            throw new IllegalArgumentException("Phone number is required");
        }
        String trimmedPhone = request.getPhone().trim();
        if (trimmedPhone.length() > 20) {
            throw new IllegalArgumentException("Phone number must not exceed 20 characters");
        }
        user.setPhone(trimmedPhone);

        if (request.getDepartment() == null || request.getDepartment().trim().isBlank()) {
            throw new IllegalArgumentException("Department is required");
        }
        String normalizedDept = Department.normalizeOrThrow(request.getDepartment());
        user.setDepartment(normalizedDept);

        User savedUser = userRepository.save(user);
        return UserResponse.fromEntity(savedUser);
    }
}
