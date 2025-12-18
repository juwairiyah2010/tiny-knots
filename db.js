const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.sqlite');
const db = new sqlite3.Database(DB_PATH);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function init() {
  await run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY,
    title TEXT,
    price INTEGER,
    image TEXT,
    category TEXT,
    description TEXT
  )`);

  await run(`CREATE TABLE IF NOT EXISTS carts (
    id INTEGER PRIMARY KEY,
    createdAt INTEGER
  )`);

  await run(`CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY,
    cart_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    FOREIGN KEY(cart_id) REFERENCES carts(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY,
    cart_id INTEGER,
    name TEXT,
    email TEXT,
    total INTEGER,
    createdAt INTEGER
  )`);

  const row = await get('SELECT COUNT(1) as c FROM products');
  if (!row || row.c === 0) {
    const seed = [
      ['Crochet Strawberry Keychain', 250, '/assets/crochet.jpeg', 'Keychains', 'Tiny strawberry keychain, handmade.'],
      ['Cute Crochet Phone Case', 500, 'https://i.ibb.co/fY2R3Kf/crochet2.jpg', 'Phone Cases', 'Pastel crochet phone case.'],
      ['Mini Earpods Case', 300, 'https://i.ibb.co/ZL0PnWs/crochet3.jpg', 'Accessories', 'Soft earpods pouch.'],
      ['Pastel Coaster Set', 450, '/assets/cute.jpeg', 'Home', 'Set of 4 pastel coasters.'],
      ['Amigurumi Bunny', 750, 'https://i.ibb.co/2k2mX9B/crochet4.jpg', 'Toys', 'Handmade amigurumi bunny.'],
      ['Crochet Garland', 600, 'https://i.ibb.co/7QhKf9S/crochet5.jpg', 'Decor', 'Cute garland to brighten rooms.']
    ];
    const stmt = db.prepare('INSERT INTO products (title, price, image, category, description) VALUES (?,?,?,?,?)');
    for (const p of seed) stmt.run(p);
    stmt.finalize();
  }
}

async function getProducts(query = '', category = '') {
  let sql = 'SELECT * FROM products';
  const params = [];
  const clauses = [];
  if (query) {
    clauses.push('(lower(title) LIKE ? OR lower(description) LIKE ?)');
    params.push('%' + query.toLowerCase() + '%', '%' + query.toLowerCase() + '%');
  }
  if (category) {
    clauses.push('lower(category) = ?');
    params.push(category.toLowerCase());
  }
  if (clauses.length) sql += ' WHERE ' + clauses.join(' AND ');
  return all(sql, params);
}

async function getProduct(id) {
  return get('SELECT * FROM products WHERE id = ?', [id]);
}

async function createCart(items = []) {
  const now = Date.now();
  const res = await run('INSERT INTO carts (createdAt) VALUES (?)', [now]);
  const cartId = res.lastID;
  for (const it of items) {
    const pid = Number(it.productId);
    const qty = Number(it.quantity) || 1;
    await run('INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?,?,?)', [cartId, pid, qty]);
  }
  return getCart(cartId);
}

async function getCart(cartId) {
  const cart = await get('SELECT * FROM carts WHERE id = ?', [cartId]);
  if (!cart) return null;
  const items = await all(`SELECT ci.id, ci.quantity, p.id as productId, p.title, p.price, p.image
    FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.cart_id = ?`, [cartId]);
  return { id: cart.id, createdAt: cart.createdAt, items: items.map(i => ({ product: { id: i.productId, title: i.title, price: i.price, image: i.image }, quantity: i.quantity })) };
}

async function createOrder(cartId, name, email) {
  const cart = await getCart(cartId);
  if (!cart) throw new Error('Cart not found');
  const total = cart.items.reduce((s, it) => s + it.product.price * it.quantity, 0);
  const now = Date.now();
  const res = await run('INSERT INTO orders (cart_id, name, email, total, createdAt) VALUES (?,?,?,?,?)', [cartId, name || null, email || null, total, now]);
  return { orderId: res.lastID, cartId, name, email, total };
}

async function createProduct(title, price, image, category, description) {
  const res = await run('INSERT INTO products (title, price, image, category, description) VALUES (?,?,?,?,?)', [title, price, image, category, description]);
  const id = res.lastID;
  return getProduct(id);
}

module.exports = { init, getProducts, getProduct, createCart, getCart, createOrder, createProduct };

// Initialize DB on require
init().catch(err => console.error('DB init error', err));
