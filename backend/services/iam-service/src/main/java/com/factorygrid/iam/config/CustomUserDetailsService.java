package com.factorygrid.iam.config;

import com.factorygrid.iam.model.Role;
import com.factorygrid.iam.model.User;
import com.factorygrid.iam.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
        User user = userRepository.findByUsernameOrEmail(usernameOrEmail, usernameOrEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with identifier: " + usernameOrEmail));

        Set<GrantedAuthority> authorities = new HashSet<>();
        for (Role role : user.getRoles()) {
            authorities.add(new SimpleGrantedAuthority(role.getName()));

            // Canonical role mapping: SUPPLIER <-> MANUFACTURER equivalency in FactoryGrid
            if ("ROLE_SUPPLIER".equalsIgnoreCase(role.getName())) {
                authorities.add(new SimpleGrantedAuthority("ROLE_MANUFACTURER"));
            } else if ("ROLE_MANUFACTURER".equalsIgnoreCase(role.getName())) {
                authorities.add(new SimpleGrantedAuthority("ROLE_SUPPLIER"));
            }
        }

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPasswordHash(),
                user.isAccountActive(),
                true,
                true,
                user.isAccountNonLocked(),
                authorities
        );
    }
}
