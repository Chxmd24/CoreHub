package com.corehub.backend.service;

import com.corehub.backend.dto.UserResponse;
import com.corehub.backend.entity.AdminAuditLog;
import com.corehub.backend.entity.Role;
import com.corehub.backend.entity.SystemLock;
import com.corehub.backend.entity.User;
import com.corehub.backend.exception.ResourceNotFoundException;
import com.corehub.backend.repository.AdminAuditLogRepository;
import com.corehub.backend.repository.SystemLockRepository;
import com.corehub.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class SuperAdminProvisioningService {

    private static final Logger log = LoggerFactory.getLogger(SuperAdminProvisioningService.class);
    public static final String PROVISIONING_LOCK_KEY = "SUPER_ADMIN_PROVISION";

    private final UserRepository userRepository;
    private final SystemLockRepository systemLockRepository;
    private final AdminAuditLogRepository auditLogRepository;

    public SuperAdminProvisioningService(UserRepository userRepository,
                                         SystemLockRepository systemLockRepository,
                                         AdminAuditLogRepository auditLogRepository) {
        this.userRepository = userRepository;
        this.systemLockRepository = systemLockRepository;
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Atomically provisions an existing registered student as the single CoreHub SUPER_ADMIN.
     * Uses pessimistic locking on a dedicated system lock record to strictly serialize execution
     * and guarantees that no secondary SUPER_ADMIN can ever be created.
     *
     * @param identifier Student email or student ID of an existing user.
     * @return UserResponse representing the provisioned SUPER_ADMIN.
     */
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public UserResponse provisionSuperAdmin(String identifier) {
        if (identifier == null || identifier.trim().isEmpty()) {
            throw new IllegalArgumentException("Provisioning identifier cannot be empty");
        }

        String trimmed = identifier.trim();

        // 1. Acquire pessimistic write lock on the dedicated system lock record to serialize provisioning
        SystemLock lock = systemLockRepository.findByLockKeyWithLock(PROVISIONING_LOCK_KEY).orElse(null);
        if (lock == null) {
            try {
                systemLockRepository.saveAndFlush(new SystemLock(PROVISIONING_LOCK_KEY, "Serializes CoreHub single SUPER_ADMIN provisioning"));
            } catch (Exception ignored) {
                // If another concurrent thread inserted it, proceed to acquire lock
            }
            lock = systemLockRepository.findByLockKeyWithLock(PROVISIONING_LOCK_KEY)
                    .orElseThrow(() -> new IllegalStateException("Failed to acquire database serialization lock for provisioning"));
        }
        lock.setLockedAt(LocalDateTime.now());
        systemLockRepository.save(lock);

        // 2. Strict database check: A second SUPER_ADMIN is NEVER permitted
        long superAdminCount = userRepository.countByRole(Role.SUPER_ADMIN);
        if (superAdminCount > 0) {
            throw new IllegalStateException("Provisioning rejected: A SUPER_ADMIN account already exists in CoreHub. The system permits exactly one project owner SUPER_ADMIN.");
        }

        // 3. Locate existing registered user (preserves password hash, listings, and reservations)
        User user = userRepository.findByEmail(trimmed.toLowerCase())
                .or(() -> userRepository.findByStudentId(trimmed))
                .orElseThrow(() -> new ResourceNotFoundException("Provisioning rejected: No existing registered user found matching identifier: " + trimmed));

        // 4. Promote to SUPER_ADMIN
        user.setRole(Role.SUPER_ADMIN);
        User savedUser = userRepository.save(user);

        // 5. Persist audit record
        AdminAuditLog audit = new AdminAuditLog(
                savedUser.getId(),
                savedUser.getEmail(),
                Role.SUPER_ADMIN.name(),
                "PROVISION_SUPER_ADMIN",
                "USER",
                savedUser.getId(),
                "One-time local provisioning of primary project owner SUPER_ADMIN for account: " + savedUser.getEmail() + " (" + savedUser.getStudentId() + ")"
        );
        auditLogRepository.save(audit);

        log.info("SUPER_ADMIN successfully provisioned for existing account: {} (ID: {})", savedUser.getEmail(), savedUser.getId());
        return UserResponse.fromEntity(savedUser);
    }

    /**
     * Atomically corrects the sole project owner SUPER_ADMIN email address.
     * Guarantees:
     * - Only the existing SUPER_ADMIN account is updated.
     * - No new user or second SUPER_ADMIN is created.
     * - Corrected email must not be registered or in use by any account.
     * - Preserves primary key (ID), studentId, passwordHash, role, name, phone, department,
     *   listings, reservations, and previous audit logs.
     * - Records an entry in AdminAuditLog.
     *
     * @param currentIdentifier Current email or student ID of the SUPER_ADMIN.
     * @param newEmail The corrected institutional email (egXXXXXX@engug.ruh.ac.lk).
     * @return UserResponse representing the updated SUPER_ADMIN.
     */
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public UserResponse correctSuperAdminEmail(String currentIdentifier, String newEmail) {
        if (currentIdentifier == null || currentIdentifier.trim().isEmpty()) {
            throw new IllegalArgumentException("Current identifier cannot be empty");
        }
        if (newEmail == null || newEmail.trim().isEmpty()) {
            throw new IllegalArgumentException("New email cannot be empty");
        }

        String currentTrimmed = currentIdentifier.trim().toLowerCase();
        String newTrimmed = newEmail.trim().toLowerCase();

        if (!newTrimmed.matches("(?i)^eg[0-9]{6}@engug\\.ruh\\.ac\\.lk$")) {
            throw new IllegalArgumentException("New email must be a valid Faculty of Engineering email: egXXXXXX@engug.ruh.ac.lk");
        }

        // 1. Acquire pessimistic write lock
        SystemLock lock = systemLockRepository.findByLockKeyWithLock(PROVISIONING_LOCK_KEY).orElse(null);
        if (lock == null) {
            try {
                systemLockRepository.saveAndFlush(new SystemLock(PROVISIONING_LOCK_KEY, "Serializes CoreHub single SUPER_ADMIN provisioning"));
            } catch (Exception ignored) {
            }
            lock = systemLockRepository.findByLockKeyWithLock(PROVISIONING_LOCK_KEY)
                    .orElseThrow(() -> new IllegalStateException("Failed to acquire database serialization lock"));
        }
        lock.setLockedAt(LocalDateTime.now());
        systemLockRepository.save(lock);

        // 2. Strict database check: Target email MUST NOT exist
        if (userRepository.existsByEmail(newTrimmed)) {
            throw new IllegalStateException("Email correction rejected: Target email is already registered: " + newTrimmed);
        }

        // 3. Locate existing SUPER_ADMIN
        User user = userRepository.findByEmail(currentTrimmed)
                .or(() -> userRepository.findByStudentId(currentIdentifier.trim()))
                .orElseThrow(() -> new ResourceNotFoundException("No existing account found matching: " + currentIdentifier.trim()));

        if (user.getRole() != Role.SUPER_ADMIN) {
            throw new IllegalStateException("Email correction rejected: Account is not a SUPER_ADMIN");
        }

        long superAdminCount = userRepository.countByRole(Role.SUPER_ADMIN);
        if (superAdminCount != 1) {
            throw new IllegalStateException("Email correction rejected: Expected exactly 1 SUPER_ADMIN, found: " + superAdminCount);
        }

        String oldEmail = user.getEmail();

        // 4. Update ONLY email
        user.setEmail(newTrimmed);
        User savedUser = userRepository.save(user);

        // 5. Persist audit log
        AdminAuditLog audit = new AdminAuditLog(
                savedUser.getId(),
                savedUser.getEmail(),
                Role.SUPER_ADMIN.name(),
                "UPDATE_SUPER_ADMIN_EMAIL",
                "USER",
                savedUser.getId(),
                "Correction of project owner SUPER_ADMIN email from " + oldEmail + " to " + savedUser.getEmail() +
                        ". Student ID " + savedUser.getStudentId() + ", password hash, role, listings, and reservations preserved."
        );
        auditLogRepository.save(audit);

        log.info("SUPER_ADMIN email successfully corrected from {} to {} for account ID: {}", oldEmail, savedUser.getEmail(), savedUser.getId());
        return UserResponse.fromEntity(savedUser);
    }
}
