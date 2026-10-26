package com.corehub.backend.controller;

import com.corehub.backend.dto.CreateReservationRequest;
import com.corehub.backend.dto.ReservationResponse;
import com.corehub.backend.dto.SellerContactResponse;
import com.corehub.backend.entity.ComponentStatus;
import com.corehub.backend.entity.ListingType;
import com.corehub.backend.entity.ReservationStatus;
import com.corehub.backend.exception.ConflictException;
import com.corehub.backend.exception.GlobalExceptionHandler;
import com.corehub.backend.exception.ResourceNotFoundException;
import com.corehub.backend.service.ReservationService;
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

import java.math.BigDecimal;
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ReservationControllerTest {

    @Mock
    private ReservationService reservationService;

    @InjectMocks
    private ReservationController reservationController;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = JsonMapper.builder().build();

    private ReservationResponse activeResponse;
    private ReservationResponse cancelledResponse;
    private ReservationResponse completedResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(reservationController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        SellerContactResponse sellerContact = new SellerContactResponse(
                "Alice Seller", "seller@eng.pdn.ac.lk", "0771234567", "ECE", "E/20/001"
        );

        LocalDateTime now = LocalDateTime.now();

        activeResponse = new ReservationResponse(
                50L,
                100L,
                "Raspberry Pi 4",
                "Embedded",
                "SELL",
                new BigDecimal("15000.00"),
                2L,
                "Bob Buyer",
                1L,
                "Alice Seller",
                now,
                now.plusHours(24),
                ReservationStatus.ACTIVE,
                sellerContact
        );

        cancelledResponse = new ReservationResponse(
                50L,
                100L,
                "Raspberry Pi 4",
                "Embedded",
                "SELL",
                new BigDecimal("15000.00"),
                2L,
                "Bob Buyer",
                1L,
                "Alice Seller",
                now,
                now.plusHours(24),
                ReservationStatus.CANCELLED,
                null
        );

        completedResponse = new ReservationResponse(
                50L,
                100L,
                "Raspberry Pi 4",
                "Embedded",
                "SELL",
                new BigDecimal("15000.00"),
                2L,
                "Bob Buyer",
                1L,
                "Alice Seller",
                now,
                now.plusHours(24),
                ReservationStatus.COMPLETED,
                null
        );
    }

    @Test
    void shouldCreateReservationWhenAuthenticated() throws Exception {
        CreateReservationRequest request = new CreateReservationRequest(100L);
        Principal principal = () -> "buyer@eng.pdn.ac.lk";

        when(reservationService.createReservation(eq(100L), eq("buyer@eng.pdn.ac.lk")))
                .thenReturn(activeResponse);

        mockMvc.perform(post("/api/reservations")
                        .principal(principal)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(50))
                .andExpect(jsonPath("$.componentId").value(100))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.sellerContact.name").value("Alice Seller"))
                .andExpect(jsonPath("$.sellerContact.email").value("seller@eng.pdn.ac.lk"));
    }

    @Test
    void shouldRejectCreateReservationWhenUnauthenticated() throws Exception {
        CreateReservationRequest request = new CreateReservationRequest(100L);

        mockMvc.perform(post("/api/reservations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldRejectCreateReservationWithInvalidRequest() throws Exception {
        CreateReservationRequest request = new CreateReservationRequest(null);
        Principal principal = () -> "buyer@eng.pdn.ac.lk";

        mockMvc.perform(post("/api/reservations")
                        .principal(principal)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.validationErrors.componentId").exists());
    }

    @Test
    void shouldReturn400WhenReservingOwnListing() throws Exception {
        CreateReservationRequest request = new CreateReservationRequest(100L);
        Principal principal = () -> "seller@eng.pdn.ac.lk";

        when(reservationService.createReservation(eq(100L), eq("seller@eng.pdn.ac.lk")))
                .thenThrow(new IllegalArgumentException("You cannot reserve your own listing"));

        mockMvc.perform(post("/api/reservations")
                        .principal(principal)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("You cannot reserve your own listing"));
    }

    @Test
    void shouldReturn409WhenListingAlreadyReservedOrNotAvailable() throws Exception {
        CreateReservationRequest request = new CreateReservationRequest(100L);
        Principal principal = () -> "buyer@eng.pdn.ac.lk";

        when(reservationService.createReservation(eq(100L), eq("buyer@eng.pdn.ac.lk")))
                .thenThrow(new ConflictException("Listing already has an active reservation"));

        mockMvc.perform(post("/api/reservations")
                        .principal(principal)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Listing already has an active reservation"));
    }

    @Test
    void shouldReturn404WhenReservingNonexistentComponent() throws Exception {
        CreateReservationRequest request = new CreateReservationRequest(999L);
        Principal principal = () -> "buyer@eng.pdn.ac.lk";

        when(reservationService.createReservation(eq(999L), eq("buyer@eng.pdn.ac.lk")))
                .thenThrow(new ResourceNotFoundException("Component listing not found with ID: 999"));

        mockMvc.perform(post("/api/reservations")
                        .principal(principal)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Component listing not found with ID: 999"));
    }

    @Test
    void shouldGetMyReservationsWhenAuthenticated() throws Exception {
        Principal principal = () -> "buyer@eng.pdn.ac.lk";
        when(reservationService.getMyReservations("buyer@eng.pdn.ac.lk"))
                .thenReturn(List.of(activeResponse));

        mockMvc.perform(get("/api/reservations/mine")
                        .principal(principal)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(50))
                .andExpect(jsonPath("$[0].reservedByName").value("Bob Buyer"));
    }

    @Test
    void shouldRejectGetMyReservationsWhenUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/reservations/mine")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldGetReceivedReservationsWhenAuthenticated() throws Exception {
        Principal principal = () -> "seller@eng.pdn.ac.lk";
        when(reservationService.getReceivedReservations("seller@eng.pdn.ac.lk"))
                .thenReturn(List.of(activeResponse));

        mockMvc.perform(get("/api/reservations/received")
                        .principal(principal)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(50))
                .andExpect(jsonPath("$[0].componentOwnerName").value("Alice Seller"));
    }

    @Test
    void shouldRejectGetReceivedReservationsWhenUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/reservations/received")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldGetReservationByIdWhenAuthorized() throws Exception {
        Principal principal = () -> "buyer@eng.pdn.ac.lk";
        when(reservationService.getReservationById(50L, "buyer@eng.pdn.ac.lk"))
                .thenReturn(activeResponse);

        mockMvc.perform(get("/api/reservations/50")
                        .principal(principal)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(50))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.sellerContact.name").value("Alice Seller"));
    }

    @Test
    void shouldReturn403WhenUnauthorizedToGetReservationById() throws Exception {
        Principal principal = () -> "charlie@eng.pdn.ac.lk";
        when(reservationService.getReservationById(50L, "charlie@eng.pdn.ac.lk"))
                .thenThrow(new AccessDeniedException("You are not authorized to view this reservation"));

        mockMvc.perform(get("/api/reservations/50")
                        .principal(principal)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message").value("You are not authorized to view this reservation"));
    }

    @Test
    void shouldCancelReservationWhenAuthorized() throws Exception {
        Principal principal = () -> "buyer@eng.pdn.ac.lk";
        when(reservationService.cancelReservation(50L, "buyer@eng.pdn.ac.lk"))
                .thenReturn(cancelledResponse);

        mockMvc.perform(patch("/api/reservations/50/cancel")
                        .principal(principal)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(50))
                .andExpect(jsonPath("$.status").value("CANCELLED"))
                .andExpect(jsonPath("$.sellerContact").doesNotExist());
    }

    @Test
    void shouldReturn403WhenUnauthorizedUserCancelsReservation() throws Exception {
        Principal principal = () -> "charlie@eng.pdn.ac.lk";
        when(reservationService.cancelReservation(50L, "charlie@eng.pdn.ac.lk"))
                .thenThrow(new AccessDeniedException("You are not authorized to cancel this reservation"));

        mockMvc.perform(patch("/api/reservations/50/cancel")
                        .principal(principal)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message").value("You are not authorized to cancel this reservation"));
    }

    @Test
    void shouldReturn409WhenCancellingNonActiveReservation() throws Exception {
        Principal principal = () -> "buyer@eng.pdn.ac.lk";
        when(reservationService.cancelReservation(50L, "buyer@eng.pdn.ac.lk"))
                .thenThrow(new ConflictException("Only ACTIVE reservations can be cancelled"));

        mockMvc.perform(patch("/api/reservations/50/cancel")
                        .principal(principal)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Only ACTIVE reservations can be cancelled"));
    }

    @Test
    void shouldCompleteReservationWhenOwner() throws Exception {
        Principal principal = () -> "seller@eng.pdn.ac.lk";
        when(reservationService.completeReservation(50L, "seller@eng.pdn.ac.lk"))
                .thenReturn(completedResponse);

        mockMvc.perform(patch("/api/reservations/50/complete")
                        .principal(principal)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(50))
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.sellerContact").doesNotExist());
    }

    @Test
    void shouldReturn403WhenBuyerTriesToCompleteReservation() throws Exception {
        Principal principal = () -> "buyer@eng.pdn.ac.lk";
        when(reservationService.completeReservation(50L, "buyer@eng.pdn.ac.lk"))
                .thenThrow(new AccessDeniedException("Only the listing owner can complete a reservation"));

        mockMvc.perform(patch("/api/reservations/50/complete")
                        .principal(principal)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message").value("Only the listing owner can complete a reservation"));
    }

    @Test
    void shouldReturn409WhenCompletingNonActiveReservation() throws Exception {
        Principal principal = () -> "seller@eng.pdn.ac.lk";
        when(reservationService.completeReservation(50L, "seller@eng.pdn.ac.lk"))
                .thenThrow(new ConflictException("Only ACTIVE reservations can be completed"));

        mockMvc.perform(patch("/api/reservations/50/complete")
                        .principal(principal)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Only ACTIVE reservations can be completed"));
    }

    @Test
    void shouldRejectCancelWhenUnauthenticated() throws Exception {
        mockMvc.perform(patch("/api/reservations/50/cancel")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldRejectCompleteWhenUnauthenticated() throws Exception {
        mockMvc.perform(patch("/api/reservations/50/complete")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldRejectGetByIdWhenUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/reservations/50")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldReturn409WhenCancellingExpiredReservation() throws Exception {
        Principal principal = () -> "buyer@eng.pdn.ac.lk";
        when(reservationService.cancelReservation(50L, "buyer@eng.pdn.ac.lk"))
                .thenThrow(new ConflictException("Reservation has expired and cannot be cancelled"));

        mockMvc.perform(patch("/api/reservations/50/cancel")
                        .principal(principal)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Reservation has expired and cannot be cancelled"));
    }

    @Test
    void shouldReturn409WhenCompletingExpiredReservation() throws Exception {
        Principal principal = () -> "seller@eng.pdn.ac.lk";
        when(reservationService.completeReservation(50L, "seller@eng.pdn.ac.lk"))
                .thenThrow(new ConflictException("Reservation has expired and cannot be completed"));

        mockMvc.perform(patch("/api/reservations/50/complete")
                        .principal(principal)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Reservation has expired and cannot be completed"));
    }
}
