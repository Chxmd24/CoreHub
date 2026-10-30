package com.corehub.backend.service;

import com.corehub.backend.dto.AdminListingResponse;
import com.corehub.backend.dto.AdminOverviewResponse;
import com.corehub.backend.dto.AdminUserResponse;
import com.corehub.backend.entity.AdminAuditLog;
import com.corehub.backend.entity.Component;
import com.corehub.backend.entity.ComponentStatus;
import com.corehub.backend.entity.ListingType;
import com.corehub.backend.entity.ModerationStatus;
import com.corehub.backend.entity.Role;
import com.corehub.backend.entity.User;
import com.corehub.backend.repository.AdminAuditLogRepository;
import com.corehub.backend.repository.ComponentRepository;
import com.corehub.backend.repository.ReservationRepository;
import com.corehub.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ComponentRepository componentRepository;

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private AdminAuditLogRepository auditLogRepository;

    private Clock clock;

    private AdminService adminService;

    private User superAdminUser;
    private User adminUser;
    private User regularUser;
    private Component sampleComponent;

    @BeforeEach
    void setUp() {
        clock = Clock.fixed(Instant.parse("2026-10-30T10:00:00Z"), ZoneId.of("UTC"));
        adminService = new AdminService(userRepository, componentRepository, reservationRepository, auditLogRepository, clock);

        superAdminUser = new User("E/19/001", "Project Owner", "owner@eng.pdn.ac.lk", "hash1", "0771111111", "CEng", Role.SUPER_ADMIN);
        superAdminUser.setId(1L);

        adminUser = new User("E/19/010", "Lab Admin", "admin@eng.pdn.ac.lk", "hash2", "0772222222", "CEng", Role.ADMIN);
        adminUser.setId(2L);

        regularUser = new User("E/19/050", "Student User", "student@eng.pdn.ac.lk", "hash3", "0773333333", "CEng", Role.USER);
        regularUser.setId(3L);

        sampleComponent = new Component(
                "Raspberry Pi 4",
                "4GB RAM board",
                "Microcontrollers",
                "Broadcom BCM2711",
                ListingType.SELL,
                new BigDecimal("15000.00"),
                ComponentStatus.AVAILABLE,
                regularUser
        );
        sampleComponent.setId(42L);
    }

    @Test
    void shouldReturnCorrectOverviewMetrics() {
        when(userRepository.count()).thenReturn(25L);
        when(userRepository.countByRole(Role.ADMIN)).thenReturn(2L);
        when(userRepository.countByRole(Role.SUPER_ADMIN)).thenReturn(1L);

        when(componentRepository.count()).thenReturn(50L);
        when(componentRepository.countByStatus(ComponentStatus.AVAILABLE)).thenReturn(30L);
        when(componentRepository.countByStatus(ComponentStatus.RESERVED)).thenReturn(10L);
        when(componentRepository.countByStatus(ComponentStatus.EXCHANGED)).thenReturn(10L);
        when(componentRepository.countByModerationStatus(ModerationStatus.SUSPENDED)).thenReturn(2L);

        when(reservationRepository.count()).thenReturn(15L);
        when(reservationRepository.countByStatus(any())).thenReturn(5L);
        when(auditLogRepository.count()).thenReturn(8L);

        AdminOverviewResponse overview = adminService.getOverview();

        assertEquals(25L, overview.getTotalUsers());
        assertEquals(2L, overview.getTotalAdmins());
        assertEquals(1L, overview.getTotalSuperAdmins());
        assertEquals(50L, overview.getTotalListings());
        assertEquals(30L, overview.getAvailableListings());
        assertEquals(2L, overview.getModeratedListings());
        assertEquals(15L, overview.getTotalReservations());
        assertEquals(8L, overview.getTotalAuditLogs());
    }

    @Test
    void shouldAllowSuperAdminToGrantAdminRoleToUser() {
        when(userRepository.findByEmail("owner@eng.pdn.ac.lk")).thenReturn(Optional.of(superAdminUser));
        when(userRepository.findByIdWithLock(3L)).thenReturn(Optional.of(regularUser));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        AdminUserResponse response = adminService.updateUserRole(3L, Role.ADMIN, "owner@eng.pdn.ac.lk");

        assertNotNull(response);
        assertEquals(Role.ADMIN, response.getRole());
        assertEquals(3L, response.getId());

        // Verify audit record created
        verify(auditLogRepository).save(any(AdminAuditLog.class));
    }

    @Test
    void shouldAllowSuperAdminToRevokeAdminRoleBackToUser() {
        when(userRepository.findByEmail("owner@eng.pdn.ac.lk")).thenReturn(Optional.of(superAdminUser));
        when(userRepository.findByIdWithLock(2L)).thenReturn(Optional.of(adminUser));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        AdminUserResponse response = adminService.updateUserRole(2L, Role.USER, "owner@eng.pdn.ac.lk");

        assertNotNull(response);
        assertEquals(Role.USER, response.getRole());
        verify(auditLogRepository).save(any(AdminAuditLog.class));
    }

    @Test
    void shouldDenyRoleManagementWhenActorIsNotSuperAdmin() {
        // Lab Admin (Role.ADMIN) tries to promote someone
        when(userRepository.findByEmail("admin@eng.pdn.ac.lk")).thenReturn(Optional.of(adminUser));

        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () ->
                adminService.updateUserRole(3L, Role.ADMIN, "admin@eng.pdn.ac.lk")
        );

        assertEquals("Forbidden: Only SUPER_ADMIN can appoint or revoke administrator privileges.", ex.getMessage());
    }

    @Test
    void shouldRejectAttemptToCreateSecondSuperAdmin() {
        when(userRepository.findByEmail("owner@eng.pdn.ac.lk")).thenReturn(Optional.of(superAdminUser));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                adminService.updateUserRole(3L, Role.SUPER_ADMIN, "owner@eng.pdn.ac.lk")
        );

        assertEquals("Operation rejected: Cannot create a second SUPER_ADMIN account. CoreHub permits exactly one project owner SUPER_ADMIN.", ex.getMessage());
    }

    @Test
    void shouldRejectAttemptToDemoteOrModifySuperAdminAccount() {
        when(userRepository.findByEmail("owner@eng.pdn.ac.lk")).thenReturn(Optional.of(superAdminUser));
        User targetSuperAdmin = new User("E/19/001", "Owner", "owner@pdn.ac.lk", "hash", "077", "CEng", Role.SUPER_ADMIN);
        targetSuperAdmin.setId(99L);
        when(userRepository.findByIdWithLock(99L)).thenReturn(Optional.of(targetSuperAdmin));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                adminService.updateUserRole(99L, Role.USER, "owner@eng.pdn.ac.lk")
        );

        assertEquals("Operation rejected: The primary SUPER_ADMIN account cannot be demoted or modified.", ex.getMessage());
    }

    @Test
    void shouldRejectAttemptForAdminToModifySelf() {
        when(userRepository.findByEmail("owner@eng.pdn.ac.lk")).thenReturn(Optional.of(superAdminUser));
        when(userRepository.findByIdWithLock(1L)).thenReturn(Optional.of(superAdminUser));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                adminService.updateUserRole(1L, Role.USER, "owner@eng.pdn.ac.lk")
        );

        assertEquals("Operation rejected: The primary SUPER_ADMIN account cannot be demoted or modified.", ex.getMessage());
    }

    @Test
    void shouldSuspendListingAndCreateAuditRecord() {
        when(userRepository.findByEmail("admin@eng.pdn.ac.lk")).thenReturn(Optional.of(adminUser));
        when(componentRepository.findByIdWithLock(42L)).thenReturn(Optional.of(sampleComponent));
        when(componentRepository.save(any(Component.class))).thenAnswer(inv -> inv.getArgument(0));

        AdminListingResponse response = adminService.moderateListing(42L, "SUSPEND", "Broken pins in board", "admin@eng.pdn.ac.lk");

        assertNotNull(response);
        assertEquals(ModerationStatus.SUSPENDED, response.getModerationStatus());
        assertEquals("Broken pins in board", response.getModerationReason());
        assertEquals("admin@eng.pdn.ac.lk", response.getModeratedBy());

        verify(auditLogRepository).save(any(AdminAuditLog.class));
    }

    @Test
    void shouldReinstateListingAndClearReason() {
        sampleComponent.setModerationStatus(ModerationStatus.SUSPENDED);
        sampleComponent.setModerationReason("Previous issue");

        when(userRepository.findByEmail("admin@eng.pdn.ac.lk")).thenReturn(Optional.of(adminUser));
        when(componentRepository.findByIdWithLock(42L)).thenReturn(Optional.of(sampleComponent));
        when(componentRepository.save(any(Component.class))).thenAnswer(inv -> inv.getArgument(0));

        AdminListingResponse response = adminService.moderateListing(42L, "REINSTATE", "Issue resolved", "admin@eng.pdn.ac.lk");

        assertNotNull(response);
        assertEquals(ModerationStatus.ACTIVE, response.getModerationStatus());
        assertNull(response.getModerationReason());

        verify(auditLogRepository).save(any(AdminAuditLog.class));
    }

    @Test
    void shouldRejectInvalidModerationAction() {
        when(userRepository.findByEmail("admin@eng.pdn.ac.lk")).thenReturn(Optional.of(adminUser));
        when(componentRepository.findByIdWithLock(42L)).thenReturn(Optional.of(sampleComponent));

        assertThrows(IllegalArgumentException.class, () ->
                adminService.moderateListing(42L, "DELETE_FOREVER", "reason", "admin@eng.pdn.ac.lk")
        );
    }
}
