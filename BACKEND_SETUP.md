# Backend Setup Guide

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

## Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and configure:
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `JWT_SECRET` - A secure random string for JWT tokens
   - `PORT` - Backend server port (default: 3001)
   - `CORS_ORIGIN` - Frontend URL (default: http://localhost:5173)

4. **Set up database:**
   ```bash
   # Generate Prisma client
   npm run prisma:generate

   # Create database migration
   npm run prisma:migrate
   # When prompted, name it "init"

   # Seed database with existing data
   npm run seed
   ```

5. **Create admin user:**
   You can create an admin user via API:
   ```bash
   curl -X POST http://localhost:3001/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"your-secure-password"}'
   ```

6. **Start development server:**
   ```bash
   npm run dev
   ```

The backend will be running on `http://localhost:3001`

## Frontend Setup

1. **Install axios (if not already installed):**
   ```bash
   npm install axios
   ```

2. **Set up environment variables:**
   Create `.env` file in the root directory:
   ```
   VITE_API_URL=http://localhost:3001/api
   ```

3. **Start frontend:**
   ```bash
   npm run dev
   ```

## Admin Panel

Access the admin panel at: `http://localhost:5173/admin/login`

Use the admin credentials you created to log in.

## API Endpoints

### Public Endpoints
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get single product
- `GET /api/machines` - List all machines
- `GET /api/machines/:id` - Get single machine
- `GET /api/brands` - List all brands
- `POST /api/leads` - Submit quote form
- `POST /api/contact` - Submit contact form

### Admin Endpoints (Requires Authentication)
- `POST /api/auth/login` - Admin login
- `GET /api/admin/products` - List products
- `PUT /api/admin/products/:id/stock` - Update product stock
- `PUT /api/admin/machines/:id/stock` - Update machine stock
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/leads` - List leads
- `PUT /api/admin/leads/:id/status` - Update lead status

## Inventory Management

Products and machines have an `inStock` boolean field. Update stock via:

```bash
PUT /api/admin/products/:id/stock
Body: { "inStock": true } OR { "quantity": 5 }
```

If `quantity` is provided, it converts to boolean (quantity > 0 = inStock).

## Database Schema

- **User** - Admin users
- **Brand** - Product brands
- **Product** - Products with `inStock` field
- **Machine** - Machines with `inStock` field
- **Lead** - Quote submissions
- **ContactSubmission** - Contact form submissions

## Troubleshooting

1. **Database connection error:**
   - Verify PostgreSQL is running
   - Check DATABASE_URL in `.env`
   - Ensure database exists

2. **CORS errors:**
   - Verify CORS_ORIGIN matches your frontend URL
   - Check browser console for specific CORS errors

3. **Authentication errors:**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Ensure admin user exists

## Next Steps

1. Deploy backend to Railway, Render, or Vercel
2. Set up production PostgreSQL database
3. Update frontend `.env` with production API URL
4. Configure email notifications (optional)
5. Set up file upload for images (optional)


