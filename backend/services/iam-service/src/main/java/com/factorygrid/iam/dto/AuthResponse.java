package com.factorygrid.iam.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Authentication response containing JWT tokens and safe user profile")
public class AuthResponse {

    @Schema(description = "JWT Access Token", example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
    private String accessToken;

    @Schema(description = "Persistent Refresh Token", example = "d94b0d1e-53c4-4d82-8433-4f9cf2...")
    private String refreshToken;

    @Schema(description = "Token type", example = "Bearer")
    @Builder.Default
    private String tokenType = "Bearer";

    @Schema(description = "Access token expiry duration in milliseconds", example = "86400000")
    private Long expiresIn;

    @Schema(description = "Safe user profile without sensitive fields")
    private UserProfileResponse user;
}
