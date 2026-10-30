package com.corehub.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "system_locks")
public class SystemLock {

    @Id
    @Column(name = "lock_key", nullable = false, length = 50)
    private String lockKey;

    @Column(name = "locked_at")
    private LocalDateTime lockedAt;

    @Column(name = "description", length = 255)
    private String description;

    public SystemLock() {
    }

    public SystemLock(String lockKey, String description) {
        this.lockKey = lockKey;
        this.description = description;
        this.lockedAt = LocalDateTime.now();
    }

    public String getLockKey() {
        return lockKey;
    }

    public void setLockKey(String lockKey) {
        this.lockKey = lockKey;
    }

    public LocalDateTime getLockedAt() {
        return lockedAt;
    }

    public void setLockedAt(LocalDateTime lockedAt) {
        this.lockedAt = lockedAt;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
