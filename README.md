# mOOn.com — Campus Ecommerce for Ghanaian Colleges

> Shop campus-only or go nationwide. Textbooks, food, fashion, electronics — everything delivered.

---

## Project Structure

```
moon-app/
├── backend/          # Express + MongoDB API
│   ├── models/       # Mongoose schemas (User, Shop, Product, Order)
│   ├── routes/       # auth, shops, products, orders, admin
│   ├── middleware/   # JWT auth + role guard
│   ├── config/       # DB connection
│   └── server.js     # Entry point
│
└── frontend/         # React app
    └── src/
        ├── api/       # Axios API client
        ├── context/   # AuthContext, CartContext
        └── pages/     # LandingPage, StorePage, AuthPage, VendorPage, AdminPage
```

---

## Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env — set MONGODB_URI and JWT_SECRET

npm install
npm run dev         # nodemon on port 5000
```

### API Endpoints

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | /api/auth/register | Public | Register student/vendor |
| POST | /api/auth/login | Public | Login |
| GET | /api/auth/me | Auth | Get current user |
| PATCH | /api/auth/preferences | Auth | Update campus/scope preference |
| GET | /api/shops | Public | List shops (filtered by campus/scope) |
| POST | /api/shops | Vendor | Create shop |
| PATCH | /api/shops/:id | Vendor | Update shop |
| GET | /api/products | Public | List products (filtered by campus/scope) |
| POST | /api/products | Vendor | Add product |
| PATCH | /api/products/:id | Vendor | Update product |
| DELETE | /api/products/:id | Vendor | Delete product |
| POST | /api/orders | Customer | Place order |
| GET | /api/orders | Auth | List orders |
| PATCH | /api/orders/:id/status | Vendor | Update order status |
| GET | /api/admin/stats | Admin | Dashboard stats |
| GET | /api/admin/shops | Admin | All shops |
| PATCH | /api/admin/shops/:id/verify | Admin | Verify/unverify shop |
| GET | /api/admin/users | Admin | All users |

---

## Frontend Setup

```bash
cd frontend
npm install
npm start           # React app on port 3000
```

Proxy is configured to forward /api requests to localhost:5000.

### Pages

| Route | Page | Notes |
|-------|------|-------|
| / | LandingPage | Marketing homepage |
| /shop | StorePage | Main storefront with campus/nationwide toggle |
| /login | AuthPage | Sign in |
| /register | AuthPage | Register (student or vendor) |
| /vendor | VendorPage | Vendor dashboard (protected) |
| /admin | AdminPage | Admin dashboard (protected) |

---

## Key Feature: Campus vs Nationwide Scope

Users set their **shop preference** on registration (or update it anytime):

- **Campus mode** → shows only shops on the user's selected campus + nationwide shops
- **Nationwide mode** → shows all verified shops across Ghana

Vendors also set their **shop scope**:
- `campus` → only visible to students on that campus
- `region` → visible regionally
- `nationwide` → visible to all students in Ghana

---

## Seeding an Admin

After starting the server, create an admin via MongoDB directly or add a seed script:

```js
// seed-admin.js (run once)
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  await User.create({
    name: 'Admin',
    email: 'admin@moon.com',
    password: 'admin123',
    role: 'admin',
    campus: 'University of Ghana, Legon'
  });
  console.log('Admin created');
  process.exit();
});
```

```bash
node seed-admin.js
```
