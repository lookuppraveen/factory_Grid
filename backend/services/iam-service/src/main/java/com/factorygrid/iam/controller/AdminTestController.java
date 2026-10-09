package com.factorygrid.iam.controller;

import com.factorygrid.iam.dto.ApiResponse;
import com.factorygrid.iam.dto.UserProfileResponse;
import com.factorygrid.iam.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@Tag(name = "Admin Governance", description = "Protected administrative user and role governance endpoints accessible ONLY to users with ADMIN role")
@SecurityRequirement(name = "bearerAuth")
@RequiredArgsConstructor
public class AdminTestController {

    private final AuthService authService;

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List All System Users", description = "Retrieves real registered users and their assigned roles from PostgreSQL. Strictly forbidden to Buyer and Manufacturer roles.")
    public ResponseEntity<ApiResponse<List<UserProfileResponse>>> getAdminUsers(Authentication auth) {
        List<UserProfileResponse> users = authService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.ok("Users retrieved successfully by Admin: " + auth.getName(), users));
    }
}