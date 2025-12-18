document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('product-grid');
  const searchInput = document.querySelector('.search-filter input');
  const sortSelect = document.querySelector('.search-filter select');
  const productDetailRoot = document.getElementById('product-detail');
  const cartRoot = document.getElementById('cart-root');
  let products = [];

  function money(n) { return '₹' + Number(n).toLocaleString(); }

  async function fetchProducts() {
    const q = searchInput ? searchInput.value.trim() : '';
    const res = await fetch('/api/products' + (q ? '?q=' + encodeURIComponent(q) : ''));
    return res.json();
  }

  function renderGrid(list) {
    if (!grid) return;
    grid.innerHTML = '';
    list.forEach(p => {
      const card = document.createElement('article');
      card.className = 'product-card';
      card.innerHTML = `
        <img src="${p.image}" alt="${p.title}">
        <h3>${p.title}</h3>
        <p class="price">${money(p.price)}</p>
        <div class="actions">
          <button class="primary" data-id="${p.id}">Add to Cart</button>
          <button class="ghost" data-id="${p.id}">View</button>
        </div>
      `;
      grid.appendChild(card);
    });
    grid.querySelectorAll('.primary').forEach(btn => btn.addEventListener('click', (e) => {
      const id = Number(e.currentTarget.dataset.id);
      addToCart(id);
    }));
    grid.querySelectorAll('.ghost').forEach(btn => btn.addEventListener('click', (e) => {
      const id = Number(e.currentTarget.dataset.id);
      window.location.href = `product.html?id=${id}`;
    }));
  }

  async function loadGrid() {
    try {
      products = await fetchProducts();
      if (sortSelect) sortProducts();
      renderGrid(products);
    } catch (err) { console.error(err); }
  }

  async function addToCart(productId, qty = 1) {
    try {
      const res = await fetch('/api/cart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: [{ productId, quantity: qty }] }) });
      const data = await res.json();
      if (data && data.success) {
        // Save last cart id locally for simple cart flow
        localStorage.setItem('lastCartId', data.cartId);
        alert('Added to cart — cart id ' + data.cartId);
      } else {
        alert('Could not add to cart');
      }
    } catch (e) { alert('Network error'); }
  }

  function sortProducts() {
    const v = sortSelect.value;
    if (!products) return;
    if (v.includes('Low')) products.sort((a,b)=>a.price-b.price);
    if (v.includes('High')) products.sort((a,b)=>b.price-a.price);
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => loadGrid());
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', () => { sortProducts(); renderGrid(products); });
  }

  /* Product detail page */
  async function loadProductDetail() {
    if (!productDetailRoot) return;
    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get('id')) || null;
    if (!id) { productDetailRoot.innerHTML = '<p>Product not found</p>'; return; }
    try {
      const res = await fetch('/api/products/' + id);
      if (!res.ok) { productDetailRoot.innerHTML = '<p>Not found</p>'; return; }
      const p = await res.json();
      productDetailRoot.innerHTML = `
        <div style="display:flex;gap:20px;flex-wrap:wrap;align-items:flex-start;">
          <div style="flex:1;min-width:260px"><img src="${p.image}" alt="${p.title}" style="width:100%;border-radius:12px;object-fit:cover"></div>
          <div style="flex:1;min-width:260px">
            <h1>${p.title}</h1>
            <p style="color:#666">${p.description || ''}</p>
            <p class="price" style="font-size:20px;color:#ff6fa4;font-weight:700">${money(p.price)}</p>
            <div style="margin-top:12px">
              <button id="add-single" class="primary">Add to Cart</button>
              <a href="cart.html" style="margin-left:12px;display:inline-block;padding:10px 14px;border-radius:10px;border:1px solid #eee;text-decoration:none;color:inherit">View Cart</a>
            </div>
          </div>
        </div>
      `;
      document.getElementById('add-single').addEventListener('click', () => addToCart(p.id, 1));
    } catch (err) { console.error(err); productDetailRoot.innerHTML = '<p>Error loading product</p>'; }
  }

  /* Cart page */
  async function loadCartPage() {
    if (!cartRoot) return;
    const lastCart = localStorage.getItem('lastCartId');
    if (!lastCart) {
      cartRoot.innerHTML = '<p>Your cart is empty.</p>';
      return;
    }
    try {
      const res = await fetch('/api/cart/' + lastCart);
      if (!res.ok) { cartRoot.innerHTML = '<p>Cart not found.</p>'; return; }
      const cart = await res.json();
      if (!cart.items || !cart.items.length) { cartRoot.innerHTML = '<p>Your cart is empty.</p>'; return; }
      let total = 0;
      const rows = cart.items.map(it => {
        const line = it.product.price * it.quantity; total += line;
        return `<div style="display:flex;gap:12px;align-items:center;padding:12px;border-bottom:1px solid #f3eaf2">
          <img src="${it.product.image}" style="width:84px;height:84px;object-fit:cover;border-radius:10px">
          <div style="flex:1"><strong>${it.product.title}</strong><div style="color:#777">${money(it.product.price)} × ${it.quantity}</div></div>
        </div>`;
      }).join('');
      cartRoot.innerHTML = `
        <h2>Your Cart</h2>
        <div>${rows}</div>
        <div style="text-align:right;margin-top:12px"><strong>Total: ${money(total)}</strong></div>
        <form id="checkout-form" style="margin-top:16px;display:flex;flex-direction:column;gap:8px;max-width:420px">
          <input name="name" placeholder="Your name" required style="padding:10px;border-radius:8px;border:1px solid #f0dff0">
          <input name="email" type="email" placeholder="Email" required style="padding:10px;border-radius:8px;border:1px solid #f0dff0">
          <button type="submit" class="primary">Place order</button>
        </form>
        <div id="checkout-result" style="margin-top:12px"></div>
      `;
      document.getElementById('checkout-form').addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const fd = new FormData(ev.target);
        const name = fd.get('name');
        const email = fd.get('email');
        const res2 = await fetch('/api/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cartId: cart.id, name, email }) });
        const json = await res2.json();
        if (json && json.success) {
          document.getElementById('checkout-result').innerHTML = `<div style="padding:12px;border-radius:10px;background:#f7fff7">Order confirmed: ${json.order.orderId}</div>`;
          localStorage.removeItem('lastCartId');
        } else {
          document.getElementById('checkout-result').innerHTML = `<div style="padding:12px;border-radius:10px;background:#fff6f6">Could not place order</div>`;
        }
      });
    } catch (err) { console.error(err); cartRoot.innerHTML = '<p>Error loading cart</p>'; }
  }

  // Boot logic: detect which page we're on
  if (productDetailRoot) {
    loadProductDetail();
  } else if (cartRoot) {
    loadCartPage();
  } else if (grid) {
    loadGrid();
  }
});
