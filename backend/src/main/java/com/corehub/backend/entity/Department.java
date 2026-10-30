package com.corehub.backend.entity;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

public enum Department {
    ELECTRICAL_AND_INFORMATION("Electrical and Information Engineering"),
    CIVIL_AND_ENVIRONMENTAL("Civil and Environmental Engineering"),
    MARINE_AND_NAVAL("Marine Engineering and Naval Architecture"),
    MECHANICAL_AND_MANUFACTURING("Mechanical and Manufacturing Engineering"),
    COMPUTER("Computer Engineering");

    private final String displayName;

    Department(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public static final List<String> ALL_DISPLAY_NAMES = Collections.unmodifiableList(
            Arrays.stream(values())
                    .map(Department::getDisplayName)
                    .collect(Collectors.toList())
    );

    public static boolean isValid(String department) {
        if (department == null || department.isBlank()) {
            return false;
        }
        String trimmed = department.trim();
        for (Department d : values()) {
            if (d.displayName.equalsIgnoreCase(trimmed)) {
                return true;
            }
        }
        return false;
    }

    public static String normalizeOrThrow(String department) {
        if (department == null || department.isBlank()) {
            throw new IllegalArgumentException("Department is required and must be one of the supported engineering departments.");
        }
        String trimmed = department.trim();
        for (Department d : values()) {
            if (d.displayName.equalsIgnoreCase(trimmed)) {
                return d.displayName;
            }
        }
        throw new IllegalArgumentException(
                "Invalid department: '" + department + "'. Supported departments: " + String.join(", ", ALL_DISPLAY_NAMES)
        );
    }
}
