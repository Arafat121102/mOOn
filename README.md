# mOOn.com — Campus Ecommerce for Ghanaian Colleges

> Shop campus-only or go nationwide. Textbooks, food, fashion, electronics — delivered.
> **Stack: React · Express · Prisma · PostgreSQL**

---

## Project Structure

```
moon-final/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      ← All models & relations
│   │   └── seed.js            ← Seeds admin, vendor, shop, products
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.js        ← JWT protect + requireRole
│   │   ├── routes/
│   │   │   ├── auth.js        ← register, login, /me, preferences
│   │   │   ├── shops.js       ← campus/scope-filtered shop listing + CRUD
│   │   │   ├── products.js    ← scope-filtered products + vendor CRUD
│   │   │   ├── orders.js      ← place order, list, status updates
│   │   │   └── admin.js       ← stats, shop verification, user management
│   │   ├── prismaClient.js    ← Prisma singleton
│   │   └── server.js          ← Express entry point
│   ├── .env.example
│   └── package.json
│
└── frontend/
    └── src/
        ├── api/index.js           ← Axios client + all API calls
        ├── context/
        │   ├── AuthContext.jsx    ← login/register/logout/preferences
        │   └── CartContext.jsx    ← cart state with single-shop enforcement
        └── pages/
            ├── LandingPage.jsx    ← Marketing homepage
            ├── StorePage.jsx      ← Storefront with campus/nationwide toggle
            ├── AuthPage.jsx       ← Login + Register
            ├── VendorPage.jsx     ← Vendor dashboard
            └── AdminPage.jsx      ← Admin dashboard
```

---

## Backend Setup

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Fill in your PostgreSQL DATABASE_URL and JWT_SECRET
```

`.env` example:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/moondb?schema=public"
JWT_SECRET=your_long_random_secret
PORT=5000
```

### 3. Run migrations (auto-generates SQL from schema.prisma)
```bash
npx prisma migrate dev --name init
```

### 4. Seed the database
```bash
npm run db:seed
```

Seeded accounts:
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@moon.com | admin123 |
| Vendor | vendor@moon.com | vendor123 |
| Customer | student@ug.edu.gh | customer123 |

### 5. Start the server
```bash
npm run dev      # development (nodemon)
npm start        # production
```

### Useful Prisma commands
```bash
npx prisma studio          # Visual DB browser at localhost:5555
npx prisma migrate dev     # Create + apply a new migration
npx prisma migrate deploy  # Apply migrations in production
npx prisma generate        # Regenerate Prisma Client after schema changes
```

---

## Frontend Setup

```bash
cd frontend
npm install
npm start     # React app on http://localhost:3000
```

The React app proxies all `/api` requests to `localhost:5000`.

---

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/auth/register | Public | Register student or vendor |
| POST | /api/auth/login | Public | Login |
| GET | /api/auth/me | Auth | Current user |
| PATCH | /api/auth/preferences | Auth | Update campus/scope |
| GET | /api/shops | Public | Shops filtered by campus/scope |
| POST | /api/shops | Vendor | Create shop |
| PATCH | /api/shops/:id | Vendor | Update shop |
| GET | /api/shops/vendor/mine | Vendor | Own shop |
| GET | /api/products | Public | Products filtered by campus/scope |
| POST | /api/products | Vendor | Add product |
| PATCH | /api/products/:id | Vendor | Update product |
| DELETE | /api/products/:id | Vendor | Delete product |
| GET | /api/products/vendor/mine | Vendor | Own products |
| POST | /api/orders | Customer | Place order |
| GET | /api/orders | Auth | List orders |
| GET | /api/orders/:id | Auth | Order detail |
| PATCH | /api/orders/:id/status | Vendor | Update order status |
| GET | /api/admin/stats | Admin | Dashboard stats |
| GET | /api/admin/users | Admin | All users |
| GET | /api/admin/shops | Admin | All shops |
| PATCH | /api/admin/shops/:id/verify | Admin | Verify shop |
| DELETE | /api/admin/users/:id | Admin | Delete user |

---

## Campus vs Nationwide Scope

Users set their **shopScope** on registration and can change it anytime:

- **`campus`** → sees shops on their selected campus + any nationwide shops
- **`nationwide`** → sees all verified shops across Ghana

Shops also declare their **scope**:
- **`campus`** → only visible to students on that campus
- **`region`** → visible region-wide
- **`nationwide`** → visible to all students in Ghana

This filtering happens at the database level in both `/api/shops` and `/api/products`.
