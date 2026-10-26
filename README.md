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

