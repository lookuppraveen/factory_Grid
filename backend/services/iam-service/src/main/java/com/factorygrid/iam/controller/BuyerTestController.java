package com.factorygrid.iam.controller;

import com.factorygrid.iam.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/buyer")
@Tag(name = "Buyer Access Isolation", description = "Protected endpoints accessible ONLY to users with the BUYER role")
@SecurityRequirement(name = "bearerAuth")
public class BuyerTestController {

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('BUYER')")
    @Operation(summary = "Buyer Dashboard Area", description = "Restricted to authenticated BUYER users. Manufacturers receive 403 Forbidden.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getBuyerDashboard(Authentication auth) {
        Map<String, Object> data = Map.of(
                "portal", "BUYER",
                "accessibleBy", auth.getName(),
                "authorities", auth.getAuthorities(),
                "message", "Welcome to Buyer Procurement Portal. Manufacturer access is strictly denied."
        );
        return ResponseEntity.ok(ApiResponse.ok("Buyer portal access granted", data));
    }

    @GetMapping("/profile")
    @PreAuthorize("hasRole('BUYER')")
    @Operation(summary = "Buyer Profile Info", description = "Restricted to BUYER role.")
    public ResponseEntity<ApiResponse<Map<String, String>>> getBuyerProfile(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok("Buyer profile accessed", Map.of("username", auth.getName(), "role", "BUYER")));
    }
}
