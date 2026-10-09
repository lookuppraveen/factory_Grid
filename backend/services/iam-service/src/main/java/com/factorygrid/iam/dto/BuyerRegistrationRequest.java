package com.factorygrid.iam.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Buyer account registration payload")
public class BuyerRegistrationRequest {

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @Schema(description = "Unique username for the buyer account", example = "vikram.sethi")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    @Schema(description = "Work email address", example = "v.sethi@apexpharma.com")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters long")
    @Schema(description = "Account password (min 8 characters)", example = "SecurePass@2026")
    private String password;

    @NotBlank(message = "Full name is required")
    @Schema(description = "Full name of authorized procurement officer", example = "Dr. Vikram Sethi")
    private String fullName;

    @Schema(description = "Contact phone number", example = "+91 98112 34567")
    private String phone;

    @NotBlank(message = "Company name is required")
    @Schema(description = "Registered buyer organization name", example = "Apex Pharma Ltd")
    private String companyName;

    @Schema(description = "Company code (optional, will be generated if empty)", example = "BUY-2026-001")
    private String companyCode;

    @Schema(description = "Department name", example = "Global Sourcing & Supply Chain")
    private String department;

    @Schema(description = "Job title / Designation", example = "Chief Procurement Officer (CPO)")
    private String jobTitle;
}