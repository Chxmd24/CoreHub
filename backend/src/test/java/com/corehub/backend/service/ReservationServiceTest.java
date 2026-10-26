package com.corehub.backend.service;

import com.corehub.backend.dto.ReservationResponse;
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
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReservationServiceTest {

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private ComponentRepository componentRepository;

    @Mock
    private UserRepository userRepository;

    private Clock fixedClock;
    private ReservationService reservationService;

    private User seller;
    private User buyer;
    private User thirdParty;
    private Component sampleComponent;

    @BeforeEach
    void setUp() {
        fixedClock = Clock.fixed(Instant.parse("2026-10-26T10:00:00Z"), ZoneOffset.UTC);
        reservationService = new ReservationService(reservationRepository, componentRepository, userRepository, fixedClock, 24L);

        seller = new User("E/20/001", "Alice Seller", "seller@eng.pdn.ac.lk", "hash1", "0771111111", "ECE", Role.USER);
        seller.setId(1L);

        buyer = new User("E/20/002", "Bob Buyer", "buyer@eng.pdn.ac.lk", "hash2", "0772222222", "MECH", Role.USER);
        buyer.setId(2L);

        thirdParty = new User("E/20/003", "Charlie Third", "charlie@eng.pdn.ac.lk", "hash3", "0773333333", "CIVIL", Role.USER);
        thirdParty.setId(3L);

        sampleComponent = new Component(
                "STM32 Nucleo Board",
                "Working ARM development board",
                "Microcontrollers",
                "Cortex-M4",
                ListingType.SELL,
                new BigDecimal("5000.00"),
                ComponentStatus.AVAILABLE,
                seller
        );
        sampleComponent.setId(100L);
    }

    @Test
    void shouldCreateReservationSuccessfullyWithPessimisticLockAndExpiry() {
        when(userRepository.findByEmail("buyer@eng.pdn.ac.lk")).thenReturn(Optional.of(buyer));
        when(componentRepository.findByIdWithLock(100L)).thenReturn(Optional.of(sampleComponent));
        when(reservationRepository.findByComponentIdAndStatus(100L, ReservationStatus.ACTIVE)).thenReturn(Optional.empty());
        when(reservationRepository.existsByComponentIdAndStatus(100L, ReservationStatus.ACTIVE)).thenReturn(false);

        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> {
            Reservation r = invocation.getArgument(0);
            r.setId(500L);
            return r;
        });

        ReservationResponse response = reservationService.createReservation(100L, "buyer@eng.pdn.ac.lk");

        assertNotNull(response);
        assertEquals(500L, response.getId());
        assertEquals(ReservationStatus.ACTIVE, response.getStatus());
        assertEquals(100L, response.getComponentId());
        assertEquals("STM32 Nucleo Board", response.getComponentTitle());
        assertEquals(2L, response.getReservedById());
        assertEquals("Bob Buyer", response.getReservedByName());
        assertEquals(1L, response.getComponentOwnerId());
        assertEquals("Alice Seller", response.getComponentOwnerName());

        // Component status updated to RESERVED
        assertEquals(ComponentStatus.RESERVED, sampleComponent.getStatus());
        verify(componentRepository).save(sampleComponent);

        // Expiration is 24 hours from creation time
        LocalDateTime expectedExpiresAt = LocalDateTime.now(fixedClock).plusHours(24);
        assertEquals(expectedExpiresAt, response.getExpiresAt());

        // Active reservation reveals seller contact info
        assertNotNull(response.getSellerContact());
        assertEquals("Alice Seller", response.getSellerContact().getName());
        assertEquals("seller@eng.pdn.ac.lk", response.getSellerContact().getEmail());
        assertEquals("0771111111", response.getSellerContact().getPhone());
        assertEquals("ECE", response.getSellerContact().getDepartment());
        assertEquals("E/20/001", response.getSellerContact().getStudentId());
    }

    @Test
    void shouldAllowNewReservationWhenPreviousReservationHasExpiredBeforeSchedulerRuns() {
        // Component was previously RESERVED by an overdue reservation
        sampleComponent.setStatus(ComponentStatus.RESERVED);
        LocalDateTime pastExpiry = LocalDateTime.now(fixedClock).minusMinutes(10);
        Reservation oldOverdueReservation = new Reservation(sampleComponent, thirdParty, pastExpiry, ReservationStatus.ACTIVE);
        oldOverdueReservation.setId(99L);

        when(userRepository.findByEmail("buyer@eng.pdn.ac.lk")).thenReturn(Optional.of(buyer));
        when(componentRepository.findByIdWithLock(100L)).thenReturn(Optional.of(sampleComponent));
        when(reservationRepository.findByComponentIdAndStatus(100L, ReservationStatus.ACTIVE)).thenReturn(Optional.of(oldOverdueReservation));
        when(reservationRepository.existsByComponentIdAndStatus(100L, ReservationStatus.ACTIVE)).thenReturn(false);

        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> {
            Reservation r = invocation.getArgument(0);
            if (r.getId() == null) {
                r.setId(501L);
            }
            return r;
        });

        ReservationResponse response = reservationService.createReservation(100L, "buyer@eng.pdn.ac.lk");

        assertNotNull(response);
        assertEquals(501L, response.getId());
        assertEquals(ReservationStatus.ACTIVE, response.getStatus());
        assertEquals(ReservationStatus.EXPIRED, oldOverdueReservation.getStatus(), "Previous reservation should be expired");
        verify(reservationRepository).saveAndFlush(oldOverdueReservation);
    }

    @Test
    void shouldRejectReservationWhenUserReservesOwnListing() {
        when(userRepository.findByEmail("seller@eng.pdn.ac.lk")).thenReturn(Optional.of(seller));
        when(componentRepository.findByIdWithLock(100L)).thenReturn(Optional.of(sampleComponent));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                reservationService.createReservation(100L, "seller@eng.pdn.ac.lk")
        );
        assertEquals("You cannot reserve your own listing", ex.getMessage());
        verify(reservationRepository, never()).save(any());
    }

    @Test
    void shouldRejectReservationWhenComponentDoesNotExist() {
        when(userRepository.findByEmail("buyer@eng.pdn.ac.lk")).thenReturn(Optional.of(buyer));
        when(componentRepository.findByIdWithLock(999L)).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class, () ->
                reservationService.createReservation(999L, "buyer@eng.pdn.ac.lk")
        );
        assertTrue(ex.getMessage().contains("Component listing not found with ID: 999"));
        verify(reservationRepository, never()).save(any());
    }

    @Test
    void shouldRejectReservationWhenComponentStatusIsNotAvailable() {
        sampleComponent.setStatus(ComponentStatus.EXCHANGED);
        when(userRepository.findByEmail("buyer@eng.pdn.ac.lk")).thenReturn(Optional.of(buyer));
        when(componentRepository.findByIdWithLock(100L)).thenReturn(Optional.of(sampleComponent));
        when(reservationRepository.findByComponentIdAndStatus(100L, ReservationStatus.ACTIVE)).thenReturn(Optional.empty());

        ConflictException ex = assertThrows(ConflictException.class, () ->
                reservationService.createReservation(100L, "buyer@eng.pdn.ac.lk")
        );
        assertTrue(ex.getMessage().contains("Listing is not available for reservation"));
        verify(reservationRepository, never()).save(any());
    }

    @Test
    void shouldRejectReservationWhenActiveUnexpiredReservationAlreadyExistsForComponent() {
        sampleComponent.setStatus(ComponentStatus.RESERVED);
        LocalDateTime unexpiredTime = LocalDateTime.now(fixedClock).plusHours(12);
        Reservation activeReservation = new Reservation(sampleComponent, thirdParty, unexpiredTime, ReservationStatus.ACTIVE);

        when(userRepository.findByEmail("buyer@eng.pdn.ac.lk")).thenReturn(Optional.of(buyer));
        when(componentRepository.findByIdWithLock(100L)).thenReturn(Optional.of(sampleComponent));
        when(reservationRepository.findByComponentIdAndStatus(100L, ReservationStatus.ACTIVE)).thenReturn(Optional.of(activeReservation));

        ConflictException ex = assertThrows(ConflictException.class, () ->
                reservationService.createReservation(100L, "buyer@eng.pdn.ac.lk")
        );
        assertTrue(ex.getMessage().contains("Listing is not available for reservation"));
        verify(reservationRepository, never()).save(any());
    }

    @Test
    void shouldPreventDoubleBookingUnderConcurrentRequests() throws Exception {
        // Simulates database-level pessimistic locking (SELECT ... FOR UPDATE)
        // Thread 1 acquires the row lock; Thread 2 waits on the lock until Thread 1 commits and releases it.
        when(userRepository.findByEmail("buyer@eng.pdn.ac.lk")).thenReturn(Optional.of(buyer));
        when(userRepository.findByEmail("charlie@eng.pdn.ac.lk")).thenReturn(Optional.of(thirdParty));

        java.util.concurrent.locks.ReentrantLock dbRowLock = new java.util.concurrent.locks.ReentrantLock();

        when(componentRepository.findByIdWithLock(100L)).thenAnswer(inv -> {
            dbRowLock.lock();
            return Optional.of(sampleComponent);
        });

        when(reservationRepository.findByComponentIdAndStatus(eq(100L), eq(ReservationStatus.ACTIVE)))
                .thenReturn(Optional.empty());

        when(reservationRepository.existsByComponentIdAndStatus(eq(100L), eq(ReservationStatus.ACTIVE)))
                .thenAnswer(inv -> sampleComponent.getStatus() == ComponentStatus.RESERVED);

        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> {
            try {
                sampleComponent.setStatus(ComponentStatus.RESERVED);
                Reservation r = inv.getArgument(0);
                r.setId(777L);
                return r;
            } finally {
                if (dbRowLock.isHeldByCurrentThread()) {
                    dbRowLock.unlock();
                }
            }
        });

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch startGate = new CountDownLatch(1);

        Future<Boolean> task1 = executor.submit(() -> {
            startGate.await();
            try {
                reservationService.createReservation(100L, "buyer@eng.pdn.ac.lk");
                return true;
            } catch (ConflictException ce) {
                return false;
            } finally {
                if (dbRowLock.isHeldByCurrentThread()) {
                    dbRowLock.unlock();
                }
            }
        });

        Future<Boolean> task2 = executor.submit(() -> {
            startGate.await();
            try {
                reservationService.createReservation(100L, "charlie@eng.pdn.ac.lk");
                return true;
            } catch (ConflictException ce) {
                return false;
            } finally {
                if (dbRowLock.isHeldByCurrentThread()) {
                    dbRowLock.unlock();
                }
            }
        });

        startGate.countDown();
        boolean res1 = task1.get(5, TimeUnit.SECONDS);
        boolean res2 = task2.get(5, TimeUnit.SECONDS);
        executor.shutdown();

        // Exactly one should succeed (true) and the other must fail with ConflictException (false)
        assertTrue((res1 && !res2) || (!res1 && res2), "Exactly one concurrent reservation should succeed");
    }

    @Test
    void shouldGetMyReservationsForRequesterAndPassivelyExpireOverdue() {
        LocalDateTime pastExpiry = LocalDateTime.now(fixedClock).minusHours(1);
        sampleComponent.setStatus(ComponentStatus.RESERVED);
        Reservation overdueReservation = new Reservation(
                sampleComponent, buyer, pastExpiry, ReservationStatus.ACTIVE
        );
        overdueReservation.setId(10L);
        overdueReservation.setReservedAt(LocalDateTime.now(fixedClock).minusHours(25));

        when(userRepository.findByEmail("buyer@eng.pdn.ac.lk")).thenReturn(Optional.of(buyer));
        when(reservationRepository.findByReservedByIdOrderByReservedAtDesc(2L)).thenReturn(List.of(overdueReservation));

        List<ReservationResponse> results = reservationService.getMyReservations("buyer@eng.pdn.ac.lk");

        assertEquals(1, results.size());
        assertEquals(10L, results.get(0).getId());
        assertEquals(ReservationStatus.EXPIRED, results.get(0).getStatus());
        assertEquals(ComponentStatus.AVAILABLE, sampleComponent.getStatus());
        assertNull(results.get(0).getSellerContact());
        verify(reservationRepository).saveAndFlush(overdueReservation);
        verify(componentRepository).saveAndFlush(sampleComponent);
    }

    @Test
    void shouldGetReceivedReservationsForOwnerAndPassivelyExpireOverdue() {
        LocalDateTime pastExpiry = LocalDateTime.now(fixedClock).minusHours(2);
        sampleComponent.setStatus(ComponentStatus.RESERVED);
        Reservation overdueReservation = new Reservation(
                sampleComponent, buyer, pastExpiry, ReservationStatus.ACTIVE
        );
        overdueReservation.setId(10L);
        overdueReservation.setReservedAt(LocalDateTime.now(fixedClock).minusHours(26));

        when(userRepository.findByEmail("seller@eng.pdn.ac.lk")).thenReturn(Optional.of(seller));
        when(reservationRepository.findByComponentOwnerIdOrderByReservedAtDesc(1L)).thenReturn(List.of(overdueReservation));

        List<ReservationResponse> results = reservationService.getReceivedReservations("seller@eng.pdn.ac.lk");

        assertEquals(1, results.size());
        assertEquals(10L, results.get(0).getId());
        assertEquals(ReservationStatus.EXPIRED, results.get(0).getStatus());
        assertEquals(ComponentStatus.AVAILABLE, sampleComponent.getStatus());
        assertNull(results.get(0).getSellerContact());
        verify(reservationRepository).saveAndFlush(overdueReservation);
        verify(componentRepository).saveAndFlush(sampleComponent);
    }

    @Test
    void shouldGetReservationByIdWhenRequesterOrOwner() {
        Reservation reservation = new Reservation(
                sampleComponent, buyer, LocalDateTime.now(fixedClock).plusHours(24), ReservationStatus.ACTIVE
        );
        reservation.setId(10L);
        reservation.setReservedAt(LocalDateTime.now(fixedClock));

        when(userRepository.findByEmail("buyer@eng.pdn.ac.lk")).thenReturn(Optional.of(buyer));
        when(reservationRepository.findById(10L)).thenReturn(Optional.of(reservation));

        ReservationResponse response = reservationService.getReservationById(10L, "buyer@eng.pdn.ac.lk");
        assertNotNull(response);
        assertEquals(10L, response.getId());
    }

    @Test
    void shouldDenyAccessToThirdPartyViewingReservation() {
        Reservation reservation = new Reservation(
                sampleComponent, buyer, LocalDateTime.now(fixedClock).plusHours(24), ReservationStatus.ACTIVE
        );
        reservation.setId(10L);

        when(userRepository.findByEmail("charlie@eng.pdn.ac.lk")).thenReturn(Optional.of(thirdParty));
        when(reservationRepository.findById(10L)).thenReturn(Optional.of(reservation));

        assertThrows(AccessDeniedException.class, () ->
                reservationService.getReservationById(10L, "charlie@eng.pdn.ac.lk")
        );
    }

    @Test
    void shouldPassiveExpireWhenViewingExpiredReservation() {
        // Reservation expired 1 hour ago relative to fixedClock
        LocalDateTime expiredTime = LocalDateTime.now(fixedClock).minusHours(1);
        sampleComponent.setStatus(ComponentStatus.RESERVED);

        Reservation reservation = new Reservation(
                sampleComponent, buyer, expiredTime, ReservationStatus.ACTIVE
        );
        reservation.setId(10L);

        when(userRepository.findByEmail("buyer@eng.pdn.ac.lk")).thenReturn(Optional.of(buyer));
        when(reservationRepository.findById(10L)).thenReturn(Optional.of(reservation));

        ReservationResponse response = reservationService.getReservationById(10L, "buyer@eng.pdn.ac.lk");

        assertEquals(ReservationStatus.EXPIRED, response.getStatus());
        assertEquals(ComponentStatus.AVAILABLE, sampleComponent.getStatus());
        assertNull(response.getSellerContact(), "Seller contact must not be exposed once expired");
        verify(componentRepository).saveAndFlush(sampleComponent);
        verify(reservationRepository).saveAndFlush(reservation);
    }

    @Test
    void shouldPassiveExpireWhenViewingReservationAtExactBoundaryTime() {
        // Reservation expiresAt is EXACTLY equal to now
        LocalDateTime exactBoundaryTime = LocalDateTime.now(fixedClock);
        sampleComponent.setStatus(ComponentStatus.RESERVED);

        Reservation reservation = new Reservation(
                sampleComponent, buyer, exactBoundaryTime, ReservationStatus.ACTIVE
        );
        reservation.setId(10L);

        when(userRepository.findByEmail("buyer@eng.pdn.ac.lk")).thenReturn(Optional.of(buyer));
        when(reservationRepository.findById(10L)).thenReturn(Optional.of(reservation));

        ReservationResponse response = reservationService.getReservationById(10L, "buyer@eng.pdn.ac.lk");

        assertEquals(ReservationStatus.EXPIRED, response.getStatus(), "Exact boundary time must be treated as expired");
        assertEquals(ComponentStatus.AVAILABLE, sampleComponent.getStatus());
        assertNull(response.getSellerContact());
    }

    @Test
    void shouldCancelReservationAsRequesterAndRestoreAvailability() {
        sampleComponent.setStatus(ComponentStatus.RESERVED);
        Reservation reservation = new Reservation(
                sampleComponent, buyer, LocalDateTime.now(fixedClock).plusHours(24), ReservationStatus.ACTIVE
        );
        reservation.setId(10L);

        when(userRepository.findByEmail("buyer@eng.pdn.ac.lk")).thenReturn(Optional.of(buyer));
        when(reservationRepository.findById(10L)).thenReturn(Optional.of(reservation));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> inv.getArgument(0));

        ReservationResponse response = reservationService.cancelReservation(10L, "buyer@eng.pdn.ac.lk");

        assertEquals(ReservationStatus.CANCELLED, response.getStatus());
        assertEquals(ComponentStatus.AVAILABLE, sampleComponent.getStatus());
        assertNull(response.getSellerContact(), "Seller contact must be null after cancellation");
        verify(componentRepository).save(sampleComponent);
        verify(reservationRepository).save(reservation);
    }

    @Test
    void shouldCancelReservationAsOwnerAndRestoreAvailability() {
        sampleComponent.setStatus(ComponentStatus.RESERVED);
        Reservation reservation = new Reservation(
                sampleComponent, buyer, LocalDateTime.now(fixedClock).plusHours(24), ReservationStatus.ACTIVE
        );
        reservation.setId(10L);

        when(userRepository.findByEmail("seller@eng.pdn.ac.lk")).thenReturn(Optional.of(seller));
        when(reservationRepository.findById(10L)).thenReturn(Optional.of(reservation));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> inv.getArgument(0));

        ReservationResponse response = reservationService.cancelReservation(10L, "seller@eng.pdn.ac.lk");

        assertEquals(ReservationStatus.CANCELLED, response.getStatus());
        assertEquals(ComponentStatus.AVAILABLE, sampleComponent.getStatus());
        verify(componentRepository).save(sampleComponent);
    }

    @Test
    void shouldDenyAccessWhenThirdPartyCancelsReservation() {
        Reservation reservation = new Reservation(
                sampleComponent, buyer, LocalDateTime.now(fixedClock).plusHours(24), ReservationStatus.ACTIVE
        );
        reservation.setId(10L);

        when(userRepository.findByEmail("charlie@eng.pdn.ac.lk")).thenReturn(Optional.of(thirdParty));
        when(reservationRepository.findById(10L)).thenReturn(Optional.of(reservation));

        assertThrows(AccessDeniedException.class, () ->
                reservationService.cancelReservation(10L, "charlie@eng.pdn.ac.lk")
        );
    }

    @Test
    void shouldRejectCancelWhenReservationNotActive() {
        Reservation reservation = new Reservation(
                sampleComponent, buyer, LocalDateTime.now(fixedClock).plusHours(24), ReservationStatus.COMPLETED
        );
        reservation.setId(10L);

        when(userRepository.findByEmail("buyer@eng.pdn.ac.lk")).thenReturn(Optional.of(buyer));
        when(reservationRepository.findById(10L)).thenReturn(Optional.of(reservation));

        ConflictException ex = assertThrows(ConflictException.class, () ->
                reservationService.cancelReservation(10L, "buyer@eng.pdn.ac.lk")
        );
        assertTrue(ex.getMessage().contains("Only ACTIVE reservations can be cancelled"));
    }

    @Test
    void shouldRejectCancelWhenReservationAlreadyCancelled() {
        Reservation reservation = new Reservation(
                sampleComponent, buyer, LocalDateTime.now(fixedClock).plusHours(24), ReservationStatus.CANCELLED
        );
        reservation.setId(10L);

        when(userRepository.findByEmail("buyer@eng.pdn.ac.lk")).thenReturn(Optional.of(buyer));
        when(reservationRepository.findById(10L)).thenReturn(Optional.of(reservation));

        ConflictException ex = assertThrows(ConflictException.class, () ->
                reservationService.cancelReservation(10L, "buyer@eng.pdn.ac.lk")
        );
        assertTrue(ex.getMessage().contains("Only ACTIVE reservations can be cancelled"));
    }

    @Test
    void shouldRejectCancelAndExpireWhenReservationIsOverdueOrAtBoundary() {
        // Overdue reservation at exact boundary
        LocalDateTime exactBoundary = LocalDateTime.now(fixedClock);
        sampleComponent.setStatus(ComponentStatus.RESERVED);
        Reservation reservation = new Reservation(
                sampleComponent, buyer, exactBoundary, ReservationStatus.ACTIVE
        );
        reservation.setId(10L);

        when(userRepository.findByEmail("buyer@eng.pdn.ac.lk")).thenReturn(Optional.of(buyer));
        when(reservationRepository.findById(10L)).thenReturn(Optional.of(reservation));

        ConflictException ex = assertThrows(ConflictException.class, () ->
                reservationService.cancelReservation(10L, "buyer@eng.pdn.ac.lk")
        );
        assertEquals("Reservation has expired and cannot be cancelled", ex.getMessage());
        assertEquals(ReservationStatus.EXPIRED, reservation.getStatus());
        assertEquals(ComponentStatus.AVAILABLE, sampleComponent.getStatus());
        verify(reservationRepository).saveAndFlush(reservation);
        verify(componentRepository).saveAndFlush(sampleComponent);
    }

    @Test
    void shouldCompleteReservationAsListingOwnerAndSetExchanged() {
        sampleComponent.setStatus(ComponentStatus.RESERVED);
        Reservation reservation = new Reservation(
                sampleComponent, buyer, LocalDateTime.now(fixedClock).plusHours(24), ReservationStatus.ACTIVE
        );
        reservation.setId(10L);

        when(userRepository.findByEmail("seller@eng.pdn.ac.lk")).thenReturn(Optional.of(seller));
        when(reservationRepository.findById(10L)).thenReturn(Optional.of(reservation));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> inv.getArgument(0));

        ReservationResponse response = reservationService.completeReservation(10L, "seller@eng.pdn.ac.lk");

        assertEquals(ReservationStatus.COMPLETED, response.getStatus());
        assertEquals(ComponentStatus.EXCHANGED, sampleComponent.getStatus());
        assertNull(response.getSellerContact(), "Seller contact must be null after completion");
        verify(componentRepository).save(sampleComponent);
        verify(reservationRepository).save(reservation);
    }

    @Test
    void shouldRejectCompleteWhenAttemptedByBuyer() {
        Reservation reservation = new Reservation(
                sampleComponent, buyer, LocalDateTime.now(fixedClock).plusHours(24), ReservationStatus.ACTIVE
        );
        reservation.setId(10L);

        when(userRepository.findByEmail("buyer@eng.pdn.ac.lk")).thenReturn(Optional.of(buyer));
        when(reservationRepository.findById(10L)).thenReturn(Optional.of(reservation));

        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () ->
                reservationService.completeReservation(10L, "buyer@eng.pdn.ac.lk")
        );
        assertEquals("Only the listing owner can complete a reservation", ex.getMessage());
    }

    @Test
    void shouldRejectCompleteWhenReservationNotActive() {
        Reservation reservation = new Reservation(
                sampleComponent, buyer, LocalDateTime.now(fixedClock).plusHours(24), ReservationStatus.CANCELLED
        );
        reservation.setId(10L);

        when(userRepository.findByEmail("seller@eng.pdn.ac.lk")).thenReturn(Optional.of(seller));
        when(reservationRepository.findById(10L)).thenReturn(Optional.of(reservation));

        ConflictException ex = assertThrows(ConflictException.class, () ->
                reservationService.completeReservation(10L, "seller@eng.pdn.ac.lk")
        );
        assertTrue(ex.getMessage().contains("Only ACTIVE reservations can be completed"));
    }

    @Test
    void shouldRejectCompleteWhenReservationAlreadyCompleted() {
        Reservation reservation = new Reservation(
                sampleComponent, buyer, LocalDateTime.now(fixedClock).plusHours(24), ReservationStatus.COMPLETED
        );
        reservation.setId(10L);

        when(userRepository.findByEmail("seller@eng.pdn.ac.lk")).thenReturn(Optional.of(seller));
        when(reservationRepository.findById(10L)).thenReturn(Optional.of(reservation));

        ConflictException ex = assertThrows(ConflictException.class, () ->
                reservationService.completeReservation(10L, "seller@eng.pdn.ac.lk")
        );
        assertTrue(ex.getMessage().contains("Only ACTIVE reservations can be completed"));
    }

    @Test
    void shouldRejectCompleteWhenReservationAlreadyExpired() {
        Reservation reservation = new Reservation(
                sampleComponent, buyer, LocalDateTime.now(fixedClock).minusHours(1), ReservationStatus.EXPIRED
        );
        reservation.setId(10L);

        when(userRepository.findByEmail("seller@eng.pdn.ac.lk")).thenReturn(Optional.of(seller));
        when(reservationRepository.findById(10L)).thenReturn(Optional.of(reservation));

        ConflictException ex = assertThrows(ConflictException.class, () ->
                reservationService.completeReservation(10L, "seller@eng.pdn.ac.lk")
        );
        assertTrue(ex.getMessage().contains("Only ACTIVE reservations can be completed"));
    }

    @Test
    void shouldRejectCompleteAndExpireWhenReservationIsOverdueOrAtBoundary() {
        LocalDateTime exactBoundary = LocalDateTime.now(fixedClock);
        sampleComponent.setStatus(ComponentStatus.RESERVED);
        Reservation reservation = new Reservation(
                sampleComponent, buyer, exactBoundary, ReservationStatus.ACTIVE
        );
        reservation.setId(10L);

        when(userRepository.findByEmail("seller@eng.pdn.ac.lk")).thenReturn(Optional.of(seller));
        when(reservationRepository.findById(10L)).thenReturn(Optional.of(reservation));

        ConflictException ex = assertThrows(ConflictException.class, () ->
                reservationService.completeReservation(10L, "seller@eng.pdn.ac.lk")
        );
        assertEquals("Reservation has expired and cannot be completed", ex.getMessage());
        assertEquals(ReservationStatus.EXPIRED, reservation.getStatus());
        assertEquals(ComponentStatus.AVAILABLE, sampleComponent.getStatus());
        verify(reservationRepository).saveAndFlush(reservation);
        verify(componentRepository).saveAndFlush(sampleComponent);
    }

    @Test
    void shouldExpireOldReservationsViaTimeTravelClock() {
        // Time travel: Advance clock by 24 hours (exact boundary)
        Clock futureClock = Clock.offset(fixedClock, Duration.ofHours(24));
        ReservationService futureService = new ReservationService(
                reservationRepository, componentRepository, userRepository, futureClock, 24L
        );

        sampleComponent.setStatus(ComponentStatus.RESERVED);
        Reservation expiredReservation = new Reservation(
                sampleComponent, buyer, LocalDateTime.now(fixedClock).plusHours(24), ReservationStatus.ACTIVE
        );
        expiredReservation.setId(88L);

        when(reservationRepository.findByStatusAndExpiresAtLessThanEqual(eq(ReservationStatus.ACTIVE), any(LocalDateTime.class)))
                .thenReturn(List.of(expiredReservation));

        int expiredCount = futureService.expireOldReservations();

        assertEquals(1, expiredCount);
        assertEquals(ReservationStatus.EXPIRED, expiredReservation.getStatus());
        assertEquals(ComponentStatus.AVAILABLE, sampleComponent.getStatus());
        verify(componentRepository).save(sampleComponent);
        verify(reservationRepository).save(expiredReservation);
    }

    @Test
    void shouldNotRestoreComponentToAvailableIfAlreadyExchangedOnExpiry() {
        Clock futureClock = Clock.offset(fixedClock, Duration.ofHours(25));
        ReservationService futureService = new ReservationService(
                reservationRepository, componentRepository, userRepository, futureClock, 24L
        );

        sampleComponent.setStatus(ComponentStatus.EXCHANGED);
        Reservation reservation = new Reservation(
                sampleComponent, buyer, LocalDateTime.now(fixedClock).plusHours(24), ReservationStatus.ACTIVE
        );
        reservation.setId(89L);

        when(reservationRepository.findByStatusAndExpiresAtLessThanEqual(eq(ReservationStatus.ACTIVE), any(LocalDateTime.class)))
                .thenReturn(List.of(reservation));

        futureService.expireOldReservations();

        assertEquals(ReservationStatus.EXPIRED, reservation.getStatus());
        assertEquals(ComponentStatus.EXCHANGED, sampleComponent.getStatus(), "Exchanged status must be preserved");
        verify(componentRepository, never()).save(sampleComponent);
    }

    @Test
    void shouldNeverDeleteReservationRecordsDuringCancellationOrExpiration() {
        sampleComponent.setStatus(ComponentStatus.RESERVED);
        Reservation reservation = new Reservation(
                sampleComponent, buyer, LocalDateTime.now(fixedClock).plusHours(24), ReservationStatus.ACTIVE
        );
        reservation.setId(10L);

        when(userRepository.findByEmail("buyer@eng.pdn.ac.lk")).thenReturn(Optional.of(buyer));
        when(reservationRepository.findById(10L)).thenReturn(Optional.of(reservation));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> inv.getArgument(0));

        reservationService.cancelReservation(10L, "buyer@eng.pdn.ac.lk");

        // Verify that delete was NEVER called
        verify(reservationRepository, never()).delete(any(Reservation.class));
        verify(reservationRepository, never()).deleteById(any());
        verify(reservationRepository, never()).deleteAll();
    }

    @Test
    void shouldNeverExposeSellerContactForExpiredReservationInDtoEvenIfActiveInEntity() {
        // Entity status is ACTIVE, but expiresAt is now (boundary) or past
        LocalDateTime expiredTime = LocalDateTime.now(fixedClock).minusSeconds(1);
        Reservation reservation = new Reservation(
                sampleComponent, buyer, expiredTime, ReservationStatus.ACTIVE
        );
        reservation.setId(123L);

        ReservationResponse dto = ReservationResponse.fromEntity(reservation, LocalDateTime.now(fixedClock));

        assertEquals(ReservationStatus.EXPIRED, dto.getStatus(), "DTO must report EXPIRED status");
        assertNull(dto.getSellerContact(), "Seller contact MUST be null for expired reservations");
    }
}
