package com.factorygrid.iam.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "User login credentials payload")
public class LoginRequest {

    @NotBlank(message = "Username or email is required")
    @Schema(description = "Username or registered email address", example = "v.sethi@apexpharma.com")
    private String usernameOrEmail;

    @NotBlank(message = "Password is required")
    @Schema(description = "Account password", example = "Password@123")
    private String password;

    @Schema(description = "Requested portal context (BUYER, SUPPLIER, FG_STAFF)", example = "BUYER")
    private String portalType;
}
