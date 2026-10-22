# Mobile Spare-Parts Marketplace & Distribution Platform
## User Management, Authentication & RBAC System

A robust, enterprise-grade authentication and user-management foundation for a B2B and B2C mobile spare-parts marketplace. 

---

## 🌟 Key Architecture & Highlights

1. **Two Distinct User Types (+ Super Admin)**:
   - **Customer**: Direct signup, instant active status, immediate login, and access restricted to retail customer-targeted products.
   - **Distributor**: Detailed business signup (PAN/VAT, business address, company name, procurement contact), initially saved in **Pending** status. Awaiting Admin review.
   - **Super Admin**: High-level operational authority to inspect applications, review business documents, approve distributors, reject with specific reasons, suspend accounts with immediate session revocation, and reactivate users.

2. **Strict Multi-Tier Verification**:
   - Pending distributor login triggers: `"Your distributor account is awaiting admin approval."`
   - Rejected distributor login triggers: `"Your distributor registration has been rejected. Please contact the administrator."`
   - Suspended distributor login triggers: `"Your distributor account has been suspended. Please contact the administrator."`
   - Real-time token validation: Active JWT sessions are immediately blocked if an admin marks the user as Suspended.

3. **Portal Segregation & Protected Routes**:
   - `Customer Portal` (`/portal/customer`): Customer profile dossier & catalog filtered strictly for Customer + Both.
   - `Distributor Portal` (`/portal/distributor`): Distributor trade terminal, verified business credentials, and wholesale B2B parts catalog.
   - `Admin Panel` (`/admin`): Metrics dashboard, pending application review workflow, search & multi-status filtering, user suspension controls, and product visibility role matrix audit.
   - Manual URL tampering is blocked on both frontend (RBAC guard) and backend (JWT role-based middleware).

4. **Product Visibility Foundation (Section 5)**:
   - Built-in engine filtering mobile spare-parts (Displays, Batteries, Chargers, Connectors, Earphones, Accessories) based on authenticated caller:
     - `Customer`: Sees `Customer` + `Both`. Distributor-only lots (e.g. 10-pack OLED screens, wholesale charging flex boards) are hidden.
     - `Distributor`: Sees `Distributor` + `Both` with wholesale dealer pricing.
     - `Admin`: Full matrix oversight.

---

## 🚀 Running the Project

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### 1. Server Setup (`/server`)
```bash
cd server
npm install
npm run dev   # Runs on http://localhost:5000 with auto-seeding
```

### 2. Client Setup (`/client`)
```bash
cd client
npm install
npm run dev   # Runs on http://localhost:5173
```

---

## 🔑 Pre-Seeded Test Credentials

Use the **"Test Credentials"** switcher in the navbar to test every scenario:

| Role | Email | Password | Account Status | Expected Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin@sparedepot.com` | `Admin@123` | `Active` | Full Admin Panel access & approvals |
| **Customer** | `customer@example.com` | `Customer@123` | `Active` | Instant access to Customer Portal |
| **Distributor (Approved)** | `approved.dist@mobilecare.com` | `Distributor@123` | `Active` | Access to Wholesale Distributor Portal |
| **Distributor (Pending)** | `pending.dist@speedyfix.com` | `Distributor@123` | `Pending` | 403: "Awaiting admin approval" |
| **Distributor (Rejected)** | `rejected.dist@fakeparts.com` | `Distributor@123` | `Rejected` | 403: "Registration has been rejected" |
| **Distributor (Suspended)** | `suspended.dist@latepay.com` | `Distributor@123` | `Suspended` | 403: "Account has been suspended" |

---

## 🗄️ Database Structure (`users` table)

- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `userId`: TEXT UNIQUE (e.g. `ADM-001`, `CUST-101`, `DIST-201`)
- `fullName`: TEXT NOT NULL
- `email`: TEXT UNIQUE NOT NULL
- `phoneNumber`: TEXT NOT NULL
- `passwordHash`: TEXT NOT NULL (bcrypt hashed with salt rounds 10)
- `userType`: TEXT NOT NULL (`Customer` \| `Distributor` \| `Admin`)
- `accountStatus`: TEXT NOT NULL (`Pending` \| `Active` \| `Rejected` \| `Suspended`)
- `profileInfo`: TEXT
- `createdDate`: TEXT ISO timestamp
- `updatedDate`: TEXT ISO timestamp
- `lastLogin`: TEXT ISO timestamp
- `approvalDate`: TEXT ISO timestamp
- `approvedBy`: TEXT (Admin email)
- `businessName`: TEXT (Distributor)
- `businessAddress`: TEXT (Distributor)
- `panVatNumber`: TEXT (Distributor)
- `contactPerson`: TEXT (Distributor)
- `businessPhone`: TEXT (Distributor)
- `businessEmail`: TEXT (Distributor)
- `statusRemark`: TEXT (Admin rejection / suspension remarks)

---

## 🔒 Security Best Practices Implemented
- Passwords are salted and hashed with **bcryptjs** (never stored in plain text).
- Duplicate email registrations are checked and rejected.
- Email and phone formatting are validated on both client and server.
- All roles and permissions are enforced on the backend via JWT token verification and database lookups.
- Suspended users immediately lose authorization even if their JWT has not expired.
