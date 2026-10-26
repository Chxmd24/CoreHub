package com.corehub.backend.service;

import com.corehub.backend.dto.ComponentRequest;
import com.corehub.backend.dto.ComponentResponse;
import com.corehub.backend.dto.PagedResponse;
import com.corehub.backend.entity.Component;
import com.corehub.backend.entity.ComponentStatus;
import com.corehub.backend.entity.ListingType;
import com.corehub.backend.entity.Reservation;
import com.corehub.backend.entity.ReservationStatus;
import com.corehub.backend.entity.Role;
import com.corehub.backend.entity.User;
import com.corehub.backend.exception.ConflictException;
import com.corehub.backend.exception.ResourceNotFoundException;
import com.corehub.backend.repository.ComponentRepository;
import com.corehub.backend.repository.ReservationRepository;
import com.corehub.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ComponentServiceTest {

    @Mock
    private ComponentRepository componentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ReservationRepository reservationRepository;

    private ComponentService componentService;

    private User owner;
    private User otherUser;
    private Component sampleComponent;

    @BeforeEach
    void setUp() {
        componentService = new ComponentService(componentRepository, userRepository, reservationRepository);

        owner = new User("E/20/001", "Alice Smith", "alice@eng.pdn.ac.lk", "hash123", "0771234567", "ECE", Role.USER);
        owner.setId(1L);

        otherUser = new User("E/20/002", "Bob Jones", "bob@eng.pdn.ac.lk", "hash456", "0777654321", "MECH", Role.USER);
        otherUser.setId(2L);

        sampleComponent = new Component(
                "Arduino Uno R3",
                "Original microcontroller board in working condition",
                "Microcontrollers",
                "ATmega328P, 16MHz, 5V",
                ListingType.SELL,
                new BigDecimal("2500.00"),
                ComponentStatus.AVAILABLE,
                owner
        );
        sampleComponent.setId(10L);
        sampleComponent.setCreatedAt(LocalDateTime.now());
        sampleComponent.setUpdatedAt(LocalDateTime.now());
    }

    @Test
    void shouldGetPagedComponentsWithDefaultAvailableStatus() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Component> page = new PageImpl<>(List.of(sampleComponent), pageable, 1);

        when(componentRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        PagedResponse<ComponentResponse> response = componentService.getComponents(
                null, null, null, null, pageable
        );

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        assertEquals("Arduino Uno R3", response.getContent().get(0).getTitle());
        assertEquals(ComponentStatus.AVAILABLE, response.getContent().get(0).getStatus());
        assertEquals(1L, response.getContent().get(0).getOwnerId());
        assertEquals("Alice Smith", response.getContent().get(0).getOwnerName());
    }

    @Test
    void shouldGetComponentByIdSuccessfullyAndMaintainPrivacy() {
        when(componentRepository.findById(10L)).thenReturn(Optional.of(sampleComponent));

        ComponentResponse response = componentService.getComponentById(10L);

        assertNotNull(response);
        assertEquals(10L, response.getId());
        assertEquals("Arduino Uno R3", response.getTitle());
        assertEquals(1L, response.getOwnerId());
        assertEquals("Alice Smith", response.getOwnerName());
    }

    @Test
    void shouldThrowResourceNotFoundExceptionWhenComponentNotFound() {
        when(componentRepository.findById(999L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> componentService.getComponentById(999L)
        );

        assertTrue(exception.getMessage().contains("Component listing not found with ID: 999"));
    }

    @Test
    void shouldCreateSellListingWithPriceAndSetAvailableStatus() {
        ComponentRequest request = new ComponentRequest(
                "Raspberry Pi 4",
                "4GB RAM Model B",
                "Embedded",
                "4GB LPDDR4, Quad core Cortex-A72",
                ListingType.SELL,
                new BigDecimal("15000.00")
        );

        when(userRepository.findByEmail("alice@eng.pdn.ac.lk")).thenReturn(Optional.of(owner));
        when(componentRepository.save(any(Component.class))).thenAnswer(invocation -> {
            Component c = invocation.getArgument(0);
            c.setId(101L);
            c.setCreatedAt(LocalDateTime.now());
            c.setUpdatedAt(LocalDateTime.now());
            return c;
        });

        ComponentResponse response = componentService.createComponent(request, "alice@eng.pdn.ac.lk");

        assertNotNull(response);
        assertEquals(101L, response.getId());
        assertEquals("Raspberry Pi 4", response.getTitle());
        assertEquals(ComponentStatus.AVAILABLE, response.getStatus());
        assertEquals(ListingType.SELL, response.getListingType());
        assertEquals(new BigDecimal("15000.00"), response.getPrice());
        assertEquals(owner.getId(), response.getOwnerId());
        assertEquals(owner.getName(), response.getOwnerName());

        ArgumentCaptor<Component> captor = ArgumentCaptor.forClass(Component.class);
        verify(componentRepository).save(captor.capture());
        Component captured = captor.getValue();
        assertEquals(ComponentStatus.AVAILABLE, captured.getStatus());
        assertEquals(owner, captured.getOwner());
    }

    @Test
    void shouldCreateSwapOrBorrowListingWithNullPrice() {
        ComponentRequest swapRequest = new ComponentRequest(
                "Breadboard & Jumper Wires",
                "Standard 830-point breadboard",
                "Prototyping",
                "830 tie-points",
                ListingType.SWAP,
                null
        );

        when(userRepository.findByEmail("alice@eng.pdn.ac.lk")).thenReturn(Optional.of(owner));
        when(componentRepository.save(any(Component.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ComponentResponse response = componentService.createComponent(swapRequest, "alice@eng.pdn.ac.lk");

        assertNotNull(response);
        assertEquals(ListingType.SWAP, response.getListingType());
        assertNull(response.getPrice());
        assertEquals(ComponentStatus.AVAILABLE, response.getStatus());
    }

    @Test
    void shouldRejectSellListingWhenPriceIsNull() {
        ComponentRequest request = new ComponentRequest(
                "Stepper Motor",
                "NEMA 17",
                "Motors",
                null,
                ListingType.SELL,
                null
        );

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> componentService.createComponent(request, "alice@eng.pdn.ac.lk")
        );

        assertTrue(ex.getMessage().contains("Price is required for SELL listings"));
    }

    @Test
    void shouldRejectSellListingWhenPriceIsNegative() {
        ComponentRequest request = new ComponentRequest(
                "Stepper Motor",
                "NEMA 17",
                "Motors",
                null,
                ListingType.SELL,
                new BigDecimal("-10.00")
        );

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> componentService.createComponent(request, "alice@eng.pdn.ac.lk")
        );

        assertTrue(ex.getMessage().contains("Price cannot be negative"));
    }

    @Test
    void shouldRejectSwapOrBorrowListingWhenPriceIsProvided() {
        ComponentRequest request = new ComponentRequest(
                "Oscilloscope Probe",
                "100MHz probe for lab use",
                "Testing Equipment",
                null,
                ListingType.BORROW,
                new BigDecimal("500.00")
        );

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> componentService.createComponent(request, "alice@eng.pdn.ac.lk")
        );

        assertTrue(ex.getMessage().contains("Price must be null for BORROW listings"));
    }

    @Test
    void shouldUpdateComponentWhenUserIsOwner() {
        ComponentRequest updateRequest = new ComponentRequest(
                "Arduino Uno R3 (Updated)",
                "Updated description with cable included",
                "Microcontrollers",
                "ATmega328P with USB cable",
                ListingType.SELL,
                new BigDecimal("2800.00")
        );

        when(userRepository.findByEmail("alice@eng.pdn.ac.lk")).thenReturn(Optional.of(owner));
        when(componentRepository.findById(10L)).thenReturn(Optional.of(sampleComponent));
        when(componentRepository.save(any(Component.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ComponentResponse response = componentService.updateComponent(10L, updateRequest, "alice@eng.pdn.ac.lk");

        assertNotNull(response);
        assertEquals("Arduino Uno R3 (Updated)", response.getTitle());
        assertEquals("Updated description with cable included", response.getDescription());
        assertEquals(new BigDecimal("2800.00"), response.getPrice());
    }

    @Test
    void shouldRejectUpdateWhenUserIsNotOwner() {
        ComponentRequest updateRequest = new ComponentRequest(
                "Hacked Title", "Hacked desc", "Category", null, ListingType.SELL, new BigDecimal("100.00")
        );

        when(userRepository.findByEmail("bob@eng.pdn.ac.lk")).thenReturn(Optional.of(otherUser));
        when(componentRepository.findById(10L)).thenReturn(Optional.of(sampleComponent));

        AccessDeniedException ex = assertThrows(
                AccessDeniedException.class,
                () -> componentService.updateComponent(10L, updateRequest, "bob@eng.pdn.ac.lk")
        );

        assertTrue(ex.getMessage().contains("You are not authorized to update this listing"));
    }

    @Test
    void shouldDeleteComponentWhenOwnerAndNoReservationsExist() {
        when(userRepository.findByEmail("alice@eng.pdn.ac.lk")).thenReturn(Optional.of(owner));
        when(componentRepository.findById(10L)).thenReturn(Optional.of(sampleComponent));
        when(reservationRepository.findByComponentId(10L)).thenReturn(Collections.emptyList());

        componentService.deleteComponent(10L, "alice@eng.pdn.ac.lk");

        verify(componentRepository).delete(sampleComponent);
    }

    @Test
    void shouldRejectDeleteWhenActiveReservationExists() {
        Reservation activeRes = new Reservation(sampleComponent, otherUser, LocalDateTime.now().plusDays(1), ReservationStatus.ACTIVE);
        List<Reservation> reservations = List.of(activeRes);

        when(userRepository.findByEmail("alice@eng.pdn.ac.lk")).thenReturn(Optional.of(owner));
        when(componentRepository.findById(10L)).thenReturn(Optional.of(sampleComponent));
        when(reservationRepository.findByComponentId(10L)).thenReturn(reservations);

        ConflictException ex = assertThrows(
                ConflictException.class,
                () -> componentService.deleteComponent(10L, "alice@eng.pdn.ac.lk")
        );

        assertTrue(ex.getMessage().contains("active reservation"));
        verify(componentRepository, never()).delete(any(Component.class));
    }

    @Test
    void shouldRejectDeleteWhenHistoricalReservationsExist() {
        Reservation completedRes = new Reservation(sampleComponent, otherUser, LocalDateTime.now().minusDays(5), ReservationStatus.COMPLETED);
        List<Reservation> reservations = List.of(completedRes);

        when(userRepository.findByEmail("alice@eng.pdn.ac.lk")).thenReturn(Optional.of(owner));
        when(componentRepository.findById(10L)).thenReturn(Optional.of(sampleComponent));
        when(reservationRepository.findByComponentId(10L)).thenReturn(reservations);

        ConflictException ex = assertThrows(
                ConflictException.class,
                () -> componentService.deleteComponent(10L, "alice@eng.pdn.ac.lk")
        );

        assertTrue(ex.getMessage().contains("historical reservations exist"));
        verify(componentRepository, never()).delete(any(Component.class));
    }

    @Test
    void shouldRejectDeleteWhenUserIsNotOwner() {
        when(userRepository.findByEmail("bob@eng.pdn.ac.lk")).thenReturn(Optional.of(otherUser));
        when(componentRepository.findById(10L)).thenReturn(Optional.of(sampleComponent));

        AccessDeniedException ex = assertThrows(
                AccessDeniedException.class,
                () -> componentService.deleteComponent(10L, "bob@eng.pdn.ac.lk")
        );

        assertTrue(ex.getMessage().contains("You are not authorized to delete this listing"));
    }

    @Test
    void shouldGetMyComponentsForAuthenticatedStudent() {
        when(userRepository.findByEmail("alice@eng.pdn.ac.lk")).thenReturn(Optional.of(owner));
        when(componentRepository.findByOwnerIdOrderByCreatedAtDesc(owner.getId())).thenReturn(List.of(sampleComponent));

        List<ComponentResponse> myComponents = componentService.getMyComponents("alice@eng.pdn.ac.lk");

        assertNotNull(myComponents);
        assertEquals(1, myComponents.size());
        assertEquals(sampleComponent.getId(), myComponents.get(0).getId());
        assertEquals(sampleComponent.getTitle(), myComponents.get(0).getTitle());
    }
}
