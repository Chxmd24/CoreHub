package com.corehub.backend.controller;

import com.corehub.backend.dto.ComponentRequest;
import com.corehub.backend.dto.ComponentResponse;
import com.corehub.backend.dto.PagedResponse;
import com.corehub.backend.entity.ComponentStatus;
import com.corehub.backend.entity.ListingType;
import com.corehub.backend.exception.ConflictException;
import com.corehub.backend.exception.GlobalExceptionHandler;
import com.corehub.backend.exception.ResourceNotFoundException;
import com.corehub.backend.service.ComponentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
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
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ComponentControllerTest {

    @Mock
    private ComponentService componentService;

    @InjectMocks
    private ComponentController componentController;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = JsonMapper.builder().build();

    private ComponentResponse sampleResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(componentController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        sampleResponse = new ComponentResponse(
                10L,
                "Arduino Uno R3",
                "Original board in working condition",
                "Microcontrollers",
                "ATmega328P",
                ListingType.SELL,
                new BigDecimal("2500.00"),
                ComponentStatus.AVAILABLE,
                1L,
                "Alice Smith",
                LocalDateTime.now(),
                LocalDateTime.now()
        );
    }

    @Test
    void shouldBrowseComponentsPubliclyWithPaginationAndFiltering() throws Exception {
        PagedResponse<ComponentResponse> pagedResponse = new PagedResponse<>(
                List.of(sampleResponse), 0, 10, 1, 1, true
        );

        when(componentService.getComponents(eq("arduino"), eq("Microcontrollers"), eq(ListingType.SELL), eq(ComponentStatus.AVAILABLE), any(Pageable.class)))
                .thenReturn(pagedResponse);

        mockMvc.perform(get("/api/components")
                        .param("search", "arduino")
                        .param("category", "Microcontrollers")
                        .param("listingType", "SELL")
                        .param("status", "AVAILABLE")
                        .param("page", "0")
                        .param("size", "10")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(10))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].id").value(10))
                .andExpect(jsonPath("$.content[0].title").value("Arduino Uno R3"))
                .andExpect(jsonPath("$.content[0].ownerName").value("Alice Smith"));
    }

    @Test
    void shouldGetComponentDetailsPubliclyAndPreservePrivacy() throws Exception {
        when(componentService.getComponentById(10L)).thenReturn(sampleResponse);

        mockMvc.perform(get("/api/components/10")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.title").value("Arduino Uno R3"))
                .andExpect(jsonPath("$.ownerName").value("Alice Smith"))
                .andExpect(jsonPath("$.ownerId").value(1))
                // Privacy checks: sensitive fields must not be present
                .andExpect(jsonPath("$.ownerEmail").doesNotExist())
                .andExpect(jsonPath("$.ownerPhone").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.reservations").doesNotExist());
    }

    @Test
    void shouldReturn404WhenComponentDoesNotExist() throws Exception {
        when(componentService.getComponentById(999L))
                .thenThrow(new ResourceNotFoundException("Component listing not found with ID: 999"));

        mockMvc.perform(get("/api/components/999")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Component listing not found with ID: 999"));
    }

    @Test
    void shouldCreateComponentWhenAuthenticated() throws Exception {
        ComponentRequest request = new ComponentRequest(
                "Raspberry Pi 4", "Model B 4GB", "Embedded", "4GB RAM", ListingType.SELL, new BigDecimal("15000.00")
        );

        ComponentResponse createdResponse = new ComponentResponse(
                20L, "Raspberry Pi 4", "Model B 4GB", "Embedded", "4GB RAM",
                ListingType.SELL, new BigDecimal("15000.00"), ComponentStatus.AVAILABLE,
                1L, "Alice Smith", LocalDateTime.now(), LocalDateTime.now()
        );

        when(componentService.createComponent(any(ComponentRequest.class), eq("alice@eng.pdn.ac.lk")))
                .thenReturn(createdResponse);

        Principal principal = () -> "alice@eng.pdn.ac.lk";

        mockMvc.perform(post("/api/components")
                        .principal(principal)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(20))
                .andExpect(jsonPath("$.title").value("Raspberry Pi 4"))
                .andExpect(jsonPath("$.status").value("AVAILABLE"))
                .andExpect(jsonPath("$.ownerName").value("Alice Smith"));
    }

    @Test
    void shouldRejectCreateComponentWhenUnauthenticated() throws Exception {
        ComponentRequest request = new ComponentRequest(
                "Raspberry Pi 4", "Model B 4GB", "Embedded", null, ListingType.SELL, new BigDecimal("15000.00")
        );

        mockMvc.perform(post("/api/components")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldRejectCreateComponentWithValidationErrors() throws Exception {
        ComponentRequest invalidRequest = new ComponentRequest(
                "", "", "", null, null, null
        );

        Principal principal = () -> "alice@eng.pdn.ac.lk";

        mockMvc.perform(post("/api/components")
                        .principal(principal)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.validationErrors.title").exists())
                .andExpect(jsonPath("$.validationErrors.description").exists())
                .andExpect(jsonPath("$.validationErrors.category").exists())
                .andExpect(jsonPath("$.validationErrors.listingType").exists());
    }

    @Test
    void shouldUpdateComponentWhenAuthenticatedOwner() throws Exception {
        ComponentRequest updateRequest = new ComponentRequest(
                "Arduino Uno R3 (Updated)", "Updated description", "Microcontrollers", "ATmega328P", ListingType.SELL, new BigDecimal("2700.00")
        );

        ComponentResponse updatedResponse = new ComponentResponse(
                10L, "Arduino Uno R3 (Updated)", "Updated description", "Microcontrollers", "ATmega328P",
                ListingType.SELL, new BigDecimal("2700.00"), ComponentStatus.AVAILABLE,
                1L, "Alice Smith", LocalDateTime.now(), LocalDateTime.now()
        );

        when(componentService.updateComponent(eq(10L), any(ComponentRequest.class), eq("alice@eng.pdn.ac.lk")))
                .thenReturn(updatedResponse);

        Principal principal = () -> "alice@eng.pdn.ac.lk";

        mockMvc.perform(put("/api/components/10")
                        .principal(principal)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.title").value("Arduino Uno R3 (Updated)"))
                .andExpect(jsonPath("$.price").value(2700.00));
    }

    @Test
    void shouldReturn403WhenUpdatingNonOwnedComponent() throws Exception {
        ComponentRequest updateRequest = new ComponentRequest(
                "Hacked Title", "Hacked desc", "Category", null, ListingType.SELL, new BigDecimal("100.00")
        );

        when(componentService.updateComponent(eq(10L), any(ComponentRequest.class), eq("bob@eng.pdn.ac.lk")))
                .thenThrow(new AccessDeniedException("You are not authorized to update this listing"));

        Principal principal = () -> "bob@eng.pdn.ac.lk";

        mockMvc.perform(put("/api/components/10")
                        .principal(principal)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message").value("You are not authorized to update this listing"));
    }

    @Test
    void shouldDeleteComponentWhenAuthenticatedOwner() throws Exception {
        Principal principal = () -> "alice@eng.pdn.ac.lk";

        mockMvc.perform(delete("/api/components/10")
                        .principal(principal))
                .andExpect(status().isNoContent());

        verify(componentService).deleteComponent(10L, "alice@eng.pdn.ac.lk");
    }

    @Test
    void shouldReturn403WhenDeletingNonOwnedComponent() throws Exception {
        doThrow(new AccessDeniedException("You are not authorized to delete this listing"))
                .when(componentService).deleteComponent(10L, "bob@eng.pdn.ac.lk");

        Principal principal = () -> "bob@eng.pdn.ac.lk";

        mockMvc.perform(delete("/api/components/10")
                        .principal(principal))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message").value("You are not authorized to delete this listing"));
    }

    @Test
    void shouldReturn409ConflictWhenDeletingComponentWithActiveOrHistoricalReservations() throws Exception {
        doThrow(new ConflictException("Cannot delete listing: it has an active reservation"))
                .when(componentService).deleteComponent(10L, "alice@eng.pdn.ac.lk");

        Principal principal = () -> "alice@eng.pdn.ac.lk";

        mockMvc.perform(delete("/api/components/10")
                        .principal(principal))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message").value("Cannot delete listing: it has an active reservation"));
    }

    @Test
    void shouldGetMyComponentsWhenAuthenticated() throws Exception {
        when(componentService.getMyComponents("alice@eng.pdn.ac.lk"))
                .thenReturn(List.of(sampleResponse));

        Principal principal = () -> "alice@eng.pdn.ac.lk";

        mockMvc.perform(get("/api/components/mine")
                        .principal(principal)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(10))
                .andExpect(jsonPath("$[0].title").value("Arduino Uno R3"));
    }

    @Test
    void shouldRejectGetMyComponentsWhenUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/components/mine")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }
}
