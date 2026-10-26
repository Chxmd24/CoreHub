package com.corehub.backend.repository;

import com.corehub.backend.entity.Reservation;
import com.corehub.backend.entity.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    List<Reservation> findByReservedById(Long userId);

    List<Reservation> findByReservedByIdOrderByReservedAtDesc(Long userId);

    List<Reservation> findByComponentOwnerIdOrderByReservedAtDesc(Long ownerId);

    List<Reservation> findByComponentId(Long componentId);

    List<Reservation> findByStatus(ReservationStatus status);

    List<Reservation> findByStatusAndExpiresAtBefore(ReservationStatus status, LocalDateTime expiresAt);

    List<Reservation> findByStatusAndExpiresAtLessThanEqual(ReservationStatus status, LocalDateTime expiresAt);

    Optional<Reservation> findByComponentIdAndStatus(Long componentId, ReservationStatus status);

    boolean existsByComponentIdAndStatus(Long componentId, ReservationStatus status);
}
