package com.corehub.backend.dto;

import com.corehub.backend.entity.Component;
import com.corehub.backend.entity.ComponentStatus;
import com.corehub.backend.entity.ListingType;
import com.corehub.backend.entity.ModerationStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class AdminListingResponse {

    private Long id;
    private String title;
    private String category;
    private ListingType listingType;
    private BigDecimal price;
    private ComponentStatus status;
    private ModerationStatus moderationStatus;
    private String moderationReason;
    private LocalDateTime moderatedAt;
    private String moderatedBy;
    private Long ownerId;
    private String ownerName;
    private String ownerEmail;
    private LocalDateTime createdAt;

    public AdminListingResponse() {
    }

    public AdminListingResponse(Long id, String title, String category, ListingType listingType,
                                BigDecimal price, ComponentStatus status, ModerationStatus moderationStatus,
                                String moderationReason, LocalDateTime moderatedAt, String moderatedBy,
                                Long ownerId, String ownerName, String ownerEmail, LocalDateTime createdAt) {
        this.id = id;
        this.title = title;
        this.category = category;
        this.listingType = listingType;
        this.price = price;
        this.status = status;
        this.moderationStatus = moderationStatus;
        this.moderationReason = moderationReason;
        this.moderatedAt = moderatedAt;
        this.moderatedBy = moderatedBy;
        this.ownerId = ownerId;
        this.ownerName = ownerName;
        this.ownerEmail = ownerEmail;
        this.createdAt = createdAt;
    }

    public static AdminListingResponse fromEntity(Component component) {
        if (component == null) return null;
        Long ownerId = (component.getOwner() != null) ? component.getOwner().getId() : null;
        String ownerName = (component.getOwner() != null) ? component.getOwner().getName() : null;
        String ownerEmail = (component.getOwner() != null) ? component.getOwner().getEmail() : null;

        return new AdminListingResponse(
                component.getId(),
                component.getTitle(),
                component.getCategory(),
                component.getListingType(),
                component.getPrice(),
                component.getStatus(),
                component.getModerationStatus(),
                component.getModerationReason(),
                component.getModeratedAt(),
                component.getModeratedBy(),
                ownerId,
                ownerName,
                ownerEmail,
                component.getCreatedAt()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public ListingType getListingType() {
        return listingType;
    }

    public void setListingType(ListingType listingType) {
        this.listingType = listingType;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public ComponentStatus getStatus() {
        return status;
    }

    public void setStatus(ComponentStatus status) {
        this.status = status;
    }

    public ModerationStatus getModerationStatus() {
        return moderationStatus;
    }

    public void setModerationStatus(ModerationStatus moderationStatus) {
        this.moderationStatus = moderationStatus;
    }

    public String getModerationReason() {
        return moderationReason;
    }

    public void setModerationReason(String moderationReason) {
        this.moderationReason = moderationReason;
    }

    public LocalDateTime getModeratedAt() {
        return moderatedAt;
    }

    public void setModeratedAt(LocalDateTime moderatedAt) {
        this.moderatedAt = moderatedAt;
    }

    public String getModeratedBy() {
        return moderatedBy;
    }

    public void setModeratedBy(String moderatedBy) {
        this.moderatedBy = moderatedBy;
    }

    public Long getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(Long ownerId) {
        this.ownerId = ownerId;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public void setOwnerName(String ownerName) {
        this.ownerName = ownerName;
    }

    public String getOwnerEmail() {
        return ownerEmail;
    }

    public void setOwnerEmail(String ownerEmail) {
        this.ownerEmail = ownerEmail;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
