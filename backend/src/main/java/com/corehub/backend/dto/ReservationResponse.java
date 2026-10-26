package com.corehub.backend.dto;

import com.corehub.backend.entity.Component;
import com.corehub.backend.entity.Reservation;
import com.corehub.backend.entity.ReservationStatus;
import com.corehub.backend.entity.User;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ReservationResponse {

    private Long id;
    private Long componentId;
    private String componentTitle;
    private String componentCategory;
    private String listingType;
    private BigDecimal price;

    private Long reservedById;
    private String reservedByName;

    private Long ownerId;
    private String ownerName;

    private LocalDateTime reservedAt;
    private LocalDateTime expiresAt;
    private ReservationStatus status;

    private SellerContactResponse sellerContact;

    public ReservationResponse() {
    }

    public ReservationResponse(Long id, Long componentId, String componentTitle, String componentCategory,
                               String listingType, BigDecimal price, Long reservedById, String reservedByName,
                               Long ownerId, String ownerName, LocalDateTime reservedAt, LocalDateTime expiresAt,
                               ReservationStatus status, SellerContactResponse sellerContact) {
        this.id = id;
        this.componentId = componentId;
        this.componentTitle = componentTitle;
        this.componentCategory = componentCategory;
        this.listingType = listingType;
        this.price = price;
        this.reservedById = reservedById;
        this.reservedByName = reservedByName;
        this.ownerId = ownerId;
        this.ownerName = ownerName;
        this.reservedAt = reservedAt;
        this.expiresAt = expiresAt;
        this.status = status;
        this.sellerContact = sellerContact;
    }

    public static ReservationResponse fromEntity(Reservation reservation, LocalDateTime now) {
        if (reservation == null) {
            return null;
        }

        Component component = reservation.getComponent();
        User owner = (component != null) ? component.getOwner() : null;
        User reservedBy = reservation.getReservedBy();

        boolean isExpired = reservation.getExpiresAt() != null && !reservation.getExpiresAt().isAfter(now);
        ReservationStatus effectiveStatus = reservation.getStatus();
        if (effectiveStatus == ReservationStatus.ACTIVE && isExpired) {
            effectiveStatus = ReservationStatus.EXPIRED;
        }

        boolean showContact = (effectiveStatus == ReservationStatus.ACTIVE) && !isExpired;

        SellerContactResponse contact = null;
        if (showContact && owner != null) {
            contact = new SellerContactResponse(
                    owner.getName(),
                    owner.getEmail(),
                    owner.getPhone(),
                    owner.getDepartment(),
                    owner.getStudentId()
            );
        }

        return new ReservationResponse(
                reservation.getId(),
                (component != null) ? component.getId() : null,
                (component != null) ? component.getTitle() : null,
                (component != null) ? component.getCategory() : null,
                (component != null && component.getListingType() != null) ? component.getListingType().name() : null,
                (component != null) ? component.getPrice() : null,
                (reservedBy != null) ? reservedBy.getId() : null,
                (reservedBy != null) ? reservedBy.getName() : null,
                (owner != null) ? owner.getId() : null,
                (owner != null) ? owner.getName() : null,
                reservation.getReservedAt(),
                reservation.getExpiresAt(),
                effectiveStatus,
                contact
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getComponentId() {
        return componentId;
    }

    public void setComponentId(Long componentId) {
        this.componentId = componentId;
    }

    public String getComponentTitle() {
        return componentTitle;
    }

    public void setComponentTitle(String componentTitle) {
        this.componentTitle = componentTitle;
    }

    public String getComponentCategory() {
        return componentCategory;
    }

    public void setComponentCategory(String componentCategory) {
        this.componentCategory = componentCategory;
    }

    public String getListingType() {
        return listingType;
    }

    public void setListingType(String listingType) {
        this.listingType = listingType;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Long getReservedById() {
        return reservedById;
    }

    public void setReservedById(Long reservedById) {
        this.reservedById = reservedById;
    }

    public String getReservedByName() {
        return reservedByName;
    }

    public void setReservedByName(String reservedByName) {
        this.reservedByName = reservedByName;
    }

    public Long getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(Long ownerId) {
        this.ownerId = ownerId;
    }

    public Long getComponentOwnerId() {
        return ownerId;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public void setOwnerName(String ownerName) {
        this.ownerName = ownerName;
    }

    public String getComponentOwnerName() {
        return ownerName;
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

    public SellerContactResponse getSellerContact() {
        return sellerContact;
    }

    public void setSellerContact(SellerContactResponse sellerContact) {
        this.sellerContact = sellerContact;
    }
}
