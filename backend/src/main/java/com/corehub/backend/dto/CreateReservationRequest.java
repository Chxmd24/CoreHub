package com.corehub.backend.dto;

import jakarta.validation.constraints.NotNull;

public class CreateReservationRequest {

    @NotNull(message = "Component ID is required")
    private Long componentId;

    public CreateReservationRequest() {
    }

    public CreateReservationRequest(Long componentId) {
        this.componentId = componentId;
    }

    public Long getComponentId() {
        return componentId;
    }

    public void setComponentId(Long componentId) {
        this.componentId = componentId;
    }
}
