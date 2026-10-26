package com.corehub.backend.controller;

import com.corehub.backend.dto.CreateReservationRequest;
import com.corehub.backend.dto.ReservationResponse;
import com.corehub.backend.service.ReservationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @PostMapping
    public ResponseEntity<ReservationResponse> createReservation(
            @Valid @RequestBody CreateReservationRequest request,
            Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        ReservationResponse response = reservationService.createReservation(request.getComponentId(), principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/mine")
    public ResponseEntity<List<ReservationResponse>> getMyReservations(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<ReservationResponse> response = reservationService.getMyReservations(principal.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/received")
    public ResponseEntity<List<ReservationResponse>> getReceivedReservations(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<ReservationResponse> response = reservationService.getReceivedReservations(principal.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReservationResponse> getReservationById(
            @PathVariable Long id,
            Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        ReservationResponse response = reservationService.getReservationById(id, principal.getName());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<ReservationResponse> cancelReservation(
            @PathVariable Long id,
            Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        ReservationResponse response = reservationService.cancelReservation(id, principal.getName());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<ReservationResponse> completeReservation(
            @PathVariable Long id,
            Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        ReservationResponse response = reservationService.completeReservation(id, principal.getName());
        return ResponseEntity.ok(response);
    }
}
