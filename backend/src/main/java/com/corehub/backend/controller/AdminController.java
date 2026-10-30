package com.corehub.backend.controller;

import com.corehub.backend.dto.AdminAuditLogResponse;
import com.corehub.backend.dto.AdminListingResponse;
import com.corehub.backend.dto.AdminOverviewResponse;
import com.corehub.backend.dto.AdminUserResponse;
import com.corehub.backend.dto.ModerateListingRequest;
import com.corehub.backend.dto.PagedResponse;
import com.corehub.backend.dto.ReservationResponse;
import com.corehub.backend.dto.UpdateUserRoleRequest;
import com.corehub.backend.entity.ComponentStatus;
import com.corehub.backend.entity.ModerationStatus;
import com.corehub.backend.entity.ReservationStatus;
import com.corehub.backend.entity.Role;
import com.corehub.backend.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/overview")
    public ResponseEntity<AdminOverviewResponse> getOverview() {
        return ResponseEntity.ok(adminService.getOverview());
    }

    @GetMapping("/users")
    public ResponseEntity<PagedResponse<AdminUserResponse>> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Role role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size));
        return ResponseEntity.ok(adminService.getUsers(search, role, pageable));
    }

    @PatchMapping("/users/{id}/role")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<AdminUserResponse> updateUserRole(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRoleRequest request,
            Principal principal) {
        return ResponseEntity.ok(adminService.updateUserRole(id, request.getRole(), principal.getName()));
    }

    @GetMapping("/listings")
    public ResponseEntity<PagedResponse<AdminListingResponse>> getListings(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) ComponentStatus status,
            @RequestParam(required = false) ModerationStatus moderationStatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(adminService.getListings(search, status, moderationStatus, pageable));
    }

    @PatchMapping("/listings/{id}/moderate")
    public ResponseEntity<AdminListingResponse> moderateListing(
            @PathVariable Long id,
            @Valid @RequestBody ModerateListingRequest request,
            Principal principal) {
        return ResponseEntity.ok(adminService.moderateListing(id, request.getAction(), request.getReason(), principal.getName()));
    }

    @GetMapping("/reservations")
    public ResponseEntity<PagedResponse<ReservationResponse>> getReservations(
            @RequestParam(required = false) ReservationStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size));
        return ResponseEntity.ok(adminService.getReservations(status, pageable));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<PagedResponse<AdminAuditLogResponse>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size));
        return ResponseEntity.ok(adminService.getAuditLogs(pageable));
    }
}
