package com.corehub.backend.controller;

import com.corehub.backend.dto.AuthResponse;
import com.corehub.backend.dto.LoginRequest;
import com.corehub.backend.dto.RegisterRequest;
import com.corehub.backend.dto.UserResponse;
import com.corehub.backend.entity.Role;
import com.corehub.backend.exception.DuplicateResourceException;
import com.corehub.backend.exception.GlobalExceptionHandler;
import com.corehub.backend.service.AuthService;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = JsonMapper.builder().build();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void registerShouldReturn201CreatedOnSuccess() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "Jane Doe", "EG/2020/0002", "eg200002@engug.ruh.ac.lk", "SecurePass123", "0770001122", "Civil and Environmental Engineering"
        );

        UserResponse userResponse = new UserResponse(
                1L, "EG/2020/0002", "Jane Doe", "eg200002@engug.ruh.ac.lk", "0770001122", "Civil and Environmental Engineering", Role.USER, LocalDateTime.now()
        );

        when(authService.register(any(RegisterRequest.class))).thenReturn(userResponse);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.name").value("Jane Doe"))
                .andExpect(jsonPath("$.email").value("eg200002@engug.ruh.ac.lk"))
                .andExpect(jsonPath("$.studentId").value("EG/2020/0002"))
                .andExpect(jsonPath("$.role").value("USER"));
    }

    @Test
    void registerShouldReturn400BadRequestWhenValidationFails() throws Exception {
        RegisterRequest invalidRequest = new RegisterRequest(
                "", "", "invalid-email-format", "short", null, null
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.validationErrors.email").exists())
                .andExpect(jsonPath("$.validationErrors.name").exists())
                .andExpect(jsonPath("$.validationErrors.studentId").exists())
                .andExpect(jsonPath("$.validationErrors.password").exists())
                .andExpect(jsonPath("$.validationErrors.phone").exists())
                .andExpect(jsonPath("$.validationErrors.department").exists());
    }

    @Test
    void registerShouldReturn400WhenEmailDoesNotMatchUniversityPattern() throws Exception {
        RegisterRequest nonFacultyEmailRequest = new RegisterRequest(
                "Jane Doe", "EG/2020/0002", "student@gmail.com", "SecurePass123", "+94770001122", "Civil and Environmental Engineering"
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(nonFacultyEmailRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors.email").exists());
    }

    @Test
    void registerShouldReturn400WhenStudentIdDoesNotMatchPattern() throws Exception {
        RegisterRequest invalidStudentIdRequest = new RegisterRequest(
                "Jane Doe", "E/20/002", "eg200002@engug.ruh.ac.lk", "SecurePass123", "+94770001122", "Civil and Environmental Engineering"
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidStudentIdRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors.studentId").exists());
    }

    @Test
    void registerShouldReturn400WhenDepartmentIsUnsupported() throws Exception {
        RegisterRequest invalidDeptRequest = new RegisterRequest(
                "Jane Doe", "EG/2020/0002", "eg200002@engug.ruh.ac.lk", "SecurePass123", "+94770001122", "Unsupported Department"
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidDeptRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors.department").exists());
    }

    @Test
    void registerShouldReturn409ConflictWhenDuplicateEmailOrStudentId() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "Jane Doe", "EG/2020/0002", "eg200002@engug.ruh.ac.lk", "SecurePass123", "+94770001122", "Civil and Environmental Engineering"
        );

        when(authService.register(any(RegisterRequest.class)))
                .thenThrow(new DuplicateResourceException("Email is already registered: eg200002@engug.ruh.ac.lk"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
    }

    @Test
    void loginShouldReturn200OkWithAuthResponse() throws Exception {
        LoginRequest loginRequest = new LoginRequest("eg200002@engug.ruh.ac.lk", "ValidPassword123");

        UserResponse userResponse = new UserResponse(
                1L, "EG/2020/0002", "Jane Doe", "eg200002@engug.ruh.ac.lk", null, null, Role.USER, LocalDateTime.now()
        );
        AuthResponse authResponse = new AuthResponse("mock-jwt-token-xyz", "Bearer", 3600000L, userResponse);

        when(authService.login(any(LoginRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("mock-jwt-token-xyz"))
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user.email").value("eg200002@engug.ruh.ac.lk"));
    }

    @Test
    void loginShouldReturn401UnauthorizedOnBadCredentials() throws Exception {
        LoginRequest loginRequest = new LoginRequest("eg200002@engug.ruh.ac.lk", "WrongPassword");

        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new BadCredentialsException("Invalid email or password"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }
}
