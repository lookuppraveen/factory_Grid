package com.factorygrid.iam;

import com.factorygrid.iam.model.Role;
import com.factorygrid.iam.model.User;
import com.factorygrid.iam.repository.RoleRepository;
import com.factorygrid.iam.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.TestPropertySource;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(locations = "classpath:application-test.properties")
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    private Role buyerRole;

    @BeforeEach
    void setUp() {
        buyerRole = roleRepository.findByName("ROLE_BUYER")
                .orElseGet(() -> roleRepository.save(new Role("ROLE_BUYER", "Buyer Role")));
    }

    @Test
    @DisplayName("Should save and retrieve user with role mapping in PostgreSQL")
    void testSaveAndFindUser() {
        User user = User.builder()
                .userCode("USR-TEST-001")
                .username("test_user")
                .email("test@factorygrid.com")
                .passwordHash("$2a$12$DummyHashString...")
                .fullName("Test User")
                .companyName("Test Corp")
                .companyCode("TC-001")
                .accountStatus("ACTIVE")
                .roles(Set.of(buyerRole))
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build();

        User saved = userRepository.save(user);
        assertThat(saved.getId()).isNotNull();

        Optional<User> byUsername = userRepository.findByUsername("test_user");
        assertThat(byUsername).isPresent();
        assertThat(byUsername.get().getEmail()).isEqualTo("test@factorygrid.com");
        assertThat(byUsername.get().getRoles()).isNotEmpty();

        Optional<User> byEmail = userRepository.findByEmail("test@factorygrid.com");
        assertThat(byEmail).isPresent();

        Optional<User> byIdentifier = userRepository.findByUsernameOrEmail("test_user", "test_user");
        assertThat(byIdentifier).isPresent();
    }
}