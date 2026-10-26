package com.corehub.backend.repository;

import com.corehub.backend.entity.Reservation;
import com.corehub.backend.entity.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    List<Reservation> findByReservedById(Long userId);

    List<Reservation> findByComponentId(Long componentId);

    List<Reservation> findByStatus(ReservationStatus status);

    Optional<Reservation> findByComponentIdAndStatus(Long componentId, ReservationStatus status);
}
