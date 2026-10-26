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
                "Jane Doe", "E/20/002", "jane@eng.pdn.ac.lk", "SecurePass123", "0770001122", "Civil"
        );

        UserResponse userResponse = new UserResponse(
                1L, "E/20/002", "Jane Doe", "jane@eng.pdn.ac.lk", "0770001122", "Civil", Role.USER, LocalDateTime.now()
        );

        when(authService.register(any(RegisterRequest.class))).thenReturn(userResponse);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.name").value("Jane Doe"))
                .andExpect(jsonPath("$.email").value("jane@eng.pdn.ac.lk"))
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
                .andExpect(jsonPath("$.validationErrors.password").exists());
    }

    @Test
    void registerShouldReturn409ConflictWhenDuplicateEmailOrStudentId() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "Jane Doe", "E/20/002", "duplicate@eng.pdn.ac.lk", "SecurePass123", null, null
        );

        when(authService.register(any(RegisterRequest.class)))
                .thenThrow(new DuplicateResourceException("Email is already registered: duplicate@eng.pdn.ac.lk"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Email is already registered: duplicate@eng.pdn.ac.lk"));
    }

    @Test
    void loginShouldReturn200OkWithToken() throws Exception {
        LoginRequest request = new LoginRequest("jane@eng.pdn.ac.lk", "SecurePass123");
        UserResponse userResponse = new UserResponse(
                1L, "E/20/002", "Jane Doe", "jane@eng.pdn.ac.lk", null, null, Role.USER, LocalDateTime.now()
        );
        AuthResponse authResponse = new AuthResponse("mock.jwt.token", "Bearer", 3600000L, userResponse);

        when(authService.login(any(LoginRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("mock.jwt.token"))
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.expiresIn").value(3600000L))
                .andExpect(jsonPath("$.user.email").value("jane@eng.pdn.ac.lk"));
    }

    @Test
    void loginShouldReturn401UnauthorizedForBadCredentials() throws Exception {
        LoginRequest request = new LoginRequest("jane@eng.pdn.ac.lk", "WrongPass");

        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new BadCredentialsException("Invalid email or password"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }
}
