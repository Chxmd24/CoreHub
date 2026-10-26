package com.corehub.backend.entity;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

class ReservationEntityTest {

    @Test
    void shouldCreateReservationWithAssociations() {
        User student = new User("STU54321", "Bob White", "bob@university.edu",
                "$2a$10$hash", "0719876543", "Mechanical", Role.USER);
        student.setId(10L);

        Component component = new Component();
        component.setId(20L);
        component.setTitle("Multimeter Fluke 117");

        LocalDateTime expires = LocalDateTime.now().plusDays(3);

        Reservation reservation = new Reservation(component, student, expires, ReservationStatus.ACTIVE);

        assertEquals(component, reservation.getComponent());
        assertEquals(student, reservation.getReservedBy());
        assertEquals(expires, reservation.getExpiresAt());
        assertEquals(ReservationStatus.ACTIVE, reservation.getStatus());
    }

    @Test
    void prePersistShouldSetDefaults() {
        Reservation reservation = new Reservation();

        assertNull(reservation.getReservedAt());
        reservation.onCreate();

        assertNotNull(reservation.getReservedAt());
        assertEquals(ReservationStatus.ACTIVE, reservation.getStatus());
    }
}
