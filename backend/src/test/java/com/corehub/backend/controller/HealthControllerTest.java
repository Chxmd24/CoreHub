package com.corehub.backend.controller;

import org.junit.jupiter.api.Test;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class HealthControllerTest {

    @Test
    void healthEndpointShouldReturnUpAndApplicationName() {
        HealthController controller = new HealthController();
        Map<String, String> response = controller.getHealth();

        assertNotNull(response);
        assertEquals("UP", response.get("status"));
        assertEquals("CoreHub", response.get("application"));
    }
}
