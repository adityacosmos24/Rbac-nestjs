# 🔐 RBAC Backend — NestJS + PostgreSQL + Prisma

> A production-ready **Role-Based Access Control** backend API built with NestJS, PostgreSQL, and Prisma ORM.

---

## 📌 What is this project?

This is a backend API that controls **who can do what** in your application.

- A **regular user** can only see their own profile.
- A **moderator** can view all users.
- An **admin** can create roles, assign roles, delete users, and manage everything.

This pattern is called **RBAC (Role-Based Access Control)** — one of the most common security patterns used in real-world applications.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **NestJS** | Backend framework (like Express, but with structure) |
| **PostgreSQL** | Database (stores all data) |
| **Prisma ORM** | Talks to the database using TypeScript |
| **JWT** | Secure login tokens (like a digital ID card) |
| **bcrypt** | Password hashing (never stores plain passwords) |
| **class-validator** | Validates incoming request data |

---

## 📁 Project Structure

```
rbac-backend/
├── prisma/
│   ├── schema.prisma        # Database table definitions
│   └── seed.ts              # Pre-fills DB with test data
├── src/
│   ├── auth/                # Login, Register, JWT
│   ├── users/               # User CRUD operations
│   ├── roles/               # Role & Permission management
│   ├── common/              # Shared utilities (guards, decorators)
│   ├── prisma/              # Database connection service
│   ├── app.module.ts        # Root module (wires everything together)
│   └── main.ts              # Entry point (starts the server)
├── .env                     # Secret config (never commit this!)
└── package.json
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js v18+
- PostgreSQL running locally (or Docker)
- npm

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd rbac-backend
npm install
```

### 2. Set Up Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/rbac_db"
JWT_SECRET="your-super-secret-key"
JWT_EXPIRES_IN="7d"
PORT=3000
```

### 3. Set Up Database

```bash
# Apply schema
npx prisma migrate dev --name init

# Seed with test data
npx prisma db seed
```

### 4. Start the Server

```bash
npm run start:dev
```

Server runs at: `http://localhost:3000/api/v1`

---

## 🔑 Seeded Test Accounts

| Email | Password | Role |
|---|---|---|
| `admin@example.com` | `Admin@123` | Admin (full access) |
| `moderator@example.com` | `Mod@123` | Moderator (read-only) |

---

## 📡 API Endpoints

### Auth
```
POST   /api/v1/auth/register     — Create a new account
POST   /api/v1/auth/login        — Login and get JWT token
GET    /api/v1/auth/profile      — Get your profile (requires login)
```

### Users
```
GET    /api/v1/users             — List all users     [admin, moderator]
GET    /api/v1/users/me          — Your own profile   [any logged-in user]
GET    /api/v1/users/:id         — Get user by ID     [admin]
PATCH  /api/v1/users/:id         — Update user        [admin]
DELETE /api/v1/users/:id         — Delete user        [admin]
```

### Roles
```
GET    /api/v1/roles                         — List all roles        [admin]
POST   /api/v1/roles                         — Create role           [admin]
DELETE /api/v1/roles/:id                     — Delete role           [admin]
POST   /api/v1/roles/assign                  — Assign role to user   [admin]
DELETE /api/v1/roles/:roleId/users/:userId   — Revoke role           [admin]
GET    /api/v1/roles/permissions             — List permissions      [admin]
```

---

## 🔒 How Authentication Works

1. User calls `POST /auth/login` with email + password
2. Server verifies credentials and returns a **JWT token**
3. User sends that token in all future requests:
   ```
   Authorization: Bearer <your-token-here>
   ```
4. Server reads the token, identifies the user and their roles
5. If they have the required role → request allowed ✅
6. If they don't → `403 Forbidden` ❌

---

## 🗃️ Database Schema

```
User ──< UserRole >── Role ──< RolePermission >── Permission
```

- A **User** can have many **Roles**
- A **Role** can have many **Permissions**
- A **Permission** is an `action` + `subject` pair (e.g., `read:user`, `delete:user`)

---

## 🌱 Default Roles & Permissions

| Role | Permissions |
|---|---|
| `admin` | create, read, update, delete users + manage roles |
| `moderator` | read users, read roles |
| `user` | none (just basic access) |

---

## 🧪 Example Usage with curl

```bash
# 1. Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin@123"}'

# 2. Use the token from above
TOKEN="paste-your-token-here"

# 3. Get all users
curl http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📜 Available Scripts

```bash
npm run start:dev      # Start in development (auto-reload)
npm run start:prod     # Start in production
npm run build          # Compile TypeScript
npx prisma studio      # Open DB visual editor in browser
npx prisma db seed     # Re-seed the database
```

---

## ⚠️ Important Notes

- **Never commit `.env`** — it contains secrets
- **Change `JWT_SECRET`** before deploying to production
- **Use HTTPS** in production — JWT tokens are only safe over encrypted connections
- **Passwords are hashed** with bcrypt — plain passwords are never stored

---

## 📄 License

MIT
