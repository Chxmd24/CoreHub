package com.corehub.backend.dto;

import com.corehub.backend.entity.AdminAuditLog;

import java.time.LocalDateTime;

public class AdminAuditLogResponse {

    private Long id;
    private Long actorId;
    private String actorEmail;
    private String actorRole;
    private String action;
    private String targetType;
    private Long targetId;
    private String details;
    private LocalDateTime timestamp;

    public AdminAuditLogResponse() {
    }

    public AdminAuditLogResponse(Long id, Long actorId, String actorEmail, String actorRole,
                                 String action, String targetType, Long targetId,
                                 String details, LocalDateTime timestamp) {
        this.id = id;
        this.actorId = actorId;
        this.actorEmail = actorEmail;
        this.actorRole = actorRole;
        this.action = action;
        this.targetType = targetType;
        this.targetId = targetId;
        this.details = details;
        this.timestamp = timestamp;
    }

    public static AdminAuditLogResponse fromEntity(AdminAuditLog log) {
        if (log == null) return null;
        return new AdminAuditLogResponse(
                log.getId(),
                log.getActorId(),
                log.getActorEmail(),
                log.getActorRole(),
                log.getAction(),
                log.getTargetType(),
                log.getTargetId(),
                log.getDetails(),
                log.getTimestamp()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getActorId() {
        return actorId;
    }

    public void setActorId(Long actorId) {
        this.actorId = actorId;
    }

    public String getActorEmail() {
        return actorEmail;
    }

    public void setActorEmail(String actorEmail) {
        this.actorEmail = actorEmail;
    }

    public String getActorRole() {
        return actorRole;
    }

    public void setActorRole(String actorRole) {
        this.actorRole = actorRole;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getTargetType() {
        return targetType;
    }

    public void setTargetType(String targetType) {
        this.targetType = targetType;
    }

    public Long getTargetId() {
        return targetId;
    }

    public void setTargetId(Long targetId) {
        this.targetId = targetId;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
