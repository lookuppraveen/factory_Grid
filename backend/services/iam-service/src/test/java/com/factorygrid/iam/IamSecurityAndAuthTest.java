package com.factorygrid.iam;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.factorygrid.iam.dto.*;
import com.factorygrid.iam.model.Role;
import com.factorygrid.iam.model.User;
import com.factorygrid.iam.repository.RefreshTokenRepository;
import com.factorygrid.iam.repository.RoleRepository;
import com.factorygrid.iam.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.OffsetDateTime;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(locations = "classpath:application-test.properties")
class IamSecurityAndAuthTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Role buyerRole;
    private Role supplierRole;
    private Role mfgRole;
    private Role adminRole;

    @BeforeEach
    void setupData() {
        refreshTokenRepository.deleteAll();
        userRepository.deleteAll();

        buyerRole = roleRepository.findByName("ROLE_BUYER")
                .orElseGet(() -> roleRepository.save(new Role("ROLE_BUYER", "Buyer")));
        supplierRole = roleRepository.findByName("ROLE_SUPPLIER")
                .orElseGet(() -> roleRepository.save(new Role("ROLE_SUPPLIER", "Supplier")));
        mfgRole = roleRepository.findByName("ROLE_MANUFACTURER")
                .orElseGet(() -> roleRepository.save(new Role("ROLE_MANUFACTURER", "Manufacturer")));
        adminRole = roleRepository.findByName("ROLE_ADMIN")
                .orElseGet(() -> roleRepository.save(new Role("ROLE_ADMIN", "Admin")));

        // Provision base test admin
        userRepository.save(User.builder()
                .userCode("USR-ADM-001")
                .username("admin_test")
                .email("admin@factorygrid.com")
                .passwordHash(passwordEncoder.encode("Password@123"))
                .fullName("Security Administrator")
                .companyName("FactoryGrid")
                .companyCode("FG-HQ-001")
                .accountStatus("ACTIVE")
                .failedLoginAttempts(0)
                .roles(Set.of(adminRole))
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        // Provision inactive user
        userRepository.save(User.builder()
                .userCode("USR-INACT-001")
                .username("inactive_test")
                .email("inactive@test.com")
                .passwordHash(passwordEncoder.encode("Password@123"))
                .fullName("Inactive User")
                .accountStatus("INACTIVE")
                .failedLoginAttempts(0)
                .roles(Set.of(buyerRole))
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        // Provision locked user
        userRepository.save(User.builder()
                .userCode("USR-LOCK-001")
                .username("locked_test")
                .email("locked@test.com")
                .passwordHash(passwordEncoder.encode("Password@123"))
                .fullName("Locked User")
                .accountStatus("ACTIVE")
                .failedLoginAttempts(5)
                .accountLockedUntil(OffsetDateTime.now().plusHours(1))
                .roles(Set.of(buyerRole))
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());
    }

    @Test
    @DisplayName("1. Buyer Registration creates real database user with ROLE_BUYER, no privilege escalation")
    void testSuccessfulBuyerRegistration() throws Exception {
        BuyerRegistrationRequest req = BuyerRegistrationRequest.builder()
                .username("new_buyer_user")
                .email("newbuyer@pharmahub.com")
                .password("StrongPass@2026")
                .fullName("Ananya Roy")
                .companyName("PharmaHub Logistics")
                .department("Procurement")
                .jobTitle("Sourcing Manager")
                .phone("+91 99887 76655")
                .build();

        mockMvc.perform(post("/api/v1/auth/register/buyer")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.user.username", is("new_buyer_user")))
                .andExpect(jsonPath("$.user.roles", hasItem("ROLE_BUYER")))
                .andExpect(jsonPath("$.user.roles", not(hasItem("ROLE_ADMIN"))))
                .andExpect(jsonPath("$.user.passwordHash").doesNotExist());

        // Verify newly registered user can login immediately
        LoginRequest loginReq = LoginRequest.builder()
                .usernameOrEmail("new_buyer_user")
                .password("StrongPass@2026")
                .build();

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andReturn();

        String token = objectMapper.readTree(loginResult.getResponse().getContentAsString()).get("accessToken").asText();

        // Verify Buyer access to Buyer dashboard
        mockMvc.perform(get("/api/v1/buyer/dashboard")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.portal", is("BUYER")));

        // Verify Buyer CANNOT access Manufacturer dashboard
        mockMvc.perform(get("/api/v1/manufacturer/dashboard")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("2. Manufacturer Registration creates real database user with ROLE_MANUFACTURER & ROLE_SUPPLIER")
    void testSuccessfulManufacturerRegistration() throws Exception {
        ManufacturerRegistrationRequest req = ManufacturerRegistrationRequest.builder()
                .username("new_mfg_user")
                .email("plant@medilabs.com")
                .password("StrongPass@2026")
                .fullName("Sunil Deshmukh")
                .companyName("MediLabs Formulation Ltd")
                .department("Formulation Unit")
                .jobTitle("VP Manufacturing")
                .phone("+91 98765 43210")
                .factoryDetails("Unit 2, API Formulation Zone, Baddi")
                .build();

        mockMvc.perform(post("/api/v1/auth/register/manufacturer")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.user.username", is("new_mfg_user")))
                .andExpect(jsonPath("$.user.roles", hasItem("ROLE_MANUFACTURER")))
                .andExpect(jsonPath("$.user.passwordHash").doesNotExist());

        // Verify login
        LoginRequest loginReq = LoginRequest.builder()
                .usernameOrEmail("new_mfg_user")
                .password("StrongPass@2026")
                .build();

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andReturn();

        String token = objectMapper.readTree(loginResult.getResponse().getContentAsString()).get("accessToken").asText();

        // Verify Manufacturer access to Manufacturer dashboard
        mockMvc.perform(get("/api/v1/manufacturer/dashboard")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.portal", is("MANUFACTURER")));

        // Verify Manufacturer CANNOT access Buyer dashboard
        mockMvc.perform(get("/api/v1/buyer/dashboard")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("3. Duplicate email or username registration rejected with 409 Conflict")
    void testDuplicateRegistrationRejection() throws Exception {
        BuyerRegistrationRequest req = BuyerRegistrationRequest.builder()
                .username("buyer_dup")
                .email("dup@pharma.com")
                .password("StrongPass@2026")
                .fullName("First User")
                .companyName("Pharma Ltd")
                .build();

        mockMvc.perform(post("/api/v1/auth/register/buyer")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        // Attempt duplicate with same email
        mockMvc.perform(post("/api/v1/auth/register/buyer")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error", is("Conflict")));
    }

    @Test
    @DisplayName("4. Registration validation rejects short password (< 8 chars) or invalid email format")
    void testRegistrationValidationErrors() throws Exception {
        BuyerRegistrationRequest req = BuyerRegistrationRequest.builder()
                .username("ab") // too short
                .email("not-an-email")
                .password("short") // less than 8 chars
                .fullName("")
                .companyName("")
                .build();

        mockMvc.perform(post("/api/v1/auth/register/buyer")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("Bad Request")))
                .andExpect(jsonPath("$.errors.email").isNotEmpty())
                .andExpect(jsonPath("$.errors.password").isNotEmpty());
    }

    @Test
    @DisplayName("5. Invalid password rejected with 401 Unauthorized")
    void testInvalidPasswordRejection() throws Exception {
        LoginRequest req = LoginRequest.builder()
                .usernameOrEmail("admin_test")
                .password("WrongPassword999!")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", is("Unauthorized")))
                .andExpect(jsonPath("$.message", is("Invalid username or password")));
    }

    @Test
    @DisplayName("6. Inactive account rejected with 403 Forbidden")
    void testInactiveAccountRejection() throws Exception {
        LoginRequest req = LoginRequest.builder()
                .usernameOrEmail("inactive_test")
                .password("Password@123")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error", is("Forbidden")));
    }

    @Test
    @DisplayName("7. Locked account rejected with 423 Locked")
    void testLockedAccountRejection() throws Exception {
        LoginRequest req = LoginRequest.builder()
                .usernameOrEmail("locked_test")
                .password("Password@123")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isLocked())
                .andExpect(jsonPath("$.error", is("Locked")));
    }

    @Test
    @DisplayName("8. Admin Users endpoint is restricted to ADMIN and returns system users")
    void testAdminUsersList() throws Exception {
        String adminToken = obtainAccessToken("admin_test", "Password@123");

        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    @DisplayName("9. Unauthenticated requests to protected endpoints receive 401 Unauthorized")
    void testUnauthenticatedAccessDenied() throws Exception {
        mockMvc.perform(get("/api/v1/buyer/dashboard"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", is("Unauthorized")));

        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("10. Refresh token rotation and logout revocation")
    void testRefreshTokenRotationAndRevocation() throws Exception {
        LoginRequest req = LoginRequest.builder()
                .usernameOrEmail("admin_test")
                .password("Password@123")
                .build();

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn();

        String responseStr = result.getResponse().getContentAsString();
        String refreshToken = objectMapper.readTree(responseStr).get("refreshToken").asText();

        // Rotate token
        RefreshTokenRequest refreshReq = RefreshTokenRequest.builder()
                .refreshToken(refreshToken)
                .build();

        MvcResult refreshResult = mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andReturn();

        String newRefreshToken = objectMapper.readTree(refreshResult.getResponse().getContentAsString()).get("refreshToken").asText();
        assertThat(newRefreshToken).isNotEqualTo(refreshToken);

        // Logout
        LogoutRequest logoutReq = LogoutRequest.builder().refreshToken(newRefreshToken).build();
        mockMvc.perform(post("/api/v1/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(logoutReq)))
                .andExpect(status().isOk());

        // Revoked token must now fail
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(RefreshTokenRequest.builder().refreshToken(newRefreshToken).build())))
                .andExpect(status().isUnauthorized());
    }

    private String obtainAccessToken(String username, String password) throws Exception {
        LoginRequest req = LoginRequest.builder()
                .usernameOrEmail(username)
                .password(password)
                .build();

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn();

        String response = result.getResponse().getContentAsString();
        return objectMapper.readTree(response).get("accessToken").asText();
    }
}