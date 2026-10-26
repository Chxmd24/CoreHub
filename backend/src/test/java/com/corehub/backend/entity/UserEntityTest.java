package com.corehub.backend.entity;

import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

class UserEntityTest {

    private final ObjectMapper objectMapper = JsonMapper.builder().build();

    @Test
    void shouldCreateUserWithAllFields() {
        User user = new User("STU12345", "Alice Smith", "alice@university.edu",
                "$2a$10$hashedPasswordValue", "0771234567", "Computer Engineering", Role.USER);

        assertEquals("STU12345", user.getStudentId());
        assertEquals("Alice Smith", user.getName());
        assertEquals("alice@university.edu", user.getEmail());
        assertEquals("$2a$10$hashedPasswordValue", user.getPasswordHash());
        assertEquals("0771234567", user.getPhone());
        assertEquals("Computer Engineering", user.getDepartment());
        assertEquals(Role.USER, user.getRole());
    }

    @Test
    void prePersistShouldSetDefaultsWhenMissing() {
        User user = new User();
        user.setStudentId("STU99999");
        user.setName("Bob Jones");
        user.setEmail("bob@university.edu");
        user.setPasswordHash("$2a$10$anotherHash");

        assertNull(user.getCreatedAt());
        user.onCreate();

        assertNotNull(user.getCreatedAt());
        assertEquals(Role.USER, user.getRole());
    }

    @Test
    void shouldNotExposePasswordHashDuringJsonSerialization() throws Exception {
        User user = new User("STU12345", "Alice Smith", "alice@university.edu",
                "$2a$10$superSecretHashString", "0771234567", "ECE", Role.USER);
        user.setId(1L);
        user.setCreatedAt(LocalDateTime.now());

        String json = objectMapper.writeValueAsString(user);

        assertFalse(json.contains("superSecretHashString"),
                "passwordHash must never be exposed during JSON serialization");
        assertFalse(json.contains("passwordHash"),
                "passwordHash field name must not appear in JSON output");
    }
}
