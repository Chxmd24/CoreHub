package com.corehub.backend.service;

import com.corehub.backend.dto.ComponentRequest;
import com.corehub.backend.dto.ComponentResponse;
import com.corehub.backend.dto.PagedResponse;
import com.corehub.backend.entity.Component;
import com.corehub.backend.entity.ComponentStatus;
import com.corehub.backend.entity.ListingType;
import com.corehub.backend.entity.Reservation;
import com.corehub.backend.entity.ReservationStatus;
import com.corehub.backend.entity.ModerationStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.corehub.backend.entity.User;
import com.corehub.backend.exception.ConflictException;
import com.corehub.backend.exception.ResourceNotFoundException;
import com.corehub.backend.repository.ComponentRepository;
import com.corehub.backend.repository.ReservationRepository;
import com.corehub.backend.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ComponentService {

    private final ComponentRepository componentRepository;
    private final UserRepository userRepository;
    private final ReservationRepository reservationRepository;

    public ComponentService(ComponentRepository componentRepository,
                            UserRepository userRepository,
                            ReservationRepository reservationRepository) {
        this.componentRepository = componentRepository;
        this.userRepository = userRepository;
        this.reservationRepository = reservationRepository;
    }

    @Transactional(readOnly = true)
    public PagedResponse<ComponentResponse> getComponents(String search,
                                                          String category,
                                                          ListingType listingType,
                                                          ComponentStatus status,
                                                          Pageable pageable) {

        Specification<Component> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Status filter: defaults to AVAILABLE when status is null
            ComponentStatus targetStatus = (status != null) ? status : ComponentStatus.AVAILABLE;
            predicates.add(cb.equal(root.get("status"), targetStatus));

            // Moderation filter: publicly visible listings must be ACTIVE (not suspended)
            predicates.add(cb.equal(root.get("moderationStatus"), ModerationStatus.ACTIVE));

            // Category filter
            if (category != null && !category.trim().isEmpty()) {
                predicates.add(cb.equal(cb.lower(root.get("category")), category.trim().toLowerCase()));
            }

            // ListingType filter
            if (listingType != null) {
                predicates.add(cb.equal(root.get("listingType"), listingType));
            }

            // Optional keyword search in title, description, or specifications
            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate titleMatch = cb.like(cb.lower(root.get("title")), pattern);
                Predicate descMatch = cb.like(cb.lower(root.get("description")), pattern);
                Predicate specMatch = cb.like(cb.lower(root.get("specifications")), pattern);
                predicates.add(cb.or(titleMatch, descMatch, specMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Component> page = componentRepository.findAll(spec, pageable);
        return PagedResponse.fromPage(page.map(ComponentResponse::fromEntity));
    }

    @Transactional(readOnly = true)
    public ComponentResponse getComponentById(Long id) {
        Component component = componentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Component listing not found with ID: " + id));

        if (component.getModerationStatus() == ModerationStatus.SUSPENDED) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            boolean isOwnerOrAdmin = false;
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
                String email = auth.getName();
                boolean isAdmin = auth.getAuthorities().stream().anyMatch(a ->
                        "ROLE_ADMIN".equals(a.getAuthority()) || "ROLE_SUPER_ADMIN".equals(a.getAuthority())
                );
                boolean isOwner = component.getOwner() != null && email.equalsIgnoreCase(component.getOwner().getEmail());
                isOwnerOrAdmin = isAdmin || isOwner;
            }
            if (!isOwnerOrAdmin) {
                throw new ResourceNotFoundException("Component listing not found with ID: " + id);
            }
        }

        return ComponentResponse.fromEntity(component);
    }

    public ComponentResponse createComponent(ComponentRequest request, String userEmail) {
        validatePricingRules(request.getListingType(), request.getPrice());

        User owner = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        Component component = new Component(
                request.getTitle().trim(),
                request.getDescription().trim(),
                request.getCategory().trim(),
                (request.getSpecifications() != null) ? request.getSpecifications().trim() : null,
                request.getListingType(),
                request.getPrice(),
                ComponentStatus.AVAILABLE,
                owner
        );

        Component saved = componentRepository.save(component);
        return ComponentResponse.fromEntity(saved);
    }

    public ComponentResponse updateComponent(Long id, ComponentRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        Component component = componentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Component listing not found with ID: " + id));

        if (!component.getOwner().getId().equals(user.getId())) {
            throw new AccessDeniedException("You are not authorized to update this listing");
        }

        validatePricingRules(request.getListingType(), request.getPrice());

        component.setTitle(request.getTitle().trim());
        component.setDescription(request.getDescription().trim());
        component.setCategory(request.getCategory().trim());
        component.setSpecifications((request.getSpecifications() != null) ? request.getSpecifications().trim() : null);
        component.setListingType(request.getListingType());
        component.setPrice(request.getPrice());
        component.setUpdatedAt(LocalDateTime.now());

        Component updated = componentRepository.save(component);
        return ComponentResponse.fromEntity(updated);
    }

    public void deleteComponent(Long id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        Component component = componentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Component listing not found with ID: " + id));

        if (!component.getOwner().getId().equals(user.getId())) {
            throw new AccessDeniedException("You are not authorized to delete this listing");
        }

        // Preserve reservation history: do not automatically delete reservation records.
        // If active or historical reservations exist, reject hard deletion with HTTP 409 Conflict.
        List<Reservation> reservations = reservationRepository.findByComponentId(component.getId());
        if (!reservations.isEmpty()) {
            boolean hasActiveReservation = reservations.stream()
                    .anyMatch(r -> r.getStatus() == ReservationStatus.ACTIVE);
            if (hasActiveReservation) {
                throw new ConflictException("Cannot delete listing: it has an active reservation");
            }
            throw new ConflictException("Cannot delete listing: historical reservations exist for this component");
        }

        componentRepository.delete(component);
    }

    @Transactional(readOnly = true)
    public List<ComponentResponse> getMyComponents(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        List<Component> components = componentRepository.findByOwnerIdOrderByCreatedAtDesc(user.getId());
        return components.stream()
                .map(ComponentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    private void validatePricingRules(ListingType listingType, BigDecimal price) {
        if (listingType == ListingType.SELL) {
            if (price == null) {
                throw new IllegalArgumentException("Price is required for SELL listings");
            }
            if (price.compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Price cannot be negative");
            }
        } else if (listingType == ListingType.SWAP || listingType == ListingType.BORROW) {
            if (price != null) {
                throw new IllegalArgumentException("Price must be null for " + listingType + " listings");
            }
        }
    }
}
