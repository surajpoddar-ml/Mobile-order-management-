# PERMANENT MASTER DEVELOPMENT RULES – MWS EAGLE ECOMMERCE PROJECT

> **CRITICAL: READ AND FOLLOW THESE INSTRUCTIONS BEFORE MAKING ANY CODE MODIFICATIONS. THESE RULES APPLY TO ALL CURRENT AND FUTURE DEVELOPMENT TASKS IN THIS PROJECT.**

Project technology:
- Frontend: React
- Backend: Node.js + Express
- Database: MySQL
- Existing application: Admin Panel, Customer/User Panel, Distributor Panel.

The existing application is already developed and deployed. Your responsibility is to extend or modify requested functionality without damaging existing features, media, files, folders, or integrations.

---

## 1. PERMANENT PROTECTION OF OFFICIAL MWS EAGLE PRODUCT IMAGES

This is the highest-priority rule.

The following files are official MWS Eagle product photographs, NOT dummy images, NOT placeholders, and NOT disposable fallback assets:
- `client/public/cat_charger.jpg`
- `client/public/cat_data_cable.jpg`
- `client/public/cat_neckband.jpg`
- `client/public/cat_earbud.jpg`
- `client/public/cat_bt_speaker.jpg`
- All other existing `client/public/cat_*.jpg` files.

The existing `getProductFallbackImage` function is also essential application functionality.

**ABSOLUTELY PROHIBITED:**
- Removing `getProductFallbackImage`.
- Disabling existing fallback logic.
- Replacing category images with blank icons.
- Replacing images with Package icons or other generic icons.
- Using `display: none` to hide missing images.
- Replacing original product photographs with random images.
- Changing existing image paths or URLs unnecessarily.
- Deleting, renaming, moving, compressing, or overwriting existing image files.
- Changing product-to-image associations.
- Modifying existing media-storage configurations without explicit authorization.

These official product photographs must remain available whenever an individual product does not have its own custom-uploaded image.

---

## 2. EXISTING IMAGE PRIORITY LOGIC MUST REMAIN INTACT

Preserve the existing image-resolution behavior:
1. If an administrator has uploaded a custom product image, display that image.
2. If no custom product image exists, use the corresponding official MWS Eagle category image through `getProductFallbackImage`.
3. Never replace a valid image with a blank icon or unrelated image.

This behavior must remain consistent across:
- Admin Panel.
- Customer/User Panel.
- Distributor Panel.
- Homepage and product listings.
- Product details and category sections.

Do not redesign or rewrite the image-resolution system.

---

## 3. STRICT SINGLE-FILE DEVELOPMENT POLICY

Every new task must follow strict file-scope isolation.

Before editing:
1. Understand the exact feature requested.
2. Identify the exact component or file responsible for that feature.
3. Inspect its existing implementation.
4. Identify whether the requested modification genuinely requires another file.
5. Avoid unrelated changes.

**Default rule: Modify only the exact requested file or component.**

| Requested functionality | Default scope |
|---|---|
| Distributor Registration | `AuthPage.jsx` or the existing registration component |
| Warranty QR | `AdminProductWarranty.jsx` or the existing warranty component |
| Customer messaging | Existing customer messaging component |
| Distributor messaging | Existing distributor messaging component |
| Admin messaging | Existing admin messaging component |
| Product management | Existing product-management component |

Do not unnecessarily modify:
- `CustomerPortal.jsx`
- `DistributorPortal.jsx`
- `LandingPage.jsx`
- `AdminPanel.jsx`
- `api.js`
- Shared media components.
- Shared image resolvers.
- Global CSS.
- Unrelated backend APIs.

Only expand the scope when technically necessary for the requested functionality. If additional files are genuinely required, explain why before modifying them.

---

## 4. NO UNREQUESTED GLOBAL AUDITS OR REFACTORING

Never independently decide to:
- Clean up image-rendering logic.
- Remove fallback functionality.
- Refactor all portal components.
- Rewrite shared API utilities.
- Redesign the dashboard.
- Reorganize the folder structure.
- Replace existing components.
- Change global styling.
- Modify unrelated business logic.

Do not revive previously completed or abandoned tasks unless explicitly requested again. The latest user instruction determines the task.

---

## 5. ADMIN PANEL PROTECTION

The Admin Panel is the central control system. Preserve all existing functionality, including:
- Product management & product categories.
- Product images and videos.
- Advertisement Board & banner management.
- Product pricing and discounts.
- Customer management & distributor management.
- Order management & inventory.
- Rewards and QR offers.
- Warranty management.
- Dashboard and analytics.
- Existing database relationships.

Never modify admin functionality as a side effect of an unrelated customer or distributor feature.

---

## 6. CUSTOMER / USER PANEL PROTECTION

Preserve:
- Homepage & product catalog.
- Official category photographs & custom product photographs.
- Search & category navigation.
- Product details, cart & checkout.
- Payment functionality & customer authentication.
- Orders and tracking.
- Existing advertisements.
- Responsive layouts.

Do not change existing customer functionality unless the current task explicitly requires it.

---

## 7. DISTRIBUTOR PANEL PROTECTION

Preserve:
- Distributor authentication & registration.
- Distributor dashboard.
- Product catalog & product photographs.
- Pricing, cart and checkout.
- Order placement & order history.
- Distributor profile.
- Existing APIs and integrations.

Modify only the specific distributor functionality requested.

---

## 8. BACKEND AND DATABASE SAFETY

- Preserve existing Node.js and Express routes.
- Preserve MySQL tables and relationships.
- Avoid unnecessary schema migrations.
- Never delete historical records.
- Maintain backward compatibility.
- Preserve existing authentication and authorization.
- Do not change unrelated APIs.
- Validate all new backend functionality.
- Keep existing order, pricing, and inventory operations intact.
- Never execute `DROP TABLE`, `TRUNCATE`, or destructive `DELETE` queries on `products`, `categories`, `advertisements`, `stickers`, `orders`, or `users`.

---

## 9. GIT AND DEPLOYMENT SAFETY

Before every development task:
- Inspect `git status`.
- Identify uncommitted changes.
- Preserve the current working state.
- Review the relevant commit history when necessary.
- Never use destructive Git commands without explicit authorization.
- Never force-push without explicit authorization.
- Never overwrite existing work.
- Do not deploy unverified modifications.

If an existing feature is broken, investigate the actual cause rather than replacing the entire implementation.

---

## 10. REQUIRED DEVELOPMENT WORKFLOW

Follow this process for every future task:
1. **STEP 1 – Understand**: Read the latest request and identify exactly what needs to change.
2. **STEP 2 – Locate**: Find the existing file responsible for the requested functionality.
3. **STEP 3 – Protect**: Identify protected components, images, APIs, and dependencies.
4. **STEP 4 – Modify**: Implement the smallest possible change.
5. **STEP 5 – Verify**: Check frontend compilation, backend compatibility, image rendering, and ensure zero unrelated file modifications.
6. **STEP 6 – Report**: Provide exact files modified, exact functionality changed, and tests performed.

---

## 11. PERMANENT PROHIBITIONS

Never repeat these previous mistakes:
1. Never remove official `cat_*.jpg` assets.
2. Never remove or disable `getProductFallbackImage`.
3. Never replace original photographs with generic icons.
4. Never modify 8–10 files for a simple one-file task.
5. Never rewrite entire portal components unnecessarily.
6. Never modify Admin Panel functionality without authorization.
7. Never break Customer Panel functionality.
8. Never break Distributor Panel functionality.
9. Never overwrite existing uploaded media.
10. Never perform unrequested global refactoring.
11. Never recreate existing files when a targeted edit is sufficient.
12. Never assume existing fallback photographs are dummy images.

---

## 12. FINAL PERMANENT INSTRUCTION

These rules are permanent project-level development constraints:
- Follow the latest requested task.
- Preserve all existing functionality.
- Preserve every original MWS Eagle product photograph.
- Preserve `getProductFallbackImage`.
- Maintain the original product-to-image mapping.
- Follow strict single-file scope wherever possible.
- Avoid touching unrelated components.
- Protect the Admin, Customer, and Distributor Panels.
- Never introduce changes that were not requested.

**SUCCESS MEANS IMPLEMENTING THE REQUESTED FEATURE WHILE KEEPING THE REST OF THE EXISTING APPLICATION EXACTLY AS IT WAS.**
