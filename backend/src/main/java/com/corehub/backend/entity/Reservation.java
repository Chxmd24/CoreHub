package com.corehub.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(
    name = "reservations",
    indexes = {
        @Index(name = "idx_reservations_component_id", columnList = "component_id"),
        @Index(name = "idx_reservations_reserved_by_id", columnList = "reserved_by_id"),
        @Index(name = "idx_reservations_status", columnList = "status")
    }
)
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "component_id", nullable = false)
    private Component component;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reserved_by_id", nullable = false)
    private User reservedBy;

    @Column(name = "reserved_at", nullable = false)
    private LocalDateTime reservedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ReservationStatus status = ReservationStatus.ACTIVE;

    public Reservation() {
    }

    public Reservation(Component component, User reservedBy, LocalDateTime expiresAt, ReservationStatus status) {
        this.component = component;
        this.reservedBy = reservedBy;
        this.expiresAt = expiresAt;
        this.status = (status != null) ? status : ReservationStatus.ACTIVE;
    }

    @PrePersist
    protected void onCreate() {
        if (this.reservedAt == null) {
            this.reservedAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = ReservationStatus.ACTIVE;
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Component getComponent() {
        return component;
    }

    public void setComponent(Component component) {
        this.component = component;
    }

    public User getReservedBy() {
        return reservedBy;
    }

    public void setReservedBy(User reservedBy) {
        this.reservedBy = reservedBy;
    }

    public LocalDateTime getReservedAt() {
        return reservedAt;
    }

    public void setReservedAt(LocalDateTime reservedAt) {
        this.reservedAt = reservedAt;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public ReservationStatus getStatus() {
        return status;
    }

    public void setStatus(ReservationStatus status) {
        this.status = status;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Reservation that = (Reservation) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Reservation{" +
                "id=" + id +
                ", reservedAt=" + reservedAt +
                ", expiresAt=" + expiresAt +
                ", status=" + status +
                '}';
    }
}
