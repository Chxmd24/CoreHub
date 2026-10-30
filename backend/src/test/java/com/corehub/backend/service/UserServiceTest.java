package com.corehub.backend.service;

import com.corehub.backend.dto.UpdateProfileRequest;
import com.corehub.backend.dto.UserResponse;
import com.corehub.backend.entity.Role;
import com.corehub.backend.entity.User;
import com.corehub.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    private User existingUser;

    @BeforeEach
    void setUp() {
        existingUser = new User(
                "E/19/042",
                "Chamod Perera",
                "chamod@eng.pdn.ac.lk",
                "$2a$10$hashedPassword",
                "+94771234567",
                "Computer Engineering",
                Role.USER
        );
        existingUser.setId(10L);
    }

    @Test
    void getCurrentUserProfile_returnsMappedResponse() {
        when(userRepository.findByEmail("chamod@eng.pdn.ac.lk")).thenReturn(Optional.of(existingUser));

        UserResponse response = userService.getCurrentUserProfile("chamod@eng.pdn.ac.lk");

        assertNotNull(response);
        assertEquals(10L, response.getId());
        assertEquals("E/19/042", response.getStudentId());
        assertEquals("Chamod Perera", response.getName());
        assertEquals("chamod@eng.pdn.ac.lk", response.getEmail());
        assertEquals("+94771234567", response.getPhone());
        assertEquals("Computer Engineering", response.getDepartment());
        assertEquals(Role.USER, response.getRole());
    }

    @Test
    void getCurrentUserProfile_throwsWhenUserNotFound() {
        when(userRepository.findByEmail("unknown@eng.pdn.ac.lk")).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class, () ->
                userService.getCurrentUserProfile("unknown@eng.pdn.ac.lk")
        );
    }

    @Test
    void updateCurrentUserProfile_updatesAllowedFieldsAndPreservesImmutableFields() {
        when(userRepository.findByEmail("chamod@eng.pdn.ac.lk")).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateProfileRequest request = new UpdateProfileRequest(
                "Chamod P. Updated",
                " +94779998877 ",
                " Mechanical and Manufacturing Engineering "
        );

        UserResponse response = userService.updateCurrentUserProfile("chamod@eng.pdn.ac.lk", request);

        assertEquals("Chamod P. Updated", response.getName());
        assertEquals("+94779998877", response.getPhone());
        assertEquals("Mechanical and Manufacturing Engineering", response.getDepartment());

        // Verify immutable fields were NOT altered
        assertEquals("E/19/042", existingUser.getStudentId());
        assertEquals("chamod@eng.pdn.ac.lk", existingUser.getEmail());
        assertEquals(Role.USER, existingUser.getRole());
        assertEquals("$2a$10$hashedPassword", existingUser.getPasswordHash());

        verify(userRepository).save(existingUser);
    }

    @Test
    void updateCurrentUserProfile_rejectsBlankPhone() {
        when(userRepository.findByEmail("chamod@eng.pdn.ac.lk")).thenReturn(Optional.of(existingUser));

        UpdateProfileRequest request = new UpdateProfileRequest(
                "Chamod Perera",
                "   ",
                "Computer Engineering"
        );

        assertThrows(IllegalArgumentException.class, () ->
                userService.updateCurrentUserProfile("chamod@eng.pdn.ac.lk", request)
        );
    }

    @Test
    void updateCurrentUserProfile_rejectsUnsupportedDepartment() {
        when(userRepository.findByEmail("chamod@eng.pdn.ac.lk")).thenReturn(Optional.of(existingUser));

        UpdateProfileRequest request = new UpdateProfileRequest(
                "Chamod Perera",
                "+94771234567",
                "Software Engineering"
        );

        assertThrows(IllegalArgumentException.class, () ->
                userService.updateCurrentUserProfile("chamod@eng.pdn.ac.lk", request)
        );
    }

    @Test
    void updateCurrentUserProfile_rejectsBlankName() {
        when(userRepository.findByEmail("chamod@eng.pdn.ac.lk")).thenReturn(Optional.of(existingUser));

        UpdateProfileRequest request = new UpdateProfileRequest(
                "   ",
                "+94771234567",
                "Computer Engineering"
        );

        assertThrows(IllegalArgumentException.class, () ->
                userService.updateCurrentUserProfile("chamod@eng.pdn.ac.lk", request)
        );
    }
}
