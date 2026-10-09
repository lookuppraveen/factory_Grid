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
@Schema(description = "Manufacturer account registration payload")
public class ManufacturerRegistrationRequest {

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @Schema(description = "Unique username for manufacturer account", example = "rajesh.sharma")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    @Schema(description = "Official corporate email address", example = "mfg@sunbiotech.com")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters long")
    @Schema(description = "Account password (min 8 characters)", example = "SecurePass@2026")
    private String password;

    @NotBlank(message = "Full name is required")
    @Schema(description = "Authorized plant/factory manager full name", example = "Rajesh Sharma")
    private String fullName;

    @Schema(description = "Contact phone number", example = "+91 98223 45678")
    private String phone;

    @NotBlank(message = "Company name is required")
    @Schema(description = "Registered manufacturing company name", example = "Sun Biotech Laboratories")
    private String companyName;

    @Schema(description = "Manufacturer code (optional, will be generated if empty)", example = "MFG-2026-001")
    private String companyCode;

    @Schema(description = "Department name", example = "Manufacturing & Plant Operations")
    private String department;

    @Schema(description = "Job title / Designation", example = "Plant Vice President")
    private String jobTitle;

    @Schema(description = "Factory details / facility summary", example = "WHO-GMP Certified Sterile Injectables Unit, Baddi")
    private String factoryDetails;
}