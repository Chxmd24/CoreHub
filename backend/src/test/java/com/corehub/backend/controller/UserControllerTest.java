package com.corehub.backend.controller;

import com.corehub.backend.dto.UpdateProfileRequest;
import com.corehub.backend.dto.UserResponse;
import com.corehub.backend.entity.Role;
import com.corehub.backend.exception.GlobalExceptionHandler;
import com.corehub.backend.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(userController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void getMeShouldReturnUserProfileWhenAuthenticated() throws Exception {
        UserResponse userResponse = new UserResponse(
                5L, "E/20/005", "Alice Wonderland", "alice@university.edu", "0771234567", "Computer", Role.USER, LocalDateTime.now()
        );

        when(userService.getCurrentUserProfile("alice@university.edu")).thenReturn(userResponse);

        mockMvc.perform(get("/api/users/me")
                        .principal(() -> "alice@university.edu"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(5L))
                .andExpect(jsonPath("$.studentId").value("E/20/005"))
                .andExpect(jsonPath("$.name").value("Alice Wonderland"))
                .andExpect(jsonPath("$.email").value("alice@university.edu"))
                .andExpect(jsonPath("$.phone").value("0771234567"))
                .andExpect(jsonPath("$.department").value("Computer"))
                .andExpect(jsonPath("$.role").value("USER"));
    }

    @Test
    void getMeShouldReturnUnauthorizedWhenPrincipalIsNull() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void updateProfileShouldUpdateAllowedFieldsWhenAuthenticated() throws Exception {
        UpdateProfileRequest request = new UpdateProfileRequest("Alice Updated", "+94779876543", "Electrical and Information Engineering");

        UserResponse updatedResponse = new UserResponse(
                5L, "E/20/005", "Alice Updated", "alice@university.edu", "+94779876543", "Electrical and Information Engineering", Role.USER, LocalDateTime.now()
        );

        when(userService.updateCurrentUserProfile(eq("alice@university.edu"), any(UpdateProfileRequest.class)))
                .thenReturn(updatedResponse);

        mockMvc.perform(patch("/api/users/me")
                        .principal(() -> "alice@university.edu")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Alice Updated"))
                .andExpect(jsonPath("$.phone").value("+94779876543"))
                .andExpect(jsonPath("$.department").value("Electrical and Information Engineering"));

        verify(userService).updateCurrentUserProfile(eq("alice@university.edu"), any(UpdateProfileRequest.class));
    }

    @Test
    void updateProfilePutShouldAlsoWorkWhenAuthenticated() throws Exception {
        UpdateProfileRequest request = new UpdateProfileRequest("Alice Updated Put", "+94771234567", "Computer Engineering");

        UserResponse updatedResponse = new UserResponse(
                5L, "E/20/005", "Alice Updated Put", "alice@university.edu", "+94771234567", "Computer Engineering", Role.USER, LocalDateTime.now()
        );

        when(userService.updateCurrentUserProfile(eq("alice@university.edu"), any(UpdateProfileRequest.class)))
                .thenReturn(updatedResponse);

        mockMvc.perform(put("/api/users/me")
                        .principal(() -> "alice@university.edu")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Alice Updated Put"))
                .andExpect(jsonPath("$.phone").value("+94771234567"))
                .andExpect(jsonPath("$.department").value("Computer Engineering"));
    }

    @Test
    void updateProfileShouldReturnUnauthorizedWhenPrincipalIsNull() throws Exception {
        UpdateProfileRequest request = new UpdateProfileRequest("Alice Anonymous", "0771234567", "Computer Engineering");

        mockMvc.perform(patch("/api/users/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void updateProfileShouldRejectBlankNameWithBadRequest() throws Exception {
        String invalidJson = "{\"name\":\"\",\"phone\":\"0771234567\",\"department\":\"Computer Engineering\"}";

        mockMvc.perform(patch("/api/users/me")
                        .principal(() -> "alice@university.edu")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed for one or more fields"))
                .andExpect(jsonPath("$.validationErrors.name").exists());
    }

    @Test
    void updateProfileShouldRejectBlankPhoneWithBadRequest() throws Exception {
        String invalidJson = "{\"name\":\"Alice\",\"phone\":\"\",\"department\":\"Computer Engineering\"}";

        mockMvc.perform(patch("/api/users/me")
                        .principal(() -> "alice@university.edu")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed for one or more fields"))
                .andExpect(jsonPath("$.validationErrors.phone").exists());
    }

    @Test
    void updateProfileShouldRejectUnsupportedDepartmentWithBadRequest() throws Exception {
        String invalidJson = "{\"name\":\"Alice\",\"phone\":\"0771234567\",\"department\":\"Unsupported Engineering\"}";

        mockMvc.perform(patch("/api/users/me")
                        .principal(() -> "alice@university.edu")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed for one or more fields"))
                .andExpect(jsonPath("$.validationErrors.department").exists());
    }

    @Test
    void updateProfileShouldRejectOverlongPhoneWithBadRequest() throws Exception {
        String overlongPhone = "012345678901234567890123456789"; // 30 chars > 20 limit
        String invalidJson = "{\"name\":\"Alice\",\"phone\":\"" + overlongPhone + "\",\"department\":\"Computer Engineering\"}";

        mockMvc.perform(patch("/api/users/me")
                        .principal(() -> "alice@university.edu")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed for one or more fields"))
                .andExpect(jsonPath("$.validationErrors.phone").exists());
    }

    @Test
    void updateProfileShouldRejectForbiddenFieldRoleWithBadRequest() throws Exception {
        String forbiddenRoleJson = "{\"name\":\"Alice\",\"role\":\"SUPER_ADMIN\"}";

        mockMvc.perform(patch("/api/users/me")
                        .principal(() -> "alice@university.edu")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(forbiddenRoleJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Unrecognized or forbidden field: role"));
    }

    @Test
    void updateProfileShouldRejectForbiddenFieldStudentIdWithBadRequest() throws Exception {
        String forbiddenStudentIdJson = "{\"name\":\"Alice\",\"studentId\":\"HACKED/01\"}";

        mockMvc.perform(patch("/api/users/me")
                        .principal(() -> "alice@university.edu")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(forbiddenStudentIdJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Unrecognized or forbidden field: studentId"));
    }

    @Test
    void updateProfileShouldRejectForbiddenFieldEmailWithBadRequest() throws Exception {
        String forbiddenEmailJson = "{\"name\":\"Alice\",\"email\":\"newemail@attacker.com\"}";

        mockMvc.perform(patch("/api/users/me")
                        .principal(() -> "alice@university.edu")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(forbiddenEmailJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Unrecognized or forbidden field: email"));
    }
}
