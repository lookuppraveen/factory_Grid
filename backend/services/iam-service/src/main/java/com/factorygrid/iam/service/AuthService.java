package com.factorygrid.iam.service;

import com.factorygrid.iam.config.JwtUtil;
import com.factorygrid.iam.dto.*;
import com.factorygrid.iam.exception.*;
import com.factorygrid.iam.model.RefreshToken;
import com.factorygrid.iam.model.Role;
import com.factorygrid.iam.model.User;
import com.factorygrid.iam.repository.RefreshTokenRepository;
import com.factorygrid.iam.repository.RoleRepository;
import com.factorygrid.iam.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final RefreshTokenService refreshTokenService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCK_TIME_MINUTES = 15;

    @Transactional
    public RegistrationResponse registerBuyer(BuyerRegistrationRequest request) {
        String username = request.getUsername().trim();
        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByUsername(username)) {
            throw new DuplicateResourceException("Username '" + username + "' is already registered");
        }
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("Email '" + email + "' is already registered");
        }

        Role buyerRole = roleRepository.findByName("ROLE_BUYER")
                .orElseGet(() -> roleRepository.save(new Role("ROLE_BUYER", "Procurement Buyer Role for purchasing entities")));

        String userCode = generateUserCode("BUY");
        String companyCode = StringUtils.hasText(request.getCompanyCode())
                ? request.getCompanyCode().trim()
                : generateCompanyCode("BUY");

        User user = User.builder()
                .userCode(userCode)
                .username(username)
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .phone(request.getPhone())
                .companyName(request.getCompanyName().trim())
                .companyCode(companyCode)
                .department(request.getDepartment())
                .jobTitle(request.getJobTitle())
                .accountStatus("ACTIVE")
                .failedLoginAttempts(0)
                .roles(Set.of(buyerRole))
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build();

        User savedUser = userRepository.save(user);
        log.info("Buyer registered successfully: username={}, email={}, code={}", username, email, userCode);

        List<String> roles = savedUser.getRoles().stream().map(Role::getName).collect(Collectors.toList());
        return RegistrationResponse.builder()
                .success(true)
                .message("Buyer account successfully registered.")
                .user(mapToUserProfileResponse(savedUser, roles))
                .build();
    }

    @Transactional
    public RegistrationResponse registerManufacturer(ManufacturerRegistrationRequest request) {
        String username = request.getUsername().trim();
        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByUsername(username)) {
            throw new DuplicateResourceException("Username '" + username + "' is already registered");
        }
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("Email '" + email + "' is already registered");
        }

        Role mfgRole = roleRepository.findByName("ROLE_MANUFACTURER")
                .orElseGet(() -> roleRepository.save(new Role("ROLE_MANUFACTURER", "Manufacturer Role")));
        Role supplierRole = roleRepository.findByName("ROLE_SUPPLIER")
                .orElseGet(() -> roleRepository.save(new Role("ROLE_SUPPLIER", "Supplier Role")));

        Set<Role> roles = new HashSet<>();
        roles.add(mfgRole);
        roles.add(supplierRole);

        String userCode = generateUserCode("MFG");
        String companyCode = StringUtils.hasText(request.getCompanyCode())
                ? request.getCompanyCode().trim()
                : generateCompanyCode("MFG");

        User user = User.builder()
                .userCode(userCode)
                .username(username)
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .phone(request.getPhone())
                .companyName(request.getCompanyName().trim())
                .companyCode(companyCode)
                .department(request.getDepartment())
                .jobTitle(request.getJobTitle())
                .accountStatus("ACTIVE")
                .failedLoginAttempts(0)
                .roles(roles)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build();

        User savedUser = userRepository.save(user);
        log.info("Manufacturer registered successfully: username={}, email={}, code={}", username, email, userCode);

        List<String> roleNames = savedUser.getRoles().stream().map(Role::getName).collect(Collectors.toList());
        return RegistrationResponse.builder()
                .success(true)
                .message("Manufacturer account successfully registered.")
                .user(mapToUserProfileResponse(savedUser, roleNames))
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String identifier = request.getUsernameOrEmail().trim();

        User user = userRepository.findByUsernameOrEmail(identifier, identifier)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid username or password"));

        if (!user.isAccountActive()) {
            throw new AccountInactiveException("Account is " + user.getAccountStatus() + ". Please contact administrator.");
        }

        if (!user.isAccountNonLocked()) {
            throw new AccountLockedException("Account is temporarily locked due to multiple failed attempts. Try again later.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            handleFailedLogin(user);
            throw new InvalidCredentialsException("Invalid username or password");
        }

        if (StringUtils.hasText(request.getPortalType())) {
            validatePortalAccess(user, request.getPortalType());
        }

        user.setFailedLoginAttempts(0);
        user.setAccountLockedUntil(null);
        user.setLastLoginAt(OffsetDateTime.now());
        userRepository.save(user);

        List<String> roleNames = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toList());

        String accessToken = jwtUtil.generateToken(user.getUsername(), user.getId(), user.getUserCode(), roleNames);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        UserProfileResponse userProfile = mapToUserProfileResponse(user, roleNames);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                .expiresIn(jwtUtil.getExpirationMs())
                .user(userProfile)
                .build();
    }

    @Transactional
    public TokenRefreshResponse refreshToken(RefreshTokenRequest request) {
        String requestToken = request.getRefreshToken();

        RefreshToken refreshToken = refreshTokenRepository.findByToken(requestToken)
                .map(refreshTokenService::verifyExpiration)
                .orElseThrow(() -> new TokenException("Refresh token is not in database or is invalid."));

        User user = refreshToken.getUser();
        RefreshToken newRefreshToken = refreshTokenService.rotateToken(refreshToken);

        List<String> roleNames = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toList());

        String newAccessToken = jwtUtil.generateToken(user.getUsername(), user.getId(), user.getUserCode(), roleNames);

        return TokenRefreshResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken.getToken())
                .tokenType("Bearer")
                .expiresIn(jwtUtil.getExpirationMs())
                .build();
    }

    @Transactional
    public void logout(LogoutRequest request) {
        if (request != null && StringUtils.hasText(request.getRefreshToken())) {
            refreshTokenService.revokeToken(request.getRefreshToken());
        }
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUserProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        List<String> roleNames = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toList());

        return mapToUserProfileResponse(user, roleNames);
    }

    @Transactional(readOnly = true)
    public List<UserProfileResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(user -> mapToUserProfileResponse(user, user.getRoles().stream().map(Role::getName).collect(Collectors.toList())))
                .collect(Collectors.toList());
    }

    private void handleFailedLogin(User user) {
        int attempts = user.getFailedLoginAttempts() + 1;
        user.setFailedLoginAttempts(attempts);
        if (attempts >= MAX_FAILED_ATTEMPTS) {
            user.setAccountLockedUntil(OffsetDateTime.now().plusMinutes(LOCK_TIME_MINUTES));
            log.warn("User account {} locked for {} minutes due to {} failed attempts", user.getUsername(), LOCK_TIME_MINUTES, attempts);
        }
        userRepository.save(user);
    }

    private void validatePortalAccess(User user, String portalType) {
        String portal = portalType.trim().toUpperCase();
        boolean hasAccess = false;

        for (Role role : user.getRoles()) {
            String roleName = role.getName().toUpperCase();
            if ("BUYER".equals(portal) || "BUYER_COMPANY".equals(portal)) {
                if (roleName.contains("BUYER") || roleName.contains("ADMIN")) {
                    hasAccess = true;
                    break;
                }
            } else if ("SUPPLIER".equals(portal) || "MANUFACTURER".equals(portal) || "MANUFACTURER_COMPANY".equals(portal)) {
                if (roleName.contains("SUPPLIER") || roleName.contains("MANUFACTURER") || roleName.contains("ADMIN")) {
                    hasAccess = true;
                    break;
                }
            } else if ("FG_STAFF".equals(portal) || "STAFF".equals(portal) || "ADMIN".equals(portal)) {
                if (roleName.contains("ADMIN") || roleName.contains("COMPLIANCE") || roleName.contains("SALES") || roleName.contains("ACCOUNTS")) {
                    hasAccess = true;
                    break;
                }
            }
        }

        if (!hasAccess) {
            throw new InvalidCredentialsException("Account does not have authorization for requested portal: " + portalType);
        }
    }

    private String generateUserCode(String prefix) {
        return "USR-" + prefix + "-" + (System.currentTimeMillis() % 1000000);
    }

    private String generateCompanyCode(String prefix) {
        return prefix + "-2026-" + (UUID.randomUUID().toString().substring(0, 4).toUpperCase());
    }

    public UserProfileResponse mapToUserProfileResponse(User user, List<String> roleNames) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .userCode(user.getUserCode())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .companyName(user.getCompanyName())
                .companyCode(user.getCompanyCode())
                .department(user.getDepartment())
                .jobTitle(user.getJobTitle())
                .accountStatus(user.getAccountStatus())
                .roles(roleNames)
                .lastLoginAt(user.getLastLoginAt())
                .build();
    }
}