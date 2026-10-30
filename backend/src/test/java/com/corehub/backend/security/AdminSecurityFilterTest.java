package com.corehub.backend.security;

import com.corehub.backend.controller.AdminController;
import com.corehub.backend.dto.AdminOverviewResponse;
import com.corehub.backend.dto.AdminUserResponse;
import com.corehub.backend.dto.UpdateUserRoleRequest;
import com.corehub.backend.entity.Role;
import com.corehub.backend.exception.GlobalExceptionHandler;
import com.corehub.backend.service.AdminService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import java.security.Principal;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminSecurityFilterTest {

    @Mock
    private AdminService adminService;

    @InjectMocks
    private AdminController adminController;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = JsonMapper.builder().build();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void shouldReturn403WhenServiceDeniesAccessToNonSuperAdmin() throws Exception {
        Principal adminPrincipal = () -> "labadmin@eng.pdn.ac.lk";
        UpdateUserRoleRequest request = new UpdateUserRoleRequest(Role.ADMIN);

        when(adminService.updateUserRole(eq(10L), eq(Role.ADMIN), eq("labadmin@eng.pdn.ac.lk")))
                .thenThrow(new AccessDeniedException("Forbidden: Only SUPER_ADMIN can appoint or revoke administrator privileges."));

        mockMvc.perform(patch("/api/admin/users/10/role")
                        .principal(adminPrincipal)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Forbidden"))
                .andExpect(jsonPath("$.message").value("Forbidden: Only SUPER_ADMIN can appoint or revoke administrator privileges."));
    }

    @Test
    void shouldReturn400WhenAttemptingToAssignSuperAdminRole() throws Exception {
        Principal superAdminPrincipal = () -> "owner@eng.pdn.ac.lk";
        UpdateUserRoleRequest request = new UpdateUserRoleRequest(Role.SUPER_ADMIN);

        when(adminService.updateUserRole(eq(10L), eq(Role.SUPER_ADMIN), eq("owner@eng.pdn.ac.lk")))
                .thenThrow(new IllegalArgumentException("Operation rejected: Cannot create a second SUPER_ADMIN account. CoreHub permits exactly one project owner SUPER_ADMIN."));

        mockMvc.perform(patch("/api/admin/users/10/role")
                        .principal(superAdminPrincipal)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Operation rejected: Cannot create a second SUPER_ADMIN account. CoreHub permits exactly one project owner SUPER_ADMIN."));
    }

    @Test
    void shouldReturn400WhenAttemptingToDemoteSuperAdminAccount() throws Exception {
        Principal superAdminPrincipal = () -> "owner@eng.pdn.ac.lk";
        UpdateUserRoleRequest request = new UpdateUserRoleRequest(Role.USER);

        when(adminService.updateUserRole(eq(1L), eq(Role.USER), eq("owner@eng.pdn.ac.lk")))
                .thenThrow(new IllegalArgumentException("Operation rejected: The primary SUPER_ADMIN account cannot be demoted or modified."));

        mockMvc.perform(patch("/api/admin/users/1/role")
                        .principal(superAdminPrincipal)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Operation rejected: The primary SUPER_ADMIN account cannot be demoted or modified."));
    }
}
