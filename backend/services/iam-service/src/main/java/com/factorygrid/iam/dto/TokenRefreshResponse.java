package com.factorygrid.iam.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "New access and refresh token response")
public class TokenRefreshResponse {

    @Schema(description = "New JWT Access Token")
    private String accessToken;

    @Schema(description = "New rotated Refresh Token")
    private String refreshToken;

    @Schema(description = "Token type", example = "Bearer")
    @Builder.Default
    private String tokenType = "Bearer";

    @Schema(description = "Access token expiry duration in milliseconds")
    private Long expiresIn;
}
