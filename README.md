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
