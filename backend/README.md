# Larsen Backend API

Backend API for Larsen Italiana website built with Node.js, Express, TypeScript, and PostgreSQL.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and configure:
   - `DATABASE_URL` - PostgreSQL connection string
   - `JWT_SECRET` - Secret key for JWT tokens
   - `PORT` - Server port (default: 3001)
   - `CORS_ORIGIN` - Frontend URL

3. **Set up database:**
   ```bash
   # Generate Prisma client
   npm run prisma:generate

   # Run migrations
   npm run prisma:migrate

   # Seed database with existing data
   npm run seed
   ```

4. **Create admin user:**
   ```bash
   # Use the register endpoint or Prisma Studio
   npm run prisma:studio
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

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
- `POST /api/auth/register` - Create admin user (for initial setup)
- `GET /api/admin/products` - List products (with pagination)
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `PUT /api/admin/products/:id/stock` - Update product stock status
- Similar endpoints for machines and brands
- `GET /api/admin/leads` - List leads
- `PUT /api/admin/leads/:id/status` - Update lead status
- `GET /api/admin/stats` - Dashboard statistics

## Inventory Management

Products and machines have an `inStock` boolean field. Update stock status using:

```bash
PUT /api/admin/products/:id/stock
PUT /api/admin/machines/:id/stock

Body: { "inStock": true } OR { "quantity": 5 }
```

If `quantity` is provided, it converts to boolean (quantity > 0 = inStock).

## Database Schema

- **User** - Admin users
- **Brand** - Product brands
- **Product** - Products with inventory tracking
- **Machine** - Machines with inventory tracking
- **Lead** - Quote submissions
- **ContactSubmission** - Contact form submissions

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio
- `npm run seed` - Seed database with existing data


