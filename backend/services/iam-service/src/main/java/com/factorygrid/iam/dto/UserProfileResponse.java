package com.factorygrid.iam.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Safe user profile representation")
public class UserProfileResponse {

    private Long id;
    private String userCode;
    private String username;
    private String email;
    private String fullName;
    private String phone;
    private String companyName;
    private String companyCode;
    private String department;
    private String jobTitle;
    private String accountStatus;
    private List<String> roles;
    private OffsetDateTime lastLoginAt;
}
