package com.corehub.backend.security;

import com.corehub.backend.entity.Role;
import com.corehub.backend.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Base64;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtServiceTest {

    // 32-byte valid Base64 key for testing
    private static final String TEST_SECRET = "Q29yZUh1YlRlc3RTZWNyZXRLZXkzMkJ5dGVzTG9uZyE=";
    private static final long TEST_EXPIRATION_MS = 3600000L; // 1 hour

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(TEST_SECRET, TEST_EXPIRATION_MS);
    }

    @Test
    void shouldGenerateTokenAndExtractCorrectClaims() {
        User user = new User("STU12345", "Alice Smith", "alice@university.edu",
                "hashedPass", "0771234567", "ECE", Role.USER);
        user.setId(42L);

        String token = jwtService.generateToken(user);

        assertNotNull(token);
        assertEquals("alice@university.edu", jwtService.extractEmail(token));
        assertEquals(42L, jwtService.extractUserId(token));
        assertEquals("USER", jwtService.extractRole(token));
        assertTrue(jwtService.validateToken(token));
    }

    @Test
    void shouldValidateTokenAgainstMatchingUserDetails() {
        User user = new User("STU12345", "Alice Smith", "alice@university.edu",
                "hashedPass", null, null, Role.USER);
        user.setId(1L);

        String token = jwtService.generateToken(user);

        UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                "alice@university.edu",
                "hashedPass",
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
        );

        assertTrue(jwtService.isTokenValid(token, userDetails));
    }

    @Test
    void shouldRejectTokenWhenEmailDoesNotMatchUserDetails() {
        User user = new User("STU12345", "Alice Smith", "alice@university.edu",
                "hashedPass", null, null, Role.USER);
        user.setId(1L);

        String token = jwtService.generateToken(user);

        UserDetails differentUser = new org.springframework.security.core.userdetails.User(
                "bob@university.edu",
                "hashedPass",
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
        );

        assertFalse(jwtService.isTokenValid(token, differentUser));
    }

    @Test
    void shouldRejectTamperedOrInvalidToken() {
        String invalidToken = "eyJhbGciOiJIUzI1NiJ9.invalidPayload.invalidSignature";
        assertFalse(jwtService.validateToken(invalidToken));
    }

    @Test
    void shouldRejectExpiredToken() {
        // Create a JwtService instance with negative expiration
        JwtService expiredJwtService = new JwtService(TEST_SECRET, -1000L); // expired 1s ago

        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", 1L);
        claims.put("role", "USER");

        String expiredToken = expiredJwtService.generateToken(claims, "alice@university.edu");

        assertFalse(jwtService.validateToken(expiredToken));
    }

    @Test
    void shouldFailStartupWhenSecretIsMissingOrEmpty() {
        IllegalStateException nullEx = assertThrows(
                IllegalStateException.class,
                () -> new JwtService(null, TEST_EXPIRATION_MS)
        );
        assertTrue(nullEx.getMessage().contains("JWT_SECRET environment variable is missing"));

        IllegalStateException emptyEx = assertThrows(
                IllegalStateException.class,
                () -> new JwtService("   ", TEST_EXPIRATION_MS)
        );
        assertTrue(emptyEx.getMessage().contains("JWT_SECRET environment variable is missing"));
    }

    @Test
    void shouldFailStartupWhenSecretIsMalformedBase64() {
        String malformedBase64 = "not-valid-base64!@#$%^&*()";

        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> new JwtService(malformedBase64, TEST_EXPIRATION_MS)
        );
        assertTrue(ex.getMessage().contains("JWT_SECRET must be a valid Base64-encoded string"),
                "Expected message about malformed Base64, got: " + ex.getMessage());
    }

    @Test
    void shouldFailStartupWhenDecodedKeyLengthIsLessThan32Bytes() {
        // Valid Base64 string that decodes to only 16 bytes (< 32 bytes required for HS256)
        byte[] shortBytes = new byte[16];
        for (int i = 0; i < 16; i++) {
            shortBytes[i] = (byte) (i + 1);
        }
        String shortBase64 = Base64.getEncoder().encodeToString(shortBytes);

        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> new JwtService(shortBase64, TEST_EXPIRATION_MS)
        );
        assertTrue(ex.getMessage().contains("JWT_SECRET is too weak"),
                "Expected message about weak secret, got: " + ex.getMessage());
        assertTrue(ex.getMessage().contains("at least 32 bytes"),
                "Expected message to mention requirement of at least 32 bytes, got: " + ex.getMessage());
        assertTrue(ex.getMessage().contains("found 16 bytes"),
                "Expected message to report actual decoded length, got: " + ex.getMessage());
    }

    @Test
    void shouldSupportBase64EncodedSecretOfAtLeast32Bytes() {
        byte[] rawBytes = new byte[32];
        for (int i = 0; i < 32; i++) {
            rawBytes[i] = (byte) (i + 1);
        }
        String base64Secret = Base64.getEncoder().encodeToString(rawBytes);

        JwtService base64JwtService = new JwtService(base64Secret, TEST_EXPIRATION_MS);

        User user = new User("STU999", "Base64 User", "b64@eng.pdn.ac.lk", "hash", null, null, Role.USER);
        user.setId(99L);

        String token = base64JwtService.generateToken(user);
        assertNotNull(token);
        assertEquals("b64@eng.pdn.ac.lk", base64JwtService.extractEmail(token));
        assertEquals(99L, base64JwtService.extractUserId(token));
    }
}
