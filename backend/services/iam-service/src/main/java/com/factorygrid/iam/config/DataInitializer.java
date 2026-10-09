package com.factorygrid.iam.config;

import com.factorygrid.iam.model.Role;
import com.factorygrid.iam.model.User;
import com.factorygrid.iam.repository.RoleRepository;
import com.factorygrid.iam.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${bootstrap.admin.enabled:false}")
    private boolean bootstrapAdminEnabled;

    @Value("${bootstrap.admin.username:admin}")
    private String adminUsername;

    @Value("${bootstrap.admin.email:admin@factorygrid.com}")
    private String adminEmail;

    @Value("${bootstrap.admin.password:}")
    private String adminPassword;

    @Override
    @Transactional
    public void run(String... args) {
        initRoles();
        if (bootstrapAdminEnabled) {
            bootstrapAdminUser();
        }
    }

    private void initRoles() {
        List<String[]> rolesToEnsure = List.of(
                new String[]{"ROLE_BUYER", "Procurement Buyer Role for purchasing entities"},
                new String[]{"ROLE_SUPPLIER", "Manufacturer / Supplier Role for manufacturing units"},
                new String[]{"ROLE_MANUFACTURER", "Canonical Manufacturer Role mapping to Supplier"},
                new String[]{"ROLE_ADMIN", "Platform System Administrator with governance access"},
                new String[]{"ROLE_COMPLIANCE_OFFICER", "Regulatory and Compliance Desk Officer"},
                new String[]{"ROLE_SALES_MANAGER", "Sales and RFQ Management Officer"},
                new String[]{"ROLE_ACCOUNTS_MANAGER", "Finance and Invoicing Officer"},
                new String[]{"ROLE_FACTORY_BUDDY", "Factory Floor and Logistics Field Agent"}
        );

        for (String[] r : rolesToEnsure) {
            if (!roleRepository.existsByName(r[0])) {
                roleRepository.save(new Role(r[0], r[1]));
                log.info("Initialized role: {}", r[0]);
            }
        }
    }

    private void bootstrapAdminUser() {
        if (adminPassword == null || adminPassword.isBlank()) {
            throw new IllegalStateException(
                    "bootstrap.admin.enabled=true but BOOTSTRAP_ADMIN_PASSWORD is not set. Refusing to create an admin with a default password.");
        }
        if (userRepository.existsByUsername(adminUsername) || userRepository.existsByEmail(adminEmail)) {
            log.info("Bootstrap admin user already exists. Skipping initialization to preserve existing account.");
            return;
        }

        Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                .orElseGet(() -> roleRepository.save(new Role("ROLE_ADMIN", "Platform System Administrator")));

        User admin = User.builder()
                .userCode("USR-ADM-001")
                .username(adminUsername)
                .email(adminEmail)
                .fullName("System Administrator")
                .passwordHash(passwordEncoder.encode(adminPassword))
                .companyName("FactoryGrid Platform")
                .companyCode("FG-HQ-001")
                .department("Executive IT & Security")
                .jobTitle("Super Administrator")
                .accountStatus("ACTIVE")
                .failedLoginAttempts(0)
                .roles(Set.of(adminRole))
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build();

        userRepository.save(admin);
        log.info("Securely bootstrapped initial administrator account: {}", adminUsername);
    }
}
