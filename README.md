# CoreHub

> **A Secure, Peer-to-Peer Electronics Hardware Marketplace for University Engineering Students**

CoreHub is a full-stack web platform built for Faculty of Engineering students to exchange, sell, swap, and borrow microcontrollers, sensors, communication modules, development boards, and laboratory equipment. It streamlines hardware access across engineering departments, prevents component hoarding, promotes sustainable lab equipment reuse, and provides administrative oversight with role-based moderation.

---

## Table of Contents

1. [Main Features](#main-features)
2. [Technology Stack](#technology-stack)
3. [User Roles and Permissions](#user-roles-and-permissions)
4. [Repository Structure](#repository-structure)
5. [Prerequisites](#prerequisites)
6. [Backend Setup & Configuration](#backend-setup--configuration)
7. [Frontend Setup & Startup](#frontend-setup--startup)
8. [Automated Testing & Production Build](#automated-testing--production-build)
9. [SUPER_ADMIN Provisioning Procedure](#super_admin-provisioning-procedure)
10. [Core Workflows](#core-workflows)
11. [Security & Privacy Architecture](#security--privacy-architecture)
12. [Submission Screenshot Checklist](#submission-screenshot-checklist)

---

## Main Features

- **Institutional Authentication**: Registration and sign-in strictly requiring verified Faculty of Engineering institutional email addresses (`egXXXXXX@engug.ruh.ac.lk`) and academic student registration IDs (`EG/XXXX/XXXX`).
- **Official Engineering Department Selection**: Enforces student department selection from the five official faculty departments:
  1. Electrical and Information Engineering
  2. Civil and Environmental Engineering
  3. Marine Engineering and Naval Architecture
  4. Mechanical and Manufacturing Engineering
  5. Computer Engineering
- **Component Marketplace**: Real-time keyword search, category filtering (Microcontrollers, Sensors, Actuators, Power, Wireless, Tools), and listing type categorization (`SELL`, `SWAP`, `BORROW`).
- **Listing Management**: Students can create, edit, activate, mark sold/swapped, or delete their own hardware listings with strict guardrails against deleting items with active holds.
- **24-Hour Reservation & Borrowing Workflow**: Atomic, concurrent-safe reservations with automated background expiration tracking (24-hour holds), handover confirmations, and cancellations.
- **Student Privacy & Contact Shielding**: Seller contact phone and email are shielded from the public catalog and only revealed to a verified peer student during an active reservation hold.
- **Student Profile Management**: Dedicated `/profile` route allowing authenticated students to view academic credentials and update personal details (Full Name, Contact Phone, and Department) with immediate synchronization across navigation.
- **Multi-Admin Dashboard**: Dedicated `/admin` console with four administrative tabs:
  - **Overview Metrics**: Total students, active listings, held reservations, and administrator counts.
  - **User & Role Management**: Student directory with searchable records and role appointment/revocation.
  - **Listing Moderation**: Inspection of listings with suspension reasons and one-click reinstatement.
  - **Audit Trail**: Tamper-evident logging of administrative actions with admin identity, action type, target ID, and timestamp.

---

## Technology Stack

### Backend
- **Language**: Java 26 (JDK 21+ compatible)
- **Framework**: Spring Boot 4.1.1 (Spring Framework 7)
- **Security**: Spring Security, Stateless JWT with JJWT 0.12.6, BCrypt Password Hashing
- **Persistence**: Spring Data JPA, Hibernate ORM
- **Database**: MySQL 8.0 (Production / Dev), H2 Database (In-Memory for Isolation Testing)
- **Build Tool**: Apache Maven 3.9+
- **Unit & Integration Testing**: JUnit 5, Mockito, Spring Boot Test, Spring MVC MockMvc

### Frontend
- **Library**: React 18 (`react`, `react-dom`)
- **Language**: TypeScript 5.6
- **Routing**: React Router DOM v6
- **Build Tool**: Vite 6
- **Icons**: Lucide React
- **Styling**: Pure CSS with accessible design system tokens, responsive grid layouts, and dark navigation theme
- **Unit Testing**: Vitest 2.1, React Testing Library, `@testing-library/jest-dom`, jsdom

---

## User Roles and Permissions

CoreHub implements a strict, hierarchical three-tier role model:

| Role | Description | Key Authorities |
| :--- | :--- | :--- |
| **`USER`** | Default role assigned to all registered students | • Browse public marketplace<br>• Create and manage personal listings (`SELL`, `SWAP`, `BORROW`)<br>• Reserve available components (24h hold)<br>• Complete or cancel personal reservations<br>• View and edit personal profile (`/profile`) |
| **`ADMIN`** | Appointed by `SUPER_ADMIN` to moderate content | • All `USER` permissions<br>• Access Admin Dashboard (`/admin`)<br>• View platform overview analytics<br>• Moderate/suspend offensive or prohibited listings<br>• Reinstate suspended listings<br>• View student directory (read-only)<br>• View administrative audit logs |
| **`SUPER_ADMIN`** | The sole project owner account | • All `ADMIN` and `USER` permissions<br>• Appoint registered `USER` accounts as `ADMIN`<br>• Revoke `ADMIN` role back to `USER`<br>• Enforces the single project owner invariant (`countByRole == 1`) |

### Critical Security Boundaries:
1. Public registration always assigns `USER`. No public endpoint or request parameter can register an `ADMIN` or `SUPER_ADMIN`.
2. Ordinary `ADMIN` accounts cannot appoint administrators, revoke administrators, alter their own roles, or modify the `SUPER_ADMIN`.
3. The `SUPER_ADMIN` role cannot be revoked or assigned through ordinary APIs.

---

## Repository Structure

```text
CoreHub-New/
├── .env.example                          # Root environment template with secure placeholders
├── .gitignore                            # Standard git ignore rules (build, dependencies, IDE)
├── README.md                             # Comprehensive project documentation
├── backend/                              # Spring Boot REST API
│   ├── pom.xml                           # Maven project configuration and dependencies
│   └── src/
│       ├── main/
│       │   ├── java/com/corehub/backend/
│       │   │   ├── BackendApplication.java       # Spring Boot main application class
│       │   │   ├── controller/                   # REST API controllers (Admin, Auth, Component, etc.)
│       │   │   ├── dto/                          # Request and response data transfer objects
│       │   │   ├── entity/                       # JPA entities (User, Component, Reservation, Audit, Lock)
│       │   │   ├── exception/                    # Global exception handler and custom exceptions
│       │   │   ├── repository/                   # Spring Data JPA repositories
│       │   │   ├── security/                     # JWT filter, authentication manager, security config
│       │   │   └── service/                      # Business logic, schedulers, and provisioning
│       │   └── resources/
│       │       └── application.properties        # Application configuration template
│       └── test/                                 # 171 JUnit 5 and Mockito automated tests
└── frontend/                             # React 18 TypeScript Single Page Application
    ├── package.json                      # NPM scripts and frontend dependencies
    ├── vite.config.ts                    # Vite dev server and proxy configuration
    ├── tsconfig.json                     # TypeScript compiler configuration
    └── src/
        ├── api/                          # HTTP client and TypeScript interfaces
        ├── components/                   # Reusable components (Navbar, ProtectedRoute, AdminRoute)
        ├── context/                      # React AuthContext providing session state
        ├── pages/                        # Views (Marketplace, Details, Login, Register, Admin, Profile)
        └── test/                         # 114 Vitest automated test suites
```

---

## Prerequisites

Before running CoreHub, ensure the following software is installed on your workstation:

1. **Java Development Kit (JDK)**: Version 21 or later (Tested on Oracle JDK 26.0.2 / OpenJDK 21)
2. **Apache Maven**: Version 3.8.0 or later (Tested on Maven 3.9.16)
3. **Node.js**: Version 18.0.0 or later (Tested on Node.js v24.12.0)
4. **npm**: Version 9.0.0 or later (Tested on npm 11.6.2)
5. **MySQL Server**: Version 8.0 or later (Running on port 3306)

---

## Backend Setup & Configuration

### 1. Database Configuration
CoreHub connects to a MySQL database named `corehub_db`. 
Hibernate is configured with `ddl-auto=update` and `createDatabaseIfNotExist=true`. **No manual database creation or SQL schema execution is required.** Tables (`users`, `components`, `reservations`, `admin_audit_logs`, `system_locks`) are automatically generated and synchronized on startup.

> [!NOTE]
> **No Seed Data**: Hibernate schema initialization creates the required database tables, indices, and foreign keys automatically, but does **not** insert demo users, listings, or reservations. Fresh installations start with an empty database. All users, listings, and reservations are created through the application's student registration and administrative workflows.

### 2. Environment Variables
The backend reads configuration through system environment variables or Maven `-D` parameters:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `DB_HOST` | `localhost` | MySQL server host |
| `DB_PORT` | `3306` | MySQL server port |
| `DB_NAME` | `corehub_db` | MySQL database name |
| `DB_USERNAME` | `root` | MySQL user account |
| `DB_PASSWORD` | *(empty)* | MySQL user password |
| `SERVER_PORT` | `8080` | Spring Boot HTTP server port |
| `JWT_SECRET` | *(required)* | Base64-encoded HMAC-SHA256 secret key (minimum 32 bytes) |
| `JWT_EXPIRATION_MS` | `3600000` | JWT token validity in milliseconds (default: 1 hour) |
| `RESERVATION_EXPIRY_HOURS` | `24` | Automatic expiration threshold for reservations |

### 3. Generate a Secure JWT Secret (Windows PowerShell)
The application strictly enforces cryptographic randomness for JWT signing. Generate a 256-bit Base64 secret:

```powershell
# Generate a cryptographically random 32-byte Base64 key
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
$env:JWT_SECRET = [Convert]::ToBase64String($bytes)
Remove-Variable bytes
```

> [!IMPORTANT]
> **Token Invalidation on Key Rotation**: Generating a new `JWT_SECRET` changes the cryptographic signing key, which immediately invalidates any previously issued login tokens. Authenticated users will be prompted to log in again upon restarting the server with a new key.

### 4. Start the Backend Server
Set your local credentials and run via Maven:

```powershell
cd E:\CEng\CoreHub-New\backend

# Set local database credentials (replace with your local credentials)
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "your_mysql_password_here"

# Start the Spring Boot application
mvn spring-boot:run
```

The backend server starts at `http://localhost:8080`.
Verify backend health: `http://localhost:8080/api/health` returns `{"status":"UP","application":"CoreHub"}`.

---

## Frontend Setup & Startup

The frontend communicates with the backend via Vite's built-in development proxy (`/api` $\rightarrow$ `http://localhost:8080`).

### 1. Configure Frontend Environment
In the `frontend` directory, ensure `.env` exists:

```powershell
cd E:\CEng\CoreHub-New\frontend
Copy-Item .env.example .env
```

Contents of `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:8080
```

### 2. Install Dependencies

```powershell
npm install
```

### 3. Start Development Server

```powershell
npm run dev
```

The frontend application will start and listen at **`http://localhost:5173/`**.

---

## Automated Testing & Production Build

CoreHub includes comprehensive automated testing across both frontend and backend suites.

### 1. Run Backend Tests (Maven)

```powershell
cd E:\CEng\CoreHub-New\backend
mvn test
```
- **Result**: **171/171 tests passed** (0 failures, 0 errors).
- Integrates in-memory H2 database for transactional concurrency tests and isolated Mockito suites for security filters, services, and REST controllers.

### 2. Run Frontend Tests (Vitest)

```powershell
cd E:\CEng\CoreHub-New\frontend
npm test -- --run
```
- **Result**: **114/114 tests passed** across all 16 test files.
- Tests routing, authentication state, administrative authorization guards, modal actions, and edge cases.

### 3. Build Frontend for Production

```powershell
cd E:\CEng\CoreHub-New\frontend
npm run build
```
- **Result**: Executes `tsc -b && vite build`. Generates an optimized production bundle in `frontend/dist/`.

---

## SUPER_ADMIN Provisioning Procedure

CoreHub does not permit public sign-ups for administrators. To establish the sole **`SUPER_ADMIN`** project owner account without hardcoding credentials:

> [!IMPORTANT]
> **Separate One-Time Procedure**: SUPER_ADMIN provisioning is an isolated, **one-time administrative setup procedure**, not a routine application startup step. Once the initial project owner account is provisioned, the backend permanently enforces the singleton invariant (`countByRole == 1`). Routine server startups and daily development should always be run with `mvn spring-boot:run` without setting any provisioning environment variables.

> [!WARNING]
> **Confidentiality Warning**: Never commit, publish, or share real student registration numbers, institutional emails, database passwords, or JWT secrets in scripts, documentation, or public repositories. All examples in this documentation use generic placeholders (`EG/XXXX/XXXX`, `egXXXXXX@engug.ruh.ac.lk`).

1. **Register Normally**:
   Open `http://localhost:5173/register` and create an ordinary student account using your official institutional email and registration ID.
2. **Execute One-Time Provisioning**:
   In your terminal, provide your account identifier via the one-time local environment variable:

```powershell
cd E:\CEng\CoreHub-New\backend
$accountIdentifier = Read-Host "Enter your registered email or student ID"
$env:COREHUB_PROVISION_SUPERADMIN_IDENTIFIER = $accountIdentifier
mvn spring-boot:run
```

3. **Automatic System Lock & Invariant Protection**:
   - The backend acquires a pessimistic database lock on `SystemLock`.
   - Confirms that exactly zero `SUPER_ADMIN` accounts exist.
   - Promotes the matching student record to `SUPER_ADMIN`.
   - Records the event in `admin_audit_logs`.
   - Any subsequent attempt to provision a second `SUPER_ADMIN` is permanently rejected.
4. **Cleanup Environment Variable**:
```powershell
Remove-Item Env:COREHUB_PROVISION_SUPERADMIN_IDENTIFIER -ErrorAction SilentlyContinue
Remove-Variable accountIdentifier -ErrorAction SilentlyContinue
```

---

## Core Workflows

### 1. Student User Workflow
1. **Registration**: Student navigates to `/register`, enters name, student ID (`EG/XXXX/XXXX`), phone, selects an official engineering department, and enters university email (`egXXXXXX@engug.ruh.ac.lk`).
2. **Browsing Hardware**: Student explores `/marketplace`, filtering by category or keyword, and inspecting component pinouts and seller condition notes at `/components/:id`.
3. **Listing Hardware**: Under `/my-listings`, students post excess components specifying pricing model (`SELL`, `SWAP`, or `BORROW`).
4. **Reserving Components**: A student clicks "Reserve Component", placing a 24-hour hold. The seller's contact details (phone, email) are immediately unlocked to coordinate exchange.
5. **Handover Completion**: After physical exchange, the seller clicks "Complete Handover", transferring the listing to `SOLD` or `SWAPPED`.

### 2. Administrative Workflow
1. **Authentication**: `ADMIN` or `SUPER_ADMIN` logs in and sees the **Admin** shield link in the top navigation.
2. **Analytics Inspection**: The administrator views active platform counts, listings, and reservations.
3. **Content Moderation**: Under the **Listings** tab, administrators review flagged hardware, suspend non-compliant listings with a recorded reason, or reinstate listings once rectified.
4. **User Promotion (`SUPER_ADMIN` only)**: Under the **Users** tab, the project owner appoints an active student as `ADMIN` or revokes administrative status.
5. **Audit Review**: Under the **Audit Log** tab, administrators inspect chronological audit records documenting all administrative actions.

---

## Security & Privacy Architecture

- **Stateless Authorization**: JWT bearer tokens signed with HMAC-SHA256 (`HS256`). Security context is validated per-request with no server-side session persistence.
- **Credential Protection**: Passwords hashed with BCrypt (strength factor 10). Passwords are never returned in DTOs or logged.
- **Strict Role-Based Access Control (RBAC)**: Enforced through Spring Security method security annotations (`@PreAuthorize("hasRole('SUPER_ADMIN')")`) and route URL matchers.
- **Frontend Route Protection**: `ProtectedRoute` and `AdminRoute` guards intercept navigation, verify token existence, inspect decoded JWT roles, and redirect unauthorized visitors.
- **Input Validation & Sanitization**: Strict Jakarta Validation annotations (`@NotBlank`, `@Pattern`, `@Size`) enforce data integrity on both frontend and backend.
- **Pessimistic Serialization Locking**: Dedicated `SystemLock` database table prevents race conditions during administrative promotion and email corrections.
- **Zero Real Credentials in Repository**: All example configurations, documentation, and automated tests use generic mock placeholders (`Kasun Perera`, `EG/XXXX/XXXX`, `egXXXXXX@engug.ruh.ac.lk`).

---

## Submission Screenshot Checklist

For final project report and presentation documentation, capture the following application views:

1. **User Sign In (`/login`)**: Displaying institutional email placeholder and clean authentication form.
2. **User Registration (`/register`)**: Showing the 5-department dropdown, format hints, and field validations.
3. **Marketplace Catalog (`/marketplace`)**: Displaying component cards with search bar, category pills, and listing type badges (`SELL`, `SWAP`, `BORROW`).
4. **Component Details (`/components/:id`)**: Showing hardware specifications, working condition, and student privacy notice.
5. **Student Listing Management (`/my-listings`)**: Displaying active student listings, status filters, and "Add New Component" modal.
6. **Student Reservations (`/my-reservations`)**: Showing active 24-hour hold timers, status badges, and revealed peer seller contact details.
7. **Student Profile (`/profile`)**: Showing user details, single-line role badge, non-editable academic credentials, and editable personal fields.
8. **Admin Dashboard Overview (`/admin` - Tab 1)**: Displaying platform metric cards (Total Users, Active Listings, Active Reservations, Administrators).
9. **Admin User & Role Directory (`/admin` - Tab 2)**: Showing student table with "Appoint Admin" / "Revoke Admin" buttons for `SUPER_ADMIN`.
10. **Admin Listing Moderation (`/admin` - Tab 3)**: Showing listing moderation controls with suspension reason dialog.
11. **Admin Audit Trail (`/admin` - Tab 4)**: Showing chronological administrative audit log records.

> **Privacy Reminder**: Ensure test data or sample accounts used for demonstration screenshots contain only generic names (`Kasun Perera`) and placeholder student IDs.
