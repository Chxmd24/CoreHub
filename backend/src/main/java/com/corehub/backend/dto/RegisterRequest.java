package com.corehub.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class RegisterRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must not exceed 100 characters")
    private String name;

    @NotBlank(message = "Student ID is required")
    @Pattern(
        regexp = "(?i)^EG/[0-9]{4}/[0-9]{4}$",
        message = "Student ID must be in the format EG/XXXX/XXXX"
    )
    private String studentId;

    @NotBlank(message = "Email is required")
    @Pattern(
        regexp = "(?i)^eg[0-9]{6}@engug\\.ruh\\.ac\\.lk$",
        message = "Email must be a valid faculty email in the format egXXXXXX@engug.ruh.ac.lk"
    )
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters long")
    private String password;

    @NotBlank(message = "Phone number is required")
    @Size(max = 20, message = "Phone must not exceed 20 characters")
    private String phone;

    @NotBlank(message = "Department is required")
    @Pattern(
        regexp = "(?i)^(Electrical and Information Engineering|Civil and Environmental Engineering|Marine Engineering and Naval Architecture|Mechanical and Manufacturing Engineering|Computer Engineering)$",
        message = "Department must be one of the five supported engineering departments"
    )
    private String department;

    public RegisterRequest() {
    }

    public RegisterRequest(String name, String studentId, String email, String password, String phone, String department) {
        this.name = name;
        this.studentId = studentId;
        this.email = email;
        this.password = password;
        this.phone = phone;
        this.department = department;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
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
}
