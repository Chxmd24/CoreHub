package com.corehub.backend.service;

import com.corehub.backend.dto.AdminAuditLogResponse;
import com.corehub.backend.dto.AdminListingResponse;
import com.corehub.backend.dto.AdminOverviewResponse;
import com.corehub.backend.dto.AdminUserResponse;
import com.corehub.backend.dto.PagedResponse;
import com.corehub.backend.dto.ReservationResponse;
import com.corehub.backend.entity.AdminAuditLog;
import com.corehub.backend.entity.Component;
import com.corehub.backend.entity.ComponentStatus;
import com.corehub.backend.entity.ModerationStatus;
import com.corehub.backend.entity.Reservation;
import com.corehub.backend.entity.ReservationStatus;
import com.corehub.backend.entity.Role;
import com.corehub.backend.entity.User;
import com.corehub.backend.exception.ResourceNotFoundException;
import com.corehub.backend.repository.AdminAuditLogRepository;
import com.corehub.backend.repository.ComponentRepository;
import com.corehub.backend.repository.ReservationRepository;
import com.corehub.backend.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class AdminService {

    private final UserRepository userRepository;
    private final ComponentRepository componentRepository;
    private final ReservationRepository reservationRepository;
    private final AdminAuditLogRepository auditLogRepository;
    private final Clock clock;

    public AdminService(UserRepository userRepository,
                        ComponentRepository componentRepository,
                        ReservationRepository reservationRepository,
                        AdminAuditLogRepository auditLogRepository,
                        Clock clock) {
        this.userRepository = userRepository;
        this.componentRepository = componentRepository;
        this.reservationRepository = reservationRepository;
        this.auditLogRepository = auditLogRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public AdminOverviewResponse getOverview() {
        long totalUsers = userRepository.count();
        long totalAdmins = userRepository.countByRole(Role.ADMIN);
        long totalSuperAdmins = userRepository.countByRole(Role.SUPER_ADMIN);

        long totalListings = componentRepository.count();
        long availableListings = componentRepository.countByStatus(ComponentStatus.AVAILABLE);
        long reservedListings = componentRepository.countByStatus(ComponentStatus.RESERVED);
        long exchangedListings = componentRepository.countByStatus(ComponentStatus.EXCHANGED);
        long moderatedListings = componentRepository.countByModerationStatus(ModerationStatus.SUSPENDED);

        long totalReservations = reservationRepository.count();
        long activeReservations = reservationRepository.countByStatus(ReservationStatus.ACTIVE);
        long completedReservations = reservationRepository.countByStatus(ReservationStatus.COMPLETED);
        long cancelledReservations = reservationRepository.countByStatus(ReservationStatus.CANCELLED);
        long expiredReservations = reservationRepository.countByStatus(ReservationStatus.EXPIRED);

        long totalAuditLogs = auditLogRepository.count();

        return new AdminOverviewResponse(
                totalUsers, totalAdmins, totalSuperAdmins,
                totalListings, availableListings, reservedListings, exchangedListings, moderatedListings,
                totalReservations, activeReservations, completedReservations, cancelledReservations, expiredReservations,
                totalAuditLogs
        );
    }

    @Transactional(readOnly = true)
    public PagedResponse<AdminUserResponse> getUsers(String search, Role role, Pageable pageable) {
        Specification<User> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (role != null) {
                predicates.add(cb.equal(root.get("role"), role));
            }

            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("name")), pattern);
                Predicate emailMatch = cb.like(cb.lower(root.get("email")), pattern);
                Predicate studentIdMatch = cb.like(cb.lower(root.get("studentId")), pattern);
                predicates.add(cb.or(nameMatch, emailMatch, studentIdMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<User> page = userRepository.findAll(spec, pageable);
        Page<AdminUserResponse> mapped = page.map(user -> {
            long listingCount = componentRepository.countByOwnerId(user.getId());
            long reservationCount = reservationRepository.countByReservedById(user.getId());
            return AdminUserResponse.fromEntity(user, listingCount, reservationCount);
        });

        return PagedResponse.fromPage(mapped);
    }

    public AdminUserResponse updateUserRole(Long targetUserId, Role newRole, String actorEmail) {
        User actor = userRepository.findByEmail(actorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated administrator not found: " + actorEmail));

        // Security check: Only SUPER_ADMIN can modify administrator roles
        if (actor.getRole() != Role.SUPER_ADMIN) {
            throw new AccessDeniedException("Forbidden: Only SUPER_ADMIN can appoint or revoke administrator privileges.");
        }

        // Security check: Target role cannot be SUPER_ADMIN
        if (newRole == Role.SUPER_ADMIN) {
            throw new IllegalArgumentException("Operation rejected: Cannot create a second SUPER_ADMIN account. CoreHub permits exactly one project owner SUPER_ADMIN.");
        }

        if (newRole != Role.USER && newRole != Role.ADMIN) {
            throw new IllegalArgumentException("Invalid role assignment. Can only assign USER or ADMIN.");
        }

        User targetUser = userRepository.findByIdWithLock(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Target user not found with ID: " + targetUserId));

        // Security check: SUPER_ADMIN cannot be demoted or modified through any application API
        if (targetUser.getRole() == Role.SUPER_ADMIN) {
            throw new IllegalArgumentException("Operation rejected: The primary SUPER_ADMIN account cannot be demoted or modified.");
        }

        // Security check: Prevent modifying own role
        if (targetUser.getId().equals(actor.getId())) {
            throw new IllegalArgumentException("Operation rejected: Administrators cannot alter their own role.");
        }

        Role previousRole = targetUser.getRole();
        if (previousRole == newRole) {
            long listingCount = componentRepository.countByOwnerId(targetUser.getId());
            long reservationCount = reservationRepository.countByReservedById(targetUser.getId());
            return AdminUserResponse.fromEntity(targetUser, listingCount, reservationCount);
        }

        targetUser.setRole(newRole);
        User savedUser = userRepository.save(targetUser);

        String action = (newRole == Role.ADMIN) ? "GRANT_ADMIN_ROLE" : "REVOKE_ADMIN_ROLE";
        String details = "Administrative role updated from " + previousRole + " to " + newRole +
                " for user " + savedUser.getEmail() + " (Student ID: " + savedUser.getStudentId() + ")";

        AdminAuditLog audit = new AdminAuditLog(
                actor.getId(),
                actor.getEmail(),
                actor.getRole().name(),
                action,
                "USER",
                savedUser.getId(),
                details
        );
        auditLogRepository.save(audit);

        long listingCount = componentRepository.countByOwnerId(savedUser.getId());
        long reservationCount = reservationRepository.countByReservedById(savedUser.getId());
        return AdminUserResponse.fromEntity(savedUser, listingCount, reservationCount);
    }

    @Transactional(readOnly = true)
    public PagedResponse<AdminListingResponse> getListings(String search,
                                                          ComponentStatus status,
                                                          ModerationStatus moderationStatus,
                                                          Pageable pageable) {
        Specification<Component> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (moderationStatus != null) {
                predicates.add(cb.equal(root.get("moderationStatus"), moderationStatus));
            }

            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate titleMatch = cb.like(cb.lower(root.get("title")), pattern);
                Predicate descMatch = cb.like(cb.lower(root.get("description")), pattern);
                Predicate catMatch = cb.like(cb.lower(root.get("category")), pattern);
                predicates.add(cb.or(titleMatch, descMatch, catMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Component> page = componentRepository.findAll(spec, pageable);
        return PagedResponse.fromPage(page.map(AdminListingResponse::fromEntity));
    }

    public AdminListingResponse moderateListing(Long listingId, String action, String reason, String actorEmail) {
        User actor = userRepository.findByEmail(actorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated administrator not found: " + actorEmail));

        Component component = componentRepository.findByIdWithLock(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Component listing not found with ID: " + listingId));

        LocalDateTime now = LocalDateTime.now(clock);
        String normalizedAction = (action != null) ? action.trim().toUpperCase() : "";

        if ("SUSPEND".equals(normalizedAction)) {
            component.setModerationStatus(ModerationStatus.SUSPENDED);
            component.setModerationReason(reason != null && !reason.trim().isEmpty() ? reason.trim() : "Flagged by administrator for policy review");
            component.setModeratedAt(now);
            component.setModeratedBy(actor.getEmail());
        } else if ("REINSTATE".equals(normalizedAction)) {
            component.setModerationStatus(ModerationStatus.ACTIVE);
            component.setModerationReason(null);
            component.setModeratedAt(now);
            component.setModeratedBy(actor.getEmail());
        } else {
            throw new IllegalArgumentException("Invalid moderation action: " + action + ". Permitted values are SUSPEND or REINSTATE.");
        }

        Component saved = componentRepository.save(component);

        String auditAction = "SUSPEND".equals(normalizedAction) ? "SUSPEND_LISTING" : "REINSTATE_LISTING";
        String auditDetails = ("SUSPEND".equals(normalizedAction) ? "Suspended listing #" : "Reinstated listing #") +
                saved.getId() + " (" + saved.getTitle() + "). Reason: " + (component.getModerationReason() != null ? component.getModerationReason() : "N/A");

        AdminAuditLog audit = new AdminAuditLog(
                actor.getId(),
                actor.getEmail(),
                actor.getRole().name(),
                auditAction,
                "LISTING",
                saved.getId(),
                auditDetails
        );
        auditLogRepository.save(audit);

        return AdminListingResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public PagedResponse<ReservationResponse> getReservations(ReservationStatus status, Pageable pageable) {
        LocalDateTime now = LocalDateTime.now(clock);
        Page<Reservation> page;
        if (status != null) {
            page = reservationRepository.findByStatusOrderByReservedAtDesc(status, pageable);
        } else {
            page = reservationRepository.findAllByOrderByReservedAtDesc(pageable);
        }

        return PagedResponse.fromPage(page.map(r -> ReservationResponse.fromEntity(r, now)));
    }

    @Transactional(readOnly = true)
    public PagedResponse<AdminAuditLogResponse> getAuditLogs(Pageable pageable) {
        Page<AdminAuditLog> page = auditLogRepository.findAllByOrderByTimestampDesc(pageable);
        return PagedResponse.fromPage(page.map(AdminAuditLogResponse::fromEntity));
    }
}
