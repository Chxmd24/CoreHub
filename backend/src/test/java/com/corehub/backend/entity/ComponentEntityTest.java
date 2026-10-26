package com.corehub.backend.entity;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

class ComponentEntityTest {

    @Test
    void shouldCreateComponentWithSellAttributes() {
        User owner = new User("STU12345", "Alice Smith", "alice@university.edu",
                "$2a$10$hash", "0771234567", "ECE", Role.USER);
        owner.setId(1L);

        Component component = new Component(
                "Arduino Uno R3",
                "Original ATmega328P microcontroller board",
                "Microcontrollers",
                "ATmega328P, 16MHz, 14 Digital I/O, 6 Analog",
                ListingType.SELL,
                new BigDecimal("25.00"),
                ComponentStatus.AVAILABLE,
                owner
        );

        assertEquals("Arduino Uno R3", component.getTitle());
        assertEquals("Microcontrollers", component.getCategory());
        assertEquals(ListingType.SELL, component.getListingType());
        assertEquals(new BigDecimal("25.00"), component.getPrice());
        assertEquals(ComponentStatus.AVAILABLE, component.getStatus());
        assertEquals(owner, component.getOwner());
    }

    @Test
    void shouldSupportSwapOrBorrowWithNullPrice() {
        User owner = new User();
        owner.setId(2L);

        Component component = new Component(
                "Digital Oscilloscope 100MHz",
                "2-channel portable oscilloscope for lab experiments",
                "Lab Equipment",
                "100MHz, 1GSa/s",
                ListingType.BORROW,
                null,
                ComponentStatus.AVAILABLE,
                owner
        );

        assertNull(component.getPrice(), "Price can be null for borrowing or swapping");
        assertEquals(ListingType.BORROW, component.getListingType());
    }

    @Test
    void prePersistAndPreUpdateShouldSetTimestamps() {
        Component component = new Component();
        component.setTitle("STM32 Nucleo Board");

        assertNull(component.getCreatedAt());
        assertNull(component.getUpdatedAt());

        component.onCreate();

        assertNotNull(component.getCreatedAt());
        assertNotNull(component.getUpdatedAt());
        assertEquals(ComponentStatus.AVAILABLE, component.getStatus());

        component.onUpdate();
        assertNotNull(component.getUpdatedAt());
    }
}
