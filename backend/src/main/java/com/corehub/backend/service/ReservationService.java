package com.corehub.backend.service;

import com.corehub.backend.dto.ReservationResponse;
import com.corehub.backend.entity.Component;
import com.corehub.backend.entity.ComponentStatus;
import com.corehub.backend.entity.Reservation;
import com.corehub.backend.entity.ReservationStatus;
import com.corehub.backend.entity.User;
import com.corehub.backend.exception.ConflictException;
import com.corehub.backend.exception.ResourceNotFoundException;
import com.corehub.backend.repository.ComponentRepository;
import com.corehub.backend.repository.ReservationRepository;
import com.corehub.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(noRollbackFor = ConflictException.class)
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final ComponentRepository componentRepository;
    private final UserRepository userRepository;
    private final Clock clock;
    private final long expiryHours;

    public ReservationService(
            ReservationRepository reservationRepository,
            ComponentRepository componentRepository,
            UserRepository userRepository,
            Clock clock,
            @Value("${app.reservation.expiry-hours:24}") long expiryHours) {
        this.reservationRepository = reservationRepository;
        this.componentRepository = componentRepository;
        this.userRepository = userRepository;
        this.clock = clock;
        this.expiryHours = expiryHours;
    }

    private boolean isExpired(Reservation reservation, LocalDateTime now) {
        return reservation.getExpiresAt() != null && !reservation.getExpiresAt().isAfter(now);
    }

    private void expireReservationIfOverdue(Reservation reservation, LocalDateTime now) {
        if (reservation.getStatus() == ReservationStatus.ACTIVE && isExpired(reservation, now)) {
            reservation.setStatus(ReservationStatus.EXPIRED);
            Component component = reservation.getComponent();
            if (component != null && component.getStatus() == ComponentStatus.RESERVED) {
                component.setStatus(ComponentStatus.AVAILABLE);
                component.setUpdatedAt(now);
                componentRepository.saveAndFlush(component);
            }
            reservationRepository.saveAndFlush(reservation);
        }
    }

    public ReservationResponse createReservation(Long componentId, String userEmail) {
        User requester = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        // Use pessimistic lock to prevent concurrent double-booking
        Component component = componentRepository.findByIdWithLock(componentId)
                .orElseThrow(() -> new ResourceNotFoundException("Component listing not found with ID: " + componentId));

        if (component.getOwner().getId().equals(requester.getId())) {
            throw new IllegalArgumentException("You cannot reserve your own listing");
        }

        LocalDateTime now = LocalDateTime.now(clock);

        // Passively expire any overdue active reservation on this component before evaluating availability
        reservationRepository.findByComponentIdAndStatus(component.getId(), ReservationStatus.ACTIVE)
                .ifPresent(existingActive -> expireReservationIfOverdue(existingActive, now));

        if (component.getStatus() != ComponentStatus.AVAILABLE) {
            throw new ConflictException("Listing is not available for reservation (current status: " + component.getStatus() + ")");
        }

        if (reservationRepository.existsByComponentIdAndStatus(component.getId(), ReservationStatus.ACTIVE)) {
            throw new ConflictException("Listing already has an active reservation");
        }

        LocalDateTime expiresAt = now.plusHours(expiryHours);

        Reservation reservation = new Reservation(
                component,
                requester,
                expiresAt,
                ReservationStatus.ACTIVE
        );
        reservation.setReservedAt(now);

        component.setStatus(ComponentStatus.RESERVED);
        component.setUpdatedAt(now);
        componentRepository.save(component);

        Reservation saved = reservationRepository.save(reservation);
        return ReservationResponse.fromEntity(saved, now);
    }

    public List<ReservationResponse> getMyReservations(String userEmail) {
        User requester = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        LocalDateTime now = LocalDateTime.now(clock);
        List<Reservation> reservations = reservationRepository.findByReservedByIdOrderByReservedAtDesc(requester.getId());
        for (Reservation reservation : reservations) {
            expireReservationIfOverdue(reservation, now);
        }
        return reservations.stream()
                .map(r -> ReservationResponse.fromEntity(r, now))
                .collect(Collectors.toList());
    }

    public List<ReservationResponse> getReceivedReservations(String userEmail) {
        User owner = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        LocalDateTime now = LocalDateTime.now(clock);
        List<Reservation> reservations = reservationRepository.findByComponentOwnerIdOrderByReservedAtDesc(owner.getId());
        for (Reservation reservation : reservations) {
            expireReservationIfOverdue(reservation, now);
        }
        return reservations.stream()
                .map(r -> ReservationResponse.fromEntity(r, now))
                .collect(Collectors.toList());
    }

    public ReservationResponse getReservationById(Long id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with ID: " + id));

        boolean isRequester = reservation.getReservedBy().getId().equals(user.getId());
        boolean isOwner = reservation.getComponent().getOwner().getId().equals(user.getId());

        if (!isRequester && !isOwner) {
            throw new AccessDeniedException("You are not authorized to view this reservation");
        }

        LocalDateTime now = LocalDateTime.now(clock);
        expireReservationIfOverdue(reservation, now);

        return ReservationResponse.fromEntity(reservation, now);
    }

    public ReservationResponse cancelReservation(Long id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with ID: " + id));

        boolean isRequester = reservation.getReservedBy().getId().equals(user.getId());
        boolean isOwner = reservation.getComponent().getOwner().getId().equals(user.getId());

        if (!isRequester && !isOwner) {
            throw new AccessDeniedException("You are not authorized to cancel this reservation");
        }

        LocalDateTime now = LocalDateTime.now(clock);

        if (reservation.getStatus() != ReservationStatus.ACTIVE) {
            throw new ConflictException("Only ACTIVE reservations can be cancelled (current status: " + reservation.getStatus() + ")");
        }

        // If it expired before cancel was requested
        if (isExpired(reservation, now)) {
            expireReservationIfOverdue(reservation, now);
            throw new ConflictException("Reservation has expired and cannot be cancelled");
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        Component component = reservation.getComponent();
        if (component != null && component.getStatus() == ComponentStatus.RESERVED) {
            component.setStatus(ComponentStatus.AVAILABLE);
            component.setUpdatedAt(now);
            componentRepository.save(component);
        }

        Reservation updated = reservationRepository.save(reservation);
        return ReservationResponse.fromEntity(updated, now);
    }

    public ReservationResponse completeReservation(Long id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with ID: " + id));

        boolean isOwner = reservation.getComponent().getOwner().getId().equals(user.getId());
        if (!isOwner) {
            throw new AccessDeniedException("Only the listing owner can complete a reservation");
        }

        LocalDateTime now = LocalDateTime.now(clock);

        if (reservation.getStatus() != ReservationStatus.ACTIVE) {
            throw new ConflictException("Only ACTIVE reservations can be completed (current status: " + reservation.getStatus() + ")");
        }

        if (isExpired(reservation, now)) {
            expireReservationIfOverdue(reservation, now);
            throw new ConflictException("Reservation has expired and cannot be completed");
        }

        reservation.setStatus(ReservationStatus.COMPLETED);
        Component component = reservation.getComponent();
        if (component != null) {
            component.setStatus(ComponentStatus.EXCHANGED);
            component.setUpdatedAt(now);
            componentRepository.save(component);
        }

        Reservation updated = reservationRepository.save(reservation);
        return ReservationResponse.fromEntity(updated, now);
    }

    public int expireOldReservations() {
        LocalDateTime now = LocalDateTime.now(clock);
        List<Reservation> expiredReservations = reservationRepository
                .findByStatusAndExpiresAtLessThanEqual(ReservationStatus.ACTIVE, now);

        int count = 0;
        for (Reservation reservation : expiredReservations) {
            reservation.setStatus(ReservationStatus.EXPIRED);
            Component component = reservation.getComponent();
            if (component != null && component.getStatus() == ComponentStatus.RESERVED) {
                component.setStatus(ComponentStatus.AVAILABLE);
                component.setUpdatedAt(now);
                componentRepository.save(component);
            }
            reservationRepository.save(reservation);
            count++;
        }
        return count;
    }
}
