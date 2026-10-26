package com.corehub.backend.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReservationExpirySchedulerTest {

    @Mock
    private ReservationService reservationService;

    @InjectMocks
    private ReservationExpiryScheduler scheduler;

    @Test
    void shouldCallExpireOldReservations() {
        when(reservationService.expireOldReservations()).thenReturn(3);

        scheduler.runExpiryCheck();

        verify(reservationService).expireOldReservations();
    }

    @Test
    void shouldHandleExceptionGracefully() {
        when(reservationService.expireOldReservations()).thenThrow(new RuntimeException("Database error"));

        // Should not throw or crash
        scheduler.runExpiryCheck();

        verify(reservationService).expireOldReservations();
    }
}
