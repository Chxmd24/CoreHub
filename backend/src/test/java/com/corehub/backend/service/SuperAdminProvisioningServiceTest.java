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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SuperAdminProvisioningServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private SystemLockRepository systemLockRepository;

    @Mock
    private AdminAuditLogRepository auditLogRepository;

    @InjectMocks
    private SuperAdminProvisioningService provisioningService;

    private User existingUser;
    private SystemLock systemLock;

    @BeforeEach
    void setUp() {
        existingUser = new User(
                "E/19/042",
                "Chamod Perera",
                "chamod@eng.pdn.ac.lk",
                "$2a$10$existingSecureHashedPassword",
                "+94771234567",
                "Computer Engineering",
                Role.USER
        );
        existingUser.setId(101L);

        systemLock = new SystemLock(SuperAdminProvisioningService.PROVISIONING_LOCK_KEY, "Test lock");
    }

    @Test
    void shouldSuccessfullyProvisionExistingUserByEmailAsSuperAdmin() {
        when(systemLockRepository.findByLockKeyWithLock(SuperAdminProvisioningService.PROVISIONING_LOCK_KEY))
                .thenReturn(Optional.of(systemLock));
        when(userRepository.countByRole(Role.SUPER_ADMIN)).thenReturn(0L);
        when(userRepository.findByEmail("chamod@eng.pdn.ac.lk")).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserResponse response = provisioningService.provisionSuperAdmin("chamod@eng.pdn.ac.lk");

        assertNotNull(response);
        assertEquals(Role.SUPER_ADMIN, response.getRole());
        assertEquals("chamod@eng.pdn.ac.lk", response.getEmail());
        assertEquals("E/19/042", response.getStudentId());

        // Verify password hash is preserved
        assertEquals("$2a$10$existingSecureHashedPassword", existingUser.getPasswordHash());

        // Verify audit log created
        verify(auditLogRepository).save(any(AdminAuditLog.class));
    }

    @Test
    void shouldSuccessfullyProvisionExistingUserByStudentId() {
        when(systemLockRepository.findByLockKeyWithLock(SuperAdminProvisioningService.PROVISIONING_LOCK_KEY))
                .thenReturn(Optional.of(systemLock));
        when(userRepository.countByRole(Role.SUPER_ADMIN)).thenReturn(0L);
        when(userRepository.findByEmail("e/19/042")).thenReturn(Optional.empty());
        when(userRepository.findByStudentId("E/19/042")).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserResponse response = provisioningService.provisionSuperAdmin("E/19/042");

        assertNotNull(response);
        assertEquals(Role.SUPER_ADMIN, response.getRole());
        verify(userRepository).save(existingUser);
    }

    @Test
    void shouldRejectProvisioningWhenSuperAdminAlreadyExists() {
        when(systemLockRepository.findByLockKeyWithLock(SuperAdminProvisioningService.PROVISIONING_LOCK_KEY))
                .thenReturn(Optional.of(systemLock));
        // There is already 1 SUPER_ADMIN
        when(userRepository.countByRole(Role.SUPER_ADMIN)).thenReturn(1L);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                provisioningService.provisionSuperAdmin("chamod@eng.pdn.ac.lk")
        );

        assertEquals("Provisioning rejected: A SUPER_ADMIN account already exists in CoreHub. The system permits exactly one project owner SUPER_ADMIN.", ex.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void shouldRejectProvisioningWhenUserNotFound() {
        when(systemLockRepository.findByLockKeyWithLock(SuperAdminProvisioningService.PROVISIONING_LOCK_KEY))
                .thenReturn(Optional.of(systemLock));
        when(userRepository.countByRole(Role.SUPER_ADMIN)).thenReturn(0L);
        when(userRepository.findByEmail("unknown@eng.pdn.ac.lk")).thenReturn(Optional.empty());
        when(userRepository.findByStudentId("unknown@eng.pdn.ac.lk")).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class, () ->
                provisioningService.provisionSuperAdmin("unknown@eng.pdn.ac.lk")
        );

        assertEquals("Provisioning rejected: No existing registered user found matching identifier: unknown@eng.pdn.ac.lk", ex.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void shouldRejectProvisioningWithBlankIdentifier() {
        assertThrows(IllegalArgumentException.class, () ->
                provisioningService.provisionSuperAdmin("   ")
        );
        assertThrows(IllegalArgumentException.class, () ->
                provisioningService.provisionSuperAdmin(null)
        );
    }

    @Test
    void shouldSuccessfullyCorrectSuperAdminEmail() {
        existingUser.setRole(Role.SUPER_ADMIN);
        existingUser.setEmail("eg200001@engug.ruh.ac.lk");
        existingUser.setStudentId("EG/2020/0001");

        when(systemLockRepository.findByLockKeyWithLock(SuperAdminProvisioningService.PROVISIONING_LOCK_KEY))
                .thenReturn(Optional.of(systemLock));
        when(userRepository.existsByEmail("eg200002@engug.ruh.ac.lk")).thenReturn(false);
        when(userRepository.findByEmail("eg200001@engug.ruh.ac.lk")).thenReturn(Optional.of(existingUser));
        when(userRepository.countByRole(Role.SUPER_ADMIN)).thenReturn(1L);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserResponse response = provisioningService.correctSuperAdminEmail("eg200001@engug.ruh.ac.lk", "eg200002@engug.ruh.ac.lk");

        assertNotNull(response);
        assertEquals("eg200002@engug.ruh.ac.lk", response.getEmail());
        assertEquals("EG/2020/0001", response.getStudentId());
        assertEquals(Role.SUPER_ADMIN, response.getRole());
        assertEquals(101L, response.getId());
        assertEquals("$2a$10$existingSecureHashedPassword", existingUser.getPasswordHash());

        verify(auditLogRepository).save(any(AdminAuditLog.class));
        verify(userRepository).save(existingUser);
    }

    @Test
    void shouldRejectEmailCorrectionWhenTargetEmailAlreadyInUse() {
        when(systemLockRepository.findByLockKeyWithLock(SuperAdminProvisioningService.PROVISIONING_LOCK_KEY))
                .thenReturn(Optional.of(systemLock));
        when(userRepository.existsByEmail("eg200002@engug.ruh.ac.lk")).thenReturn(true);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                provisioningService.correctSuperAdminEmail("eg200001@engug.ruh.ac.lk", "eg200002@engug.ruh.ac.lk")
        );

        assertEquals("Email correction rejected: Target email is already registered: eg200002@engug.ruh.ac.lk", ex.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void shouldRejectEmailCorrectionWhenUserIsNotSuperAdmin() {
        existingUser.setRole(Role.USER);

        when(systemLockRepository.findByLockKeyWithLock(SuperAdminProvisioningService.PROVISIONING_LOCK_KEY))
                .thenReturn(Optional.of(systemLock));
        when(userRepository.existsByEmail("eg200002@engug.ruh.ac.lk")).thenReturn(false);
        when(userRepository.findByEmail("eg200001@engug.ruh.ac.lk")).thenReturn(Optional.of(existingUser));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                provisioningService.correctSuperAdminEmail("eg200001@engug.ruh.ac.lk", "eg200002@engug.ruh.ac.lk")
        );

        assertEquals("Email correction rejected: Account is not a SUPER_ADMIN", ex.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void shouldRejectEmailCorrectionWithInvalidEmailFormat() {
        assertThrows(IllegalArgumentException.class, () ->
                provisioningService.correctSuperAdminEmail("eg200001@engug.ruh.ac.lk", "invalid-email@gmail.com")
        );
        assertThrows(IllegalArgumentException.class, () ->
                provisioningService.correctSuperAdminEmail("", "eg200002@engug.ruh.ac.lk")
        );
    }
}
