# Codex Instructions

This project is currently a static portfolio site deployed on Vercel.

The admin experience must be treated as inline editing, not as a separate dashboard:

- Public visitors see the normal photography website.
- After admin login, the same website remains visible.
- Extra edit controls appear directly on each album/photo/section.
- The photographer should be able to upload, remove, hide/show, and reorder albums and photos from the page they are viewing.

Current admin behavior uses Firebase directly from the static site:

- Firebase Auth for admin login.
- Firestore for album/photo metadata, ordering, and visibility.
- Firebase Storage for real image uploads and deletes.
- Keep the current visual design and inline admin UX while replacing only the data/upload layer.

A future Next.js migration can improve image optimization with Next.js Image, responsive sizes, lazy loading, and production caching, but it must keep the same inline editing model.

Do not rebuild this as a detached enterprise dashboard unless explicitly requested. The core requirement is a photographer editing the live portfolio in context.
