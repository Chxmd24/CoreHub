package com.corehub.backend.controller;

import com.corehub.backend.dto.AdminListingResponse;
import com.corehub.backend.dto.AdminOverviewResponse;
import com.corehub.backend.dto.AdminUserResponse;
import com.corehub.backend.dto.ModerateListingRequest;
import com.corehub.backend.dto.PagedResponse;
import com.corehub.backend.dto.UpdateUserRoleRequest;
import com.corehub.backend.entity.ComponentStatus;
import com.corehub.backend.entity.ListingType;
import com.corehub.backend.entity.ModerationStatus;
import com.corehub.backend.entity.Role;
import com.corehub.backend.exception.GlobalExceptionHandler;
import com.corehub.backend.service.AdminService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import java.math.BigDecimal;
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminControllerTest {

    @Mock
    private AdminService adminService;

    @InjectMocks
    private AdminController adminController;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = JsonMapper.builder().build();

    private Principal principal;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        principal = () -> "superadmin@eng.pdn.ac.lk";
    }

    @Test
    void shouldReturnOverviewMetricsSuccessfully() throws Exception {
        AdminOverviewResponse overview = new AdminOverviewResponse(
                30, 2, 1, 60, 40, 10, 10, 3, 20, 5, 10, 3, 2, 12
        );
        when(adminService.getOverview()).thenReturn(overview);

        mockMvc.perform(get("/api/admin/overview"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUsers").value(30))
                .andExpect(jsonPath("$.totalAdmins").value(2))
                .andExpect(jsonPath("$.totalSuperAdmins").value(1))
                .andExpect(jsonPath("$.moderatedListings").value(3))
                .andExpect(jsonPath("$.totalAuditLogs").value(12));
    }

    @Test
    void shouldReturnPaginatedUsersSuccessfully() throws Exception {
        AdminUserResponse userDto = new AdminUserResponse(
                5L, "E/19/042", "Nuwan Bandara", "nuwan@eng.pdn.ac.lk",
                "0771234567", "CEng", Role.USER, LocalDateTime.now(), 2, 1
        );
        PagedResponse<AdminUserResponse> pagedResponse = PagedResponse.fromPage(
                new PageImpl<>(List.of(userDto), PageRequest.of(0, 10), 1)
        );
        when(adminService.getUsers(any(), any(), any())).thenReturn(pagedResponse);

        mockMvc.perform(get("/api/admin/users?page=0&size=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].email").value("nuwan@eng.pdn.ac.lk"))
                .andExpect(jsonPath("$.content[0].role").value("USER"))
                .andExpect(jsonPath("$.content[0].listingCount").value(2));
    }

    @Test
    void shouldUpdateUserRoleSuccessfully() throws Exception {
        AdminUserResponse updatedUser = new AdminUserResponse(
                5L, "E/19/042", "Nuwan Bandara", "nuwan@eng.pdn.ac.lk",
                "0771234567", "CEng", Role.ADMIN, LocalDateTime.now(), 2, 1
        );
        when(adminService.updateUserRole(eq(5L), eq(Role.ADMIN), eq("superadmin@eng.pdn.ac.lk")))
                .thenReturn(updatedUser);

        UpdateUserRoleRequest request = new UpdateUserRoleRequest(Role.ADMIN);

        mockMvc.perform(patch("/api/admin/users/5/role")
                        .principal(principal)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    @Test
    void shouldModerateListingSuccessfully() throws Exception {
        AdminListingResponse listing = new AdminListingResponse(
                42L, "ESP32 Board", "Wireless & IoT", ListingType.SELL,
                new BigDecimal("2500.00"), ComponentStatus.AVAILABLE,
                ModerationStatus.SUSPENDED, "Inappropriate title", LocalDateTime.now(),
                "superadmin@eng.pdn.ac.lk", 10L, "Alice", "alice@eng.pdn.ac.lk", LocalDateTime.now()
        );
        when(adminService.moderateListing(eq(42L), eq("SUSPEND"), eq("Inappropriate title"), eq("superadmin@eng.pdn.ac.lk")))
                .thenReturn(listing);

        ModerateListingRequest request = new ModerateListingRequest("SUSPEND", "Inappropriate title");

        mockMvc.perform(patch("/api/admin/listings/42/moderate")
                        .principal(principal)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.moderationStatus").value("SUSPENDED"))
                .andExpect(jsonPath("$.moderationReason").value("Inappropriate title"));
    }
}
