package com.corehub.backend.repository;

import com.corehub.backend.entity.Component;
import com.corehub.backend.entity.ComponentStatus;
import com.corehub.backend.entity.ListingType;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ComponentRepository extends JpaRepository<Component, Long>, JpaSpecificationExecutor<Component> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Component c WHERE c.id = :id")
    Optional<Component> findByIdWithLock(@Param("id") Long id);

    List<Component> findByOwnerId(Long ownerId);

    List<Component> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);

    Page<Component> findByOwnerId(Long ownerId, Pageable pageable);

    List<Component> findByStatus(ComponentStatus status);

    List<Component> findByCategory(String category);

    List<Component> findByListingType(ListingType listingType);

    List<Component> findByStatusAndListingType(ComponentStatus status, ListingType listingType);
}
