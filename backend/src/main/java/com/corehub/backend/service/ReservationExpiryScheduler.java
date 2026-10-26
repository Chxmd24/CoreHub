package com.corehub.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ReservationExpiryScheduler {

    private static final Logger log = LoggerFactory.getLogger(ReservationExpiryScheduler.class);

    private final ReservationService reservationService;

    public ReservationExpiryScheduler(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @Scheduled(fixedRateString = "${app.reservation.expiry-check-interval-ms:60000}")
    public void runExpiryCheck() {
        try {
            int expiredCount = reservationService.expireOldReservations();
            if (expiredCount > 0) {
                log.info("Reservation expiry check completed: {} reservation(s) expired", expiredCount);
            }
        } catch (Exception e) {
            log.error("Error occurred while checking for expired reservations", e);
        }
    }
}
