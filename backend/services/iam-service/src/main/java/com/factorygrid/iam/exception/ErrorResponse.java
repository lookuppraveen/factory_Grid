package com.factorygrid.iam.exception;

import lombok.*;
import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ErrorResponse {
    private int status;
    private String error;
    private String message;
    @Builder.Default
    private Instant timestamp = Instant.now();
    private String path;
}
