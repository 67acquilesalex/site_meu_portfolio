# Codex Instructions

This project is currently a static portfolio site deployed on Vercel.

The admin experience must be treated as inline editing, not as a separate dashboard:

- Public visitors see the normal photography website.
- After admin login, the same website remains visible.
- Extra edit controls appear directly on each album/photo/section.
- The photographer should be able to upload, remove, hide/show, and reorder albums and photos from the page they are viewing.

Current admin behavior is a local mock using `localStorage`. The next real implementation should replace the mock with an optimized Next.js app backed by Firebase on the Spark plan:

- Firebase Auth for admin login.
- Firestore for album/photo metadata, ordering, and visibility.
- Firebase Storage for real image uploads and deletes.
- Next.js Image for optimized display, responsive sizes, lazy loading, and production caching.
- Keep the current visual design and inline admin UX while replacing only the data/upload layer.

Do not rebuild this as a detached enterprise dashboard unless explicitly requested. The core requirement is a photographer editing the live portfolio in context.
