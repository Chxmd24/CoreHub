package com.corehub.backend.dto;

public class AdminOverviewResponse {

    private long totalUsers;
    private long totalAdmins;
    private long totalSuperAdmins;

    private long totalListings;
    private long availableListings;
    private long reservedListings;
    private long exchangedListings;
    private long moderatedListings;

    private long totalReservations;
    private long activeReservations;
    private long completedReservations;
    private long cancelledReservations;
    private long expiredReservations;

    private long totalAuditLogs;

    public AdminOverviewResponse() {
    }

    public AdminOverviewResponse(long totalUsers, long totalAdmins, long totalSuperAdmins,
                                 long totalListings, long availableListings, long reservedListings,
                                 long exchangedListings, long moderatedListings,
                                 long totalReservations, long activeReservations,
                                 long completedReservations, long cancelledReservations,
                                 long expiredReservations, long totalAuditLogs) {
        this.totalUsers = totalUsers;
        this.totalAdmins = totalAdmins;
        this.totalSuperAdmins = totalSuperAdmins;
        this.totalListings = totalListings;
        this.availableListings = availableListings;
        this.reservedListings = reservedListings;
        this.exchangedListings = exchangedListings;
        this.moderatedListings = moderatedListings;
        this.totalReservations = totalReservations;
        this.activeReservations = activeReservations;
        this.completedReservations = completedReservations;
        this.cancelledReservations = cancelledReservations;
        this.expiredReservations = expiredReservations;
        this.totalAuditLogs = totalAuditLogs;
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getTotalAdmins() {
        return totalAdmins;
    }

    public void setTotalAdmins(long totalAdmins) {
        this.totalAdmins = totalAdmins;
    }

    public long getTotalSuperAdmins() {
        return totalSuperAdmins;
    }

    public void setTotalSuperAdmins(long totalSuperAdmins) {
        this.totalSuperAdmins = totalSuperAdmins;
    }

    public long getTotalListings() {
        return totalListings;
    }

    public void setTotalListings(long totalListings) {
        this.totalListings = totalListings;
    }

    public long getAvailableListings() {
        return availableListings;
    }

    public void setAvailableListings(long availableListings) {
        this.availableListings = availableListings;
    }

    public long getReservedListings() {
        return reservedListings;
    }

    public void setReservedListings(long reservedListings) {
        this.reservedListings = reservedListings;
    }

    public long getExchangedListings() {
        return exchangedListings;
    }

    public void setExchangedListings(long exchangedListings) {
        this.exchangedListings = exchangedListings;
    }

    public long getModeratedListings() {
        return moderatedListings;
    }

    public void setModeratedListings(long moderatedListings) {
        this.moderatedListings = moderatedListings;
    }

    public long getTotalReservations() {
        return totalReservations;
    }

    public void setTotalReservations(long totalReservations) {
        this.totalReservations = totalReservations;
    }

    public long getActiveReservations() {
        return activeReservations;
    }

    public void setActiveReservations(long activeReservations) {
        this.activeReservations = activeReservations;
    }

    public long getCompletedReservations() {
        return completedReservations;
    }

    public void setCompletedReservations(long completedReservations) {
        this.completedReservations = completedReservations;
    }

    public long getCancelledReservations() {
        return cancelledReservations;
    }

    public void setCancelledReservations(long cancelledReservations) {
        this.cancelledReservations = cancelledReservations;
    }

    public long getExpiredReservations() {
        return expiredReservations;
    }

    public void setExpiredReservations(long expiredReservations) {
        this.expiredReservations = expiredReservations;
    }

    public long getTotalAuditLogs() {
        return totalAuditLogs;
    }

    public void setTotalAuditLogs(long totalAuditLogs) {
        this.totalAuditLogs = totalAuditLogs;
    }
}
