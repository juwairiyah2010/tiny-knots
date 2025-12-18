/*
  Admin script: bulk-insert products by URL (Pinterest or other image hosts).

  WARNING: Only add images you have the right to use. Pinterest images are often
  copyrighted by their authors — hotlinking or using them without permission may
  violate copyright. Prefer using images you own or that are licensed for reuse
  (Unsplash, Pexels, Pixabay, or your own uploads).

  Usage:
    node scripts/add_products_from_urls.js

  Edit the `productsToAdd` array below with image URLs and product metadata.
*/

const db = require('../db');

const productsToAdd = [
  // Example entries. Replace image URLs with Pinterest URLs if you have rights.
  // { title: 'Pinterest Cute Keychain', price: 299, image: 'https://i.pinimg.com/originals/aa/bb/cc/example.jpg', category: 'Keychains', description: 'From Pinterest (ensure you have rights)'}
  // Safe example using an Unsplash image:
  { title: 'Pastel Crochet Decor', price: 550, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&q=80&auto=format&fit=crop', category: 'Decor', description: 'Sample image from Unsplash (free to use).'},
];

async function run() {
  try {
    for (const p of productsToAdd) {
      const created = await db.createProduct(p.title, p.price, p.image, p.category || '', p.description || '');
      console.log('Created product:', created.id, created.title);
    }
    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Error adding products:', err);
    process.exit(1);
  }
}

run();
