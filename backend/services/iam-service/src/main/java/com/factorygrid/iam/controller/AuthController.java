package com.factorygrid.iam.controller;

import com.factorygrid.iam.dto.*;
import com.factorygrid.iam.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication & Registration", description = "Centralized IAM endpoints for user registration, authentication, token refresh, and profile management")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register/buyer")
    @Operation(summary = "Register Buyer Account", description = "Registers a new procurement Buyer user in PostgreSQL and assigns the BUYER role. Public requests cannot escalate privileges.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Buyer account created successfully"),
            @ApiResponse(responseCode = "400", description = "Validation failed for input fields"),
            @ApiResponse(responseCode = "409", description = "Username or email already exists")
    })
    public ResponseEntity<RegistrationResponse> registerBuyer(@Valid @RequestBody BuyerRegistrationRequest request) {
        RegistrationResponse response = authService.registerBuyer(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/register/manufacturer")
    @Operation(summary = "Register Manufacturer Account", description = "Registers a new manufacturing plant/supplier user in PostgreSQL and assigns the MANUFACTURER and SUPPLIER roles.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Manufacturer account created successfully"),
            @ApiResponse(responseCode = "400", description = "Validation failed for input fields"),
            @ApiResponse(responseCode = "409", description = "Username or email already exists")
    })
    public ResponseEntity<RegistrationResponse> registerManufacturer(@Valid @RequestBody ManufacturerRegistrationRequest request) {
        RegistrationResponse response = authService.registerManufacturer(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    @Operation(summary = "Centralized User Login", description = "Authenticates Buyer, Manufacturer, or Staff credentials against PostgreSQL using BCrypt and returns signed JWT access token, persistent refresh token, and user profile.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Authentication successful"),
            @ApiResponse(responseCode = "401", description = "Invalid credentials"),
            @ApiResponse(responseCode = "403", description = "Account inactive or unauthorized portal requested"),
            @ApiResponse(responseCode = "423", description = "Account locked")
    })
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh JWT Access Token", description = "Rotates persistent refresh token in database and issues a new signed JWT access token.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Token refreshed successfully"),
            @ApiResponse(responseCode = "401", description = "Invalid or expired refresh token")
    })
    public ResponseEntity<TokenRefreshResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        TokenRefreshResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout & Revoke Token", description = "Revokes persistent refresh token in PostgreSQL to terminate user session.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User logged out and session terminated")
    })
    public ResponseEntity<com.factorygrid.iam.dto.ApiResponse<Void>> logout(@RequestBody(required = false) LogoutRequest request) {
        authService.logout(request);
        return ResponseEntity.ok(com.factorygrid.iam.dto.ApiResponse.ok("User logged out successfully and refresh token revoked"));
    }

    @GetMapping("/me")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get Current User Profile", description = "Retrieves the authenticated user identity, company details, and assigned roles from PostgreSQL.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Current user profile"),
            @ApiResponse(responseCode = "401", description = "Unauthenticated request")
    })
    public ResponseEntity<UserProfileResponse> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        UserProfileResponse profile = authService.getCurrentUserProfile(username);
        return ResponseEntity.ok(profile);
    }
}