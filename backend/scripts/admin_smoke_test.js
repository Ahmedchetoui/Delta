const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const ADMIN_EMAIL = 'ahmedchetoui987@gmail.com';
const ADMIN_PASSWORD = '200223Ata';

async function main() {
  try {
    // 1) Login admin
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });
    const loginJson = await loginRes.json();
    if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status} ${loginJson.message || ''}`);
    const token = loginJson.token;
    console.log('Login OK, token prefix:', token.slice(0, 16) + '...');

    // Prepare image file
    const tmpDir = path.join(__dirname, 'tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const imgPath = path.join(tmpDir, 'test.png');
    const pngB64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO3h4XkAAAAASUVORK5CYII=';
    fs.writeFileSync(imgPath, Buffer.from(pngB64, 'base64'));

    // 2) Create category
    const catName = `Cat Test Admin ${Date.now()}`;
    const catForm = new FormData();
    catForm.append('name', catName);
    catForm.append('description', 'Cat pour tests');
    const imgBuf = fs.readFileSync(imgPath);
    // Pas d'image pour la catégorie (facultatif)

    const catRes = await fetch(`${BASE_URL}/api/categories`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: catForm
    });
    const catJson = await catRes.json();
    if (!catRes.ok) throw new Error(`Create category failed: ${catRes.status} ${catJson.message || ''}`);
    const catId = catJson.category && catJson.category._id;
    if (!catId) throw new Error('Missing category id');
    console.log('Category created:', catId);

    // 3) Create product
    const prodName = `Produit Test Admin ${Date.now()}`;
    const prodForm = new FormData();
    prodForm.append('name', prodName);
    prodForm.append('description', 'Description produit test admin 12345');
    prodForm.append('price', '99.99');
    prodForm.append('category', catId);
    prodForm.append('images', new Blob([imgBuf], { type: 'image/png' }), 'test.png');
    prodForm.append('variants', JSON.stringify([{ size: 'M', color: 'Black', stock: 10 }]));

    const prodRes = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: prodForm
    });
    const prodJson = await prodRes.json();
    if (!prodRes.ok) throw new Error(`Create product failed: ${prodRes.status} ${prodJson.message || ''}`);
    const prodId = prodJson.product && prodJson.product._id;
    if (!prodId) throw new Error('Missing product id');
    console.log('Product created:', prodId);

    // 4) Verify via search
    const searchRes = await fetch(`${BASE_URL}/api/products?search=${encodeURIComponent(prodName)}&limit=5`);
    const searchJson = await searchRes.json();
    if (!searchRes.ok) throw new Error('Search products failed');
    const found = (searchJson.products || []).some(p => p._id === prodId);
    if (!found) throw new Error('Product not found in search');
    console.log('Product appears in search');

    // 5) Delete product
    const delProdRes = await fetch(`${BASE_URL}/api/products/${prodId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const delProdJson = await delProdRes.json();
    if (!delProdRes.ok) throw new Error(`Delete product failed: ${delProdRes.status} ${delProdJson.message || ''}`);
    console.log('Delete product:', delProdJson.message);

    // 6) Delete category
    const delCatRes = await fetch(`${BASE_URL}/api/categories/${catId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const delCatJson = await delCatRes.json();
    if (!delCatRes.ok) throw new Error(`Delete category failed: ${delCatRes.status} ${delCatJson.message || ''}`);
    console.log('Delete category:', delCatJson.message);

    console.log('Admin smoke test: SUCCESS');
  } catch (err) {
    console.error('Admin smoke test: FAILED');
    console.error(err);
    process.exit(1);
  }
}

main();

