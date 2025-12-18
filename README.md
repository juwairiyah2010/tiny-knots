# Tiny Knots — Local Dev

This workspace contains a static front-end and a small Express API for local development.

Run locally:

1. Install dependencies

```bash
cd /Users/juwairiyah/Desktop/website
npm install
```

2. Start server

```bash
npm start
# or for auto-reload during development (needs nodemon):
npm run dev
```

The server serves the static files and exposes APIs under `/api`:

- `GET /api/products` — list products (supports `?q=` and `?category=`)
- `GET /api/products/:id` — product detail
- `POST /api/cart` — create a simple cart (body: `{ items: [{ productId, quantity }] }`)
- `GET /api/cart/:id` — fetch cart
- `POST /api/order` — mock order creation

Open http://localhost:3000 in your browser.

Adding product images (Pinterest or other URLs)
---------------------------------------------

- If you want to add products that use image URLs (Pinterest or elsewhere), edit `scripts/add_products_from_urls.js` and populate the `productsToAdd` array with objects: `{ title, price, image, category, description }`.

- WARNING: Only add images you have the right to use. Pinterest images are often copyrighted — do not use them publicly without permission. Prefer images from Unsplash/Pexels or your own uploads.

- Run the script to insert products into the SQLite DB:

```bash
node scripts/add_products_from_urls.js
```

The script uses the `createProduct` helper and will seed the DB entries. After adding products, open `/products.html` or the React client to see them.
