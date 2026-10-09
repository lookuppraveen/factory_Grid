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
@RequestMapping("/api/v1/manufacturer")
@Tag(name = "Manufacturer Access Isolation", description = "Protected endpoints accessible ONLY to users with SUPPLIER / MANUFACTURER role")
@SecurityRequirement(name = "bearerAuth")
public class ManufacturerTestController {

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('SUPPLIER', 'MANUFACTURER')")
    @Operation(summary = "Manufacturer Dashboard Area", description = "Restricted to authenticated MANUFACTURER / SUPPLIER users. Buyers receive 403 Forbidden.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getManufacturerDashboard(Authentication auth) {
        Map<String, Object> data = Map.of(
                "portal", "MANUFACTURER",
                "accessibleBy", auth.getName(),
                "authorities", auth.getAuthorities(),
                "message", "Welcome to Manufacturer Workspace. Buyer access is strictly denied."
        );
        return ResponseEntity.ok(ApiResponse.ok("Manufacturer portal access granted", data));
    }

    @GetMapping("/profile")
    @PreAuthorize("hasAnyRole('SUPPLIER', 'MANUFACTURER')")
    @Operation(summary = "Manufacturer Profile Info", description = "Restricted to MANUFACTURER / SUPPLIER role.")
    public ResponseEntity<ApiResponse<Map<String, String>>> getManufacturerProfile(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok("Manufacturer profile accessed", Map.of("username", auth.getName(), "role", "SUPPLIER/MANUFACTURER")));
    }
}
