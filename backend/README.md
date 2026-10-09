# FactoryGrid Backend — Microservices Architecture

Welcome to the backend architecture for **FactoryGrid**, a B2B pharmaceutical procurement platform. The backend follows a clean, modular microservice architecture patterned after the AgriLink reference structure, tailored specifically to FactoryGrid pharmaceutical domain models and security requirements.

---

## Phase 1 Implementation: IAM (Identity & Access Management)

In this initial phase, only the **IAM Microservice (`iam-service`)** is implemented. Domain business services (Compliance, Advisory, Catalog, Orders) will be introduced in subsequent phases.

### Directory Structure

```text
FactoryGrid/
├── frontend/                                   # Existing React + TypeScript + Vite frontend
├── backend/
│   ├── infrastructure/                         # API Gateway, Config Server, Service Discovery (Phase 2+)
│   ├── services/
│   │   └── iam-service/                        # Phase 1: Identity & Access Management Service
│   │       ├── pom.xml
│   │       ├── mvnw / mvnw.cmd / .mvn/
│   │       ├── src/
│   │       │   ├── main/
│   │       │   │   ├── java/com/factorygrid/iam/
│   │       │   │   │   ├── config/             # SecurityConfig, JwtUtil, SwaggerConfig, DataInitializer
│   │       │   │   │   ├── controller/         # AuthController, BuyerTestController, ManufacturerTestController, AdminTestController
│   │       │   │   │   ├── dto/                # LoginRequest, AuthResponse, RefreshTokenRequest, UserProfileResponse
│   │       │   │   │   ├── exception/          # GlobalExceptionHandler, Custom exceptions, ErrorResponse
│   │       │   │   │   ├── model/              # User, Role, RefreshToken entities
│   │       │   │   │   ├── repository/         # UserRepository, RoleRepository, RefreshTokenRepository
│   │       │   │   │   ├── service/            # AuthService, RefreshTokenService
│   │       │   │   │   └── IamApplication.java
│   │       │   │   └── resources/
│   │       │   │       ├── application.properties
│   │       │   │       └── db/migration/
│   │       │   │           └── V1__init_iam_schema.sql
│   │       │   └── test/
│   │       │       ├── java/com/factorygrid/iam/
│   │       │       │   ├── IamSecurityAndAuthTest.java
│   │       │       │   └── UserRepositoryTest.java
│   │       │       └── resources/
│   │       │           └── application-test.properties
│   └── README.md
```

---

## Technology Stack

- **Runtime & Language**: Java 17
- **Framework**: Spring Boot 3.3.4
- **Security**: Spring Security 6 (Stateless, Method Security, BCrypt 12 rounds)
- **Token Security**: JJWT 0.12.6 (HMAC-SHA512 / HMAC-SHA256)
- **Persistence**: Spring Data JPA & Hibernate 6.5
- **Database**: PostgreSQL 17
- **Database Migration**: Flyway (Versioned SQL migrations, non-destructive)
- **Documentation**: Springdoc OpenAPI / Swagger UI 2.6.0
- **Build Tool**: Apache Maven 3.9 (Self-contained Maven Wrapper provided)

---

## Environment Variables

The IAM microservice connects to PostgreSQL using environment variables. Passwords and secrets are externalized and never committed to source control.

| Variable Name | Description | Default (Local Dev) |
|---|---|---|
| `DB_HOST` | PostgreSQL Host | `localhost` |
| `DB_PORT` | PostgreSQL Port | `5432` |
| `DB_NAME` | Database Name | `factorygrid` |
| `DB_USERNAME` | PostgreSQL User | `postgres` |
| `DB_PASSWORD` | PostgreSQL Password | (configured in local env) |
| `SERVER_PORT` | HTTP Port for IAM Service | `8081` |
| `JWT_SECRET` | 256/512-bit Secret Key for JWT Signing | Configured (minimum 32 characters) |
| `JWT_EXPIRATION_MS` | Access Token Validity Duration | `86400000` (24 Hours) |
| `JWT_REFRESH_EXPIRATION_MS` | Refresh Token Validity Duration | `604800000` (7 Days) |
| `CORS_ALLOWED_ORIGINS` | Permitted Frontend Origins | `http://localhost:5173,http://localhost:3000,http://localhost:4173` |
| `BOOTSTRAP_ADMIN_ENABLED` | Enable initial admin account creation | `false` (set `true` on first boot) |

---

## PostgreSQL Database Schema

Managed via Flyway migration `V1__init_iam_schema.sql`:

1. **`roles`**:
   - `id` (BIGSERIAL PRIMARY KEY)
   - `name` (VARCHAR(50) UNIQUE)
   - `description` (VARCHAR(255))
   - `created_at` (TIMESTAMPTZ)
   - Canonical Seed Roles: `ROLE_BUYER`, `ROLE_SUPPLIER`, `ROLE_MANUFACTURER`, `ROLE_ADMIN`, `ROLE_COMPLIANCE_OFFICER`, `ROLE_SALES_MANAGER`, `ROLE_ACCOUNTS_MANAGER`, `ROLE_FACTORY_BUDDY`.

2. **`users`**:
   - `id` (BIGSERIAL PRIMARY KEY)
   - `user_code` (VARCHAR(50) UNIQUE)
   - `username` (VARCHAR(100) UNIQUE)
   - `email` (VARCHAR(150) UNIQUE)
   - `password_hash` (VARCHAR(255) — BCrypt)
   - `full_name`, `phone`, `company_name`, `company_code`, `department`, `job_title`
   - `account_status` (VARCHAR(30) — 'ACTIVE', 'INACTIVE', 'SUSPENDED')
   - `failed_login_attempts` (INT — locks after 5 attempts)
   - `account_locked_until` (TIMESTAMPTZ)
   - `last_login_at`, `created_at`, `updated_at`

3. **`user_roles`**:
   - `(user_id, role_id)` compound primary key and foreign keys with ON DELETE CASCADE.

4. **`refresh_tokens`**:
   - `id` (BIGSERIAL PRIMARY KEY)
   - `token` (VARCHAR(255) UNIQUE)
   - `user_id` (BIGINT REFERENCES users)
   - `expiry_date` (TIMESTAMPTZ)
   - `revoked` (BOOLEAN)
   - `created_at` (TIMESTAMPTZ)

---

## Local Startup & Execution

### 1. Build and Run Tests
```powershell
cd backend/services/iam-service
.\mvnw.cmd clean test
```

### 2. Package Executable JAR
```powershell
.\mvnw.cmd clean verify
```

### 0. Configure secrets (required)
`DB_PASSWORD` and `JWT_SECRET` have **no defaults**; the service refuses to start without them.
```powershell
copy services\iam-service\.env.example services\iam-service\.env   # git-ignored
# edit .env, then from the repo root:
..\scripts\start-iam.ps1 -Test    # tests
..\scripts\start-iam.ps1          # run
```
Configuration lives in `src/main/resources/application.yml`.

### 3. Run Microservice
```powershell
# Using Maven Wrapper
.\mvnw.cmd spring-boot:run

# OR using Java executable JAR
java -jar target/iam-service-1.0.0-SNAPSHOT.jar
```

---

## Swagger / OpenAPI Testing

- **Swagger UI**: [http://localhost:8081/swagger-ui/index.html](http://localhost:8081/swagger-ui/index.html)
- **OpenAPI JSON**: [http://localhost:8081/v3/api-docs](http://localhost:8081/v3/api-docs)

### API Endpoints Summary

| Method | Endpoint | Access Level | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Public | Authenticate via PostgreSQL, returns JWT + Refresh Token |
| `POST` | `/api/v1/auth/refresh` | Public | Rotate refresh token and obtain new JWT |
| `POST` | `/api/v1/auth/logout` | Public | Revoke refresh token and end session |
| `GET` | `/api/v1/auth/me` | Authenticated | Retrieve profile and assigned roles |
| `GET` | `/api/v1/buyer/dashboard` | `ROLE_BUYER` | Buyer procurement portal (Manufacturers get 403) |
| `GET` | `/api/v1/manufacturer/dashboard` | `ROLE_SUPPLIER`, `ROLE_MANUFACTURER` | Manufacturer workspace (Buyers get 403) |
| `GET` | `/api/v1/admin/users` | `ROLE_ADMIN` | Governance endpoints (Non-admins get 403) |

---

## Role Isolation & Security Verification

Automated test suite (`IamSecurityAndAuthTest.java`) covers:
1. Successful PostgreSQL login returning JWT without password hash.
2. Invalid password rejection (401 Unauthorized).
3. Unknown user rejection (401 Unauthorized without account enumeration).
4. Inactive account rejection (403 Forbidden).
5. Locked account rejection (423 Locked).
6. Buyer strictly denied access to Manufacturer endpoints (403 Forbidden).
7. Manufacturer strictly denied access to Buyer endpoints (403 Forbidden).
8. Non-admins strictly denied access to Admin APIs (403 Forbidden).
9. Unauthenticated requests denied (401 Unauthorized).
10. Current user profile extraction from JWT SecurityContext.
11. Refresh token rotation and logout revocation.