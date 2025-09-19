const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const Category = require('../models/Category');
const Product = require('../models/Product');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const ADMIN_EMAIL = 'ahmedchetoui987@gmail.com';
const ADMIN_PASSWORD = '200223Ata';

async function main() {
  let cat; let prod;
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/delta-fashion';
    await mongoose.connect(uri);

    // Create category directly in DB
    cat = new Category({ name: `CatTemp ${Date.now()}`, description: 'temp' });
    await cat.save();

    // Create product directly in DB
    prod = new Product({
      name: `ProdTemp ${Date.now()}`,
      description: 'Produit pour test suppression',
      price: 10,
      images: ['dummy.png'],
      category: cat._id,
      variants: [{ size: 'M', color: 'Black', stock: 2 }],
      totalStock: 2
    });
    await prod.save();

    console.log('DB: Produit créé:', prod._id.toString());

    // Login admin
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });
    const loginJson = await loginRes.json();
    if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status} ${loginJson.message || ''}`);
    const token = loginJson.token;

    // Delete via API
    const delRes = await fetch(`${BASE_URL}/api/products/${prod._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const delJson = await delRes.json();
    if (!delRes.ok) throw new Error(`Delete product failed: ${delRes.status} ${delJson.message || ''}`);

    console.log('API: Suppression produit:', delJson.message);
    console.log('Admin delete test: SUCCESS');
  } catch (err) {
    console.error('Admin delete test: FAILED');
    console.error(err);
    process.exitCode = 1;
  } finally {
    // clean
    if (prod) {
      try { await Product.findByIdAndDelete(prod._id); } catch {}
    }
    if (cat) {
      try { await Category.findByIdAndDelete(cat._id); } catch {}
    }
    await mongoose.disconnect().catch(() => {});
  }
}

main();

