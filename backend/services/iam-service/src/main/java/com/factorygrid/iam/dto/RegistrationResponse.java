package com.factorygrid.iam.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;
import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Account registration response payload")
public class RegistrationResponse {

    @Schema(description = "Success indicator", example = "true")
    private boolean success;

    @Schema(description = "Status message", example = "Buyer account successfully registered")
    private String message;

    @Schema(description = "Created safe user profile")
    private UserProfileResponse user;

    @Schema(description = "Response timestamp")
    @Builder.Default
    private Instant timestamp = Instant.now();
}