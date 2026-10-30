package com.corehub.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class ModerateListingRequest {

    @NotBlank(message = "Action is required")
    @Pattern(regexp = "^(?i)(SUSPEND|REINSTATE)$", message = "Action must be SUSPEND or REINSTATE")
    private String action;

    private String reason;

    public ModerateListingRequest() {
    }

    public ModerateListingRequest(String action, String reason) {
        this.action = action;
        this.reason = reason;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
