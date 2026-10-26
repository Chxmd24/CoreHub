package com.corehub.backend.dto;

import com.corehub.backend.entity.Component;
import com.corehub.backend.entity.ComponentStatus;
import com.corehub.backend.entity.ListingType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ComponentResponse {

    private Long id;
    private String title;
    private String description;
    private String category;
    private String specifications;
    private ListingType listingType;
    private BigDecimal price;
    private ComponentStatus status;
    private Long ownerId;
    private String ownerName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ComponentResponse() {
    }

    public ComponentResponse(Long id, String title, String description, String category,
                             String specifications, ListingType listingType, BigDecimal price,
                             ComponentStatus status, Long ownerId, String ownerName,
                             LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.category = category;
        this.specifications = specifications;
        this.listingType = listingType;
        this.price = price;
        this.status = status;
        this.ownerId = ownerId;
        this.ownerName = ownerName;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static ComponentResponse fromEntity(Component component) {
        if (component == null) {
            return null;
        }
        Long ownerId = (component.getOwner() != null) ? component.getOwner().getId() : null;
        String ownerName = (component.getOwner() != null) ? component.getOwner().getName() : null;

        return new ComponentResponse(
                component.getId(),
                component.getTitle(),
                component.getDescription(),
                component.getCategory(),
                component.getSpecifications(),
                component.getListingType(),
                component.getPrice(),
                component.getStatus(),
                ownerId,
                ownerName,
                component.getCreatedAt(),
                component.getUpdatedAt()
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getSpecifications() {
        return specifications;
    }

    public void setSpecifications(String specifications) {
        this.specifications = specifications;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
