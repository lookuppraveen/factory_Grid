package com.factorygrid.iam.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Logout request payload")
public class LogoutRequest {

    @Schema(description = "Refresh token to revoke on logout")
    private String refreshToken;
}
