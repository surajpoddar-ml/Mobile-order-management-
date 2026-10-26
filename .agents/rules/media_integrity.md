# Workspace Rule: Media & Data Integrity Protection

## Rule
1. Under no circumstances should any AI agent add, modify, replace, or delete:
   - Product images or product media URLs
   - Category images or category media URLs
   - Advertisement board media or banners
   - Logos, stickers, or uploaded files
2. All media in `server/uploads/` and `client/public/` is permanent and protected.
3. Keep media rendering stable and resilient without altering database rows or swapping images.
