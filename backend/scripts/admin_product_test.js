const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const Category = require('../models/Category');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const ADMIN_EMAIL = 'ahmedchetoui987@gmail.com';
const ADMIN_PASSWORD = '200223Ata';

async function main() {
  let cat; 
  try {
    // DB connect to create a category directly
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/delta-fashion';
    await mongoose.connect(uri);

    const name = `TempCat ${Date.now()}`;
    cat = new Category({ name, description: 'Cat pour test produits' });
    await cat.save();
    console.log('DB: catégorie créée', cat._id.toString());

    // Login admin via API
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });
    const loginJson = await loginRes.json();
    if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status} ${loginJson.message || ''}`);
    const token = loginJson.token;
    console.log('Login OK, token prefix:', token.slice(0, 16) + '...');

    // Prepare image
    const imgB64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO3h4XkAAAAASUVORK5CYII=';
    const imgBuf = Buffer.from(imgB64, 'base64');

    // Create product via API (multipart)
    const prodName = `Produit Test API ${Date.now()}`;
    const form = new FormData();
    form.append('name', prodName);
    form.append('description', 'Description produit test admin 12345');
    form.append('price', '49.99');
    form.append('category', cat._id.toString());
    form.append('variants', JSON.stringify([{ size: 'M', color: 'Black', stock: 5 }]));
    form.append('images', new Blob([imgBuf], { type: 'image/png' }), 't.png');

    const createRes = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form
    });
    const createJson = await createRes.json();
    if (!createRes.ok) throw new Error(`Create product failed: ${createRes.status} ${createJson.message || ''}`);
    const prodId = createJson.product && createJson.product._id;
    if (!prodId) throw new Error('Missing product id');
    console.log('Produit créé:', prodId);

    // Verify search
    const searchRes = await fetch(`${BASE_URL}/api/products?search=${encodeURIComponent(prodName)}&limit=5`);
    const searchJson = await searchRes.json();
    const found = (searchJson.products || []).some(p => p._id === prodId);
    if (!found) throw new Error('Product not found in search');
    console.log('Produit trouvé via recherche');

    // Delete product
    const delRes = await fetch(`${BASE_URL}/api/products/${prodId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const delJson = await delRes.json();
    if (!delRes.ok) throw new Error(`Delete product failed: ${delRes.status} ${delJson.message || ''}`);
    console.log('Suppression produit:', delJson.message);

  } catch (err) {
    console.error('Admin product test FAILED');
    console.error(err);
    process.exitCode = 1;
  } finally {
    if (cat) {
      try {
        await Category.findByIdAndDelete(cat._id);
        console.log('DB: catégorie supprimée');
      } catch {}
    }
    await mongoose.disconnect().catch(() => {});
  }
}

main();

