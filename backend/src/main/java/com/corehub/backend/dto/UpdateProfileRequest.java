package com.corehub.backend.dto;

import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@JsonIgnoreProperties(ignoreUnknown = false)
public class UpdateProfileRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must not exceed 100 characters")
    private String name;

    @NotBlank(message = "Phone number is required")
    @Size(max = 20, message = "Phone must not exceed 20 characters")
    private String phone;

    @NotBlank(message = "Department is required")
    @Pattern(
        regexp = "(?i)^(Electrical and Information Engineering|Civil and Environmental Engineering|Marine Engineering and Naval Architecture|Mechanical and Manufacturing Engineering|Computer Engineering)$",
        message = "Department must be one of the five supported engineering departments"
    )
    private String department;

    public UpdateProfileRequest() {
    }

    public UpdateProfileRequest(String name, String phone, String department) {
        this.name = name;
        this.phone = phone;
        this.department = department;
    }

    @JsonAnySetter
    public void handleUnknownProperty(String key, Object value) {
        throw new IllegalArgumentException("Unrecognized or forbidden field: " + key);
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
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
