package com.factorygrid.iam;

import com.factorygrid.iam.model.Role;
import com.factorygrid.iam.model.User;
import com.factorygrid.iam.repository.RoleRepository;
import com.factorygrid.iam.repository.UserRepository;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@TestPropertySource(locations = "classpath:application-test.properties")
public class PostgreSqlConnectivityTest {

    @Autowired
    private DataSource dataSource;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private Flyway flyway;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Test
    @DisplayName("1. PostgreSQL DataSource connection succeeds and connects to PostgreSQL 17")
    void testPostgreSqlConnectionSucceeds() throws SQLException {
        assertThat(dataSource).isNotNull();
        try (Connection connection = dataSource.getConnection()) {
            assertThat(connection).isNotNull();
            assertThat(connection.isValid(2)).isTrue();

            DatabaseMetaData metaData = connection.getMetaData();
            assertThat(metaData.getDatabaseProductName()).isEqualToIgnoringCase("PostgreSQL");
            int majorVersion = metaData.getDatabaseMajorVersion();
            assertThat(majorVersion).isGreaterThanOrEqualTo(16);
        }
    }

    @Test
    @DisplayName("2. Application can execute real query 'SELECT 1' against PostgreSQL")
    void testExecuteRealQuery() {
        Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
        assertThat(result).isEqualTo(1);
    }

    @Test
    @DisplayName("3. Flyway migrations are applied and validated on PostgreSQL")
    void testFlywayMigrationsApplied() {
        MigrationInfo[] applied = flyway.info().applied();
        assertThat(applied).isNotEmpty();
        MigrationInfo current = flyway.info().current();
        assertThat(current).isNotNull();
        assertThat(current.getVersion().getVersion()).isEqualTo("1");
    }

    @Test
    @DisplayName("4. Hibernate and Spring Data JPA repositories query real PostgreSQL tables")
    void testJpaRepositoriesQueryPostgreSql() {
        List<Role> roles = roleRepository.findAll();
        assertThat(roles).isNotEmpty();
        assertThat(roles).extracting(Role::getName)
                .contains("ROLE_BUYER", "ROLE_MANUFACTURER", "ROLE_ADMIN");

        long userCount = userRepository.count();
        assertThat(userCount).isGreaterThanOrEqualTo(0);
    }

    @Test
    @DisplayName("5. PostgreSQL native current_database() returns configured test database")
    void testCurrentDatabaseName() {
        String dbName = jdbcTemplate.queryForObject("SELECT current_database()", String.class);
        assertThat(dbName).isEqualTo("factorygrid_test");
    }
}
