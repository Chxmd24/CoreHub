# CoreHub Frontend Application

CoreHub is a peer-to-peer electronics components marketplace designed specifically for engineering students and makers. This frontend application provides a fast, responsive, and accessible interface for browsing, listing, and reserving microcontrollers, sensors, communication modules, and lab hardware.

---

## Tech Stack

- **Framework**: React 18 with TypeScript 5
- **Build Tool**: Vite 6
- **Routing**: React Router v6 (`react-router-dom`)
- **Icons**: Lucide React
- **Unit Testing**: Vitest 2 with React Testing Library and `@testing-library/jest-dom`
- **Styling**: Pure CSS with responsive design system custom tokens, accessible states, and dark engineering aesthetic

---

## Directory Structure

```text
frontend/
├── .env.example              # Environment variables template
├── index.html                # Single-page HTML entry point
├── package.json              # Project scripts and dependencies
├── tsconfig.json             # Root TypeScript project references
├── tsconfig.app.json         # Application TypeScript configuration
├── tsconfig.node.json        # Node / Vite TypeScript configuration
├── vite.config.ts            # Vite & Vitest configuration
├── README.md                 # Setup and run documentation
└── src/
    ├── api/
    │   ├── types.ts          # DTOs, enums (ListingType, ComponentStatus, ReservationStatus), models
    │   ├── client.ts         # Centralized API client with JWT bearer handling & endpoint mapping
    │   └── client.test.ts    # API client unit tests
    ├── components/
    │   ├── common/
    │   │   ├── LoadingState.tsx      # Accessible loading spinner & message
    │   │   ├── LoadingState.test.tsx # LoadingState unit tests
    │   │   ├── ErrorState.tsx        # Accessible error card with retry/return home
    │   │   └── ErrorState.test.tsx   # ErrorState unit tests
    │   └── layout/
    │       ├── Navbar.tsx            # Header navbar with brand, responsive links & mobile toggle
    │       ├── Navbar.test.tsx       # Navbar unit tests
    │       ├── Footer.tsx            # Community links, attribution, faculty trust info
    │       └── PageLayout.tsx        # Common page structure wrapping Navbar, main, Footer
    ├── pages/
    │   ├── HomePage.tsx              # Landing page, value pillars, categories, live backend probe
    │   ├── MarketplacePage.tsx       # Filterable component catalog with search & tag filters
    │   ├── ComponentDetailPage.tsx   # Hardware specification view, peer safety notice, reservation CTA
    │   ├── LoginPage.tsx             # Institutional student login form
    │   ├── RegisterPage.tsx          # Student account registration with faculty department picker
    │   ├── DashboardPage.tsx         # Student metrics, active listings & reservation summary
    │   ├── MyListingsPage.tsx        # Student listing management with status tabs & actions
    │   ├── MyReservationsPage.tsx    # 24h hold overview with privacy-guarded peer contact reveal
    │   └── NotFoundPage.tsx          # Accessible 404 page with marketplace redirect
    ├── test/
    │   └── setup.ts          # Vitest testing environment setup (@testing-library/jest-dom)
    ├── App.css               # Component-specific styles (hero, cards, badges, navbar, forms)
    ├── App.tsx               # Route declarations and root layout
    ├── App.test.tsx          # Application routing unit tests
    ├── index.css             # Design system tokens, reset, typography, and utility classes
    ├── main.tsx              # React DOM mounting entry point
    └── vite-env.d.ts         # Vite client type definitions
```

---

## Route Overview

| Route | Page | Purpose |
| :--- | :--- | :--- |
| `/` | `HomePage` | Campus introduction, category navigation, live backend status check |
| `/marketplace` | `MarketplacePage` | Browse and filter hardware listings with real-time search |
| `/components/:id` | `ComponentDetailPage` | Detailed component specifications, 24-hour reservation action |
| `/login` | `LoginPage` | Student authentication with institutional email |
| `/register` | `RegisterPage` | Student registration with registration number and department |
| `/dashboard` | `DashboardPage` | Overview of active listings, pending reservations, trust metrics |
| `/my-listings` | `MyListingsPage` | Manage own component listings, edit status, safe deletion guard |
| `/my-reservations` | `MyReservationsPage` | Active 24h holds and exchange history with privacy shielding |
| `*` | `NotFoundPage` | Friendly 404 handler with return home / marketplace actions |

---

## Getting Started (Windows PowerShell)

### Prerequisites

- **Node.js**: v18.0.0 or later (v24.12+ recommended)
- **npm**: v9.0.0 or later (v11.6+ recommended)

### 1. Environment Configuration

Copy the example environment file:

```powershell
Copy-Item .env.example .env
```

Default configuration in `.env`:

```env
# CoreHub Spring Boot Backend API Base URL
VITE_API_BASE_URL=http://localhost:8080
```

### 2. Install Dependencies

```powershell
npm install
```

> **Tip**: Standard `npm install` uses your default network settings. If you previously configured an internal campus proxy in `~/.npmrc` (e.g. `10.50.x.x`) that is unreachable when off-campus, you can bypass it with:
> `npm install --proxy=null --https-proxy=null`

### 3. Run Development Server

```powershell
npm run dev
```

The application will start at `http://localhost:5173/`.

### 4. Run Automated Unit Tests

Run all unit tests once:

```powershell
npm test
```

Run tests in watch mode during development:

```powershell
npm run test:watch
```

### 5. Build for Production

Run the TypeScript type checker and Vite production bundler:

```powershell
npm run build
```

The compiled and optimized bundle will be generated in `dist/`.

### 6. Preview Production Build

Preview the production build locally:

```powershell
npm run preview
```

---

## Backend Integration Details

The API client (`src/api/client.ts`) targets the Spring Boot backend (`http://localhost:8080` by default):

- **Health Check**: `GET /api/health`
- **Authentication**:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
- **Users**:
  - `GET /api/users/me`
- **Components**:
  - `GET /api/components` (supports `search`, `category`, `listingType`, `status`, `page`, `size`)
  - `GET /api/components/{id}`
  - `GET /api/components/mine`
  - `POST /api/components`
  - `PUT /api/components/{id}`
  - `DELETE /api/components/{id}`
- **Reservations**:
  - `POST /api/reservations`
  - `GET /api/reservations/{id}`
  - `GET /api/reservations/mine`
  - `GET /api/reservations/received`
  - `PATCH /api/reservations/{id}/cancel`
  - `PATCH /api/reservations/{id}/complete`

---

## Privacy & Security Considerations

- **Institutional Domain**: The UI guides users toward faculty domains (e.g. `@eng.pdn.ac.lk`).
- **Contact Shielding**: Peer contact information (phone, email) is only displayed for active reservations (`ReservationStatus.ACTIVE`). Once a hold is `COMPLETED`, `CANCELLED`, or `EXPIRED`, peer contact details are automatically hidden to protect student privacy.
- **Conflict Handling**: Listing deletion safeguards against removing components with active holds (HTTP 409 Conflict).
