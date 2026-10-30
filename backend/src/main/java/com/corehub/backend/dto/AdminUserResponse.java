package com.corehub.backend.dto;

import com.corehub.backend.entity.Role;
import com.corehub.backend.entity.User;

import java.time.LocalDateTime;

public class AdminUserResponse {

    private Long id;
    private String studentId;
    private String name;
    private String email;
    private String phone;
    private String department;
    private Role role;
    private LocalDateTime createdAt;
    private long listingCount;
    private long reservationCount;

    public AdminUserResponse() {
    }

    public AdminUserResponse(Long id, String studentId, String name, String email, String phone,
                             String department, Role role, LocalDateTime createdAt,
                             long listingCount, long reservationCount) {
        this.id = id;
        this.studentId = studentId;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.department = department;
        this.role = role;
        this.createdAt = createdAt;
        this.listingCount = listingCount;
        this.reservationCount = reservationCount;
    }

    public static AdminUserResponse fromEntity(User user, long listingCount, long reservationCount) {
        if (user == null) return null;
        return new AdminUserResponse(
                user.getId(),
                user.getStudentId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getDepartment(),
                user.getRole(),
                user.getCreatedAt(),
                listingCount,
                reservationCount
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public long getListingCount() {
        return listingCount;
    }

    public void setListingCount(long listingCount) {
        this.listingCount = listingCount;
    }

    public long getReservationCount() {
        return reservationCount;
    }

    public void setReservationCount(long reservationCount) {
        this.reservationCount = reservationCount;
    }
}
