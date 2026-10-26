# CRITICAL WORKSPACE RULES & MEDIA PROTECTION PROTOCOL

> **MANDATORY NOTICE FOR ALL AI AGENTS & CODING SESSIONS:**
> This repository contains live, production-critical data and admin-managed media assets for MWS EAGLE.
> The rules in this file are permanent, absolute, and must be strictly followed on EVERY prompt.

---

## 1. MEDIA & IMAGE PRESERVATION (ABSOLUTELY PROTECTED)
- **DO NOT TOUCH, MODIFY, ADD, OR DELETE ANY IMAGES OR VIDEOS:**
  - Product images (`p.imageUrl`, `productForm.imageUrl`)
  - Category images (`cat.imageUrl`, `categoryForm.imageUrl`)
  - Advertisement board banners and videos (`advertisements` table, `mediaUrl`)
  - Promotional stickers (`stickers` table)
  - Brand logos (`/mws_eagle_logo.jpg`, `/uploads/mws_eagle_logo.jpg`)
  - Payment QR codes (`/mws_payment_qr.png`, `/uploads/mws_payment_qr.png`)
  - Any files located inside `server/uploads/` or `client/public/`.
- **NO DEFAULT/PLACEHOLDER INJECTION:**
  - Do NOT inject random Unsplash, Mixkit, or external stock photos unless explicitly commanded with exact URLs.
  - Do NOT strip or replace existing fallback URLs that already protect components from rendering blank cards.
  - Do NOT replace `<img>` or `<video>` elements with empty `display: 'none'` containers that turn into black boxes.

---

## 2. DATABASE & SEED INTEGRITY
- **NO AUTO-OVERWRITE OR PURGING OF USER DATA:**
  - Never execute `DROP TABLE`, `TRUNCATE`, or destructive `DELETE` queries on `products`, `categories`, `advertisements`, `stickers`, `orders`, or `users`.
  - In `server/src/database/seed.js` and `db.js`, do NOT add auto-seeding logic that overwrites admin-uploaded items.
  - Admin content created in the Admin Panel is permanent.

---

## 3. UI/UX THEME FIDELITY
- The dark blue theme and reference layout are fixed.
- Do NOT redesign, reorder, or alter layout grids, spacing, or color variables unless explicitly requested in the prompt.
- When fixing an issue in one component, touch **ONLY** the exact bug and do not modify unrelated components.
