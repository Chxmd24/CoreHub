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
import com.corehub.backend.repository.ComponentRepository;
import com.corehub.backend.repository.ReservationRepository;
import com.corehub.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:corehub_tx_test;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.show-sql=false",
        "app.jwt.secret=Q29yZUh1YlRlc3RTZWNyZXRLZXkzMkJ5dGVzTG9uZyE=",
        "app.reservation.expiry-hours=24"
})
class ReservationTransactionalIntegrationTest {

    @Autowired
    private ReservationService reservationService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ComponentRepository componentRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private TransactionTemplate transactionTemplate;

    @Autowired
    private Clock clock;

    private User seller;
    private User buyer;

    @BeforeEach
    void setUp() {
        reservationRepository.deleteAll();
        componentRepository.deleteAll();
        userRepository.deleteAll();

        seller = new User("E/20/001", "Alice Seller", "seller@eng.pdn.ac.lk", "hash1", "0771111111", "ECE", Role.USER);
        seller = userRepository.save(seller);

        buyer = new User("E/20/002", "Bob Buyer", "buyer@eng.pdn.ac.lk", "hash2", "0772222222", "MECH", Role.USER);
        buyer = userRepository.save(buyer);
    }

    @Test
    void shouldPersistExpiredStatusAndRestoreComponentWhenOverdueCancellationThrowsConflict() {
        // Arrange: Component is RESERVED with an ACTIVE reservation whose expiresAt is in the past
        Component component = new Component(
                "Arduino Uno R3",
                "Working board",
                "Microcontrollers",
                "ATmega328P",
                ListingType.SELL,
                new BigDecimal("2500.00"),
                ComponentStatus.RESERVED,
                seller
        );
        component = componentRepository.save(component);

        LocalDateTime now = LocalDateTime.now(clock);
        LocalDateTime pastExpiry = now.minusHours(2);

        Reservation reservation = new Reservation(
                component,
                buyer,
                pastExpiry,
                ReservationStatus.ACTIVE
        );
        reservation.setReservedAt(now.minusHours(26));
        reservation = reservationRepository.save(reservation);
        Long reservationId = reservation.getId();
        Long componentId = component.getId();

        // Act: Cancellation must throw ConflictException
        ConflictException ex = assertThrows(ConflictException.class, () ->
                reservationService.cancelReservation(reservationId, "buyer@eng.pdn.ac.lk")
        );
        assertEquals("Reservation has expired and cannot be cancelled", ex.getMessage());

        // Assert: In a fresh transaction, verify that changes were COMMITTED and NOT rolled back
        transactionTemplate.executeWithoutResult(status -> {
            Reservation reloadedReservation = reservationRepository.findById(reservationId).orElseThrow();
            assertEquals(ReservationStatus.EXPIRED, reloadedReservation.getStatus(),
                    "Overdue reservation must be committed as EXPIRED in the database");

            Component reloadedComponent = componentRepository.findById(componentId).orElseThrow();
            assertEquals(ComponentStatus.AVAILABLE, reloadedComponent.getStatus(),
                    "Component availability must be committed as AVAILABLE in the database");

            // Verify privacy: seller contact info is hidden for expired reservation
            ReservationResponse responseDto = ReservationResponse.fromEntity(reloadedReservation, now);
            assertNotNull(responseDto);
            assertEquals(ReservationStatus.EXPIRED, responseDto.getStatus());
            assertNull(responseDto.getSellerContact(), "Seller contact must not be exposed for expired reservations");
        });
    }

    @Test
    void shouldPersistExpiredStatusAndRestoreComponentWhenOverdueCompletionThrowsConflict() {
        // Arrange: Component is RESERVED with an ACTIVE reservation whose expiresAt is in the past
        Component component = new Component(
                "Raspberry Pi 4",
                "4GB Model",
                "Embedded Systems",
                "Broadcom BCM2711",
                ListingType.SELL,
                new BigDecimal("15000.00"),
                ComponentStatus.RESERVED,
                seller
        );
        component = componentRepository.save(component);

        LocalDateTime now = LocalDateTime.now(clock);
        LocalDateTime pastExpiry = now.minusHours(1);

        Reservation reservation = new Reservation(
                component,
                buyer,
                pastExpiry,
                ReservationStatus.ACTIVE
        );
        reservation.setReservedAt(now.minusHours(25));
        reservation = reservationRepository.save(reservation);
        Long reservationId = reservation.getId();
        Long componentId = component.getId();

        // Act: Completion must throw ConflictException
        ConflictException ex = assertThrows(ConflictException.class, () ->
                reservationService.completeReservation(reservationId, "seller@eng.pdn.ac.lk")
        );
        assertEquals("Reservation has expired and cannot be completed", ex.getMessage());

        // Assert: In a fresh transaction, verify that updates were COMMITTED and NOT rolled back
        transactionTemplate.executeWithoutResult(status -> {
            Reservation reloadedReservation = reservationRepository.findById(reservationId).orElseThrow();
            assertEquals(ReservationStatus.EXPIRED, reloadedReservation.getStatus(),
                    "Overdue reservation must be committed as EXPIRED in the database");

            Component reloadedComponent = componentRepository.findById(componentId).orElseThrow();
            assertEquals(ComponentStatus.AVAILABLE, reloadedComponent.getStatus(),
                    "Component availability must be committed as AVAILABLE in the database");

            // Verify privacy: seller contact info is hidden for expired reservation
            ReservationResponse responseDto = ReservationResponse.fromEntity(reloadedReservation, now);
            assertNotNull(responseDto);
            assertEquals(ReservationStatus.EXPIRED, responseDto.getStatus());
            assertNull(responseDto.getSellerContact(), "Seller contact must not be exposed for expired reservations");
        });
    }
}
