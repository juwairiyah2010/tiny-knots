const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Serve static site files (index.html, css, assets)
app.use(express.static(path.join(__dirname)));

// If a React client build exists, serve it
const clientDist = path.join(__dirname, 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  // fallback to client index for non-API routes (client-side routing)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

const db = require('./db');

// APIs using SQLite-backed db helper
app.get('/api/products', async (req, res) => {
  try {
    const q = req.query.q || '';
    const category = req.query.category || '';
    const list = await db.getProducts(q, category);
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const p = await db.getProduct(id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json(p);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

app.post('/api/cart', async (req, res) => {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    const cart = await db.createCart(items);
    res.json({ success: true, cartId: cart.id, cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

app.get('/api/cart/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const cart = await db.getCart(id);
    if (!cart) return res.status(404).json({ error: 'Cart not found' });
    res.json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

app.post('/api/order', async (req, res) => {
  try {
    const { cartId, name, email } = req.body || {};
    const order = await db.createOrder(Number(cartId), name, email);
    res.json({ success: true, order });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || 'server error' });
  }
});

app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
