package com.corehub.backend.controller;

import com.corehub.backend.dto.UserResponse;
import com.corehub.backend.entity.Role;
import com.corehub.backend.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.Collections;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(userController).build();
    }

    @Test
    void getMeShouldReturnUserProfileWhenAuthenticated() throws Exception {
        UserDetails userDetails = new User("alice@university.edu", "password", Collections.emptyList());

        UserResponse userResponse = new UserResponse(
                5L, "E/20/005", "Alice Wonderland", "alice@university.edu", "0771234567", "Computer", Role.USER, LocalDateTime.now()
        );

        when(userService.getCurrentUserProfile("alice@university.edu")).thenReturn(userResponse);

        mockMvc.perform(get("/api/users/me")
                        .principal(() -> "alice@university.edu"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(5L))
                .andExpect(jsonPath("$.studentId").value("E/20/005"))
                .andExpect(jsonPath("$.name").value("Alice Wonderland"))
                .andExpect(jsonPath("$.email").value("alice@university.edu"))
                .andExpect(jsonPath("$.role").value("USER"));
    }
}
