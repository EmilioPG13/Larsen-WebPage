# Larsen Italiana - Lead Generation Website

A professional website for Larsen Italiana industrial sewing machines, built with React, TypeScript, Express, and PostgreSQL. Includes a complete admin panel, lead management system, and dynamic catalog of products and machines.

## 🚀 Main Features

### Public Frontend
- **Responsive Design**: Optimized for all devices (mobile, tablets, desktop)
- **Multiple Pages**: Home, Brands, Machines, Quote, About
- **Dynamic Catalog**: Products and machines with detailed information from database
- **Interactive Quote Form**: Multi-step form with validation
- **Contact Form**: Modal integrated with EmailJS
- **Stock Management**: Real-time availability badges
- **Carousels**: Hero carousel and Product carousel
- **Page Transitions**: Smooth animations between pages
- **Top Banner**: Featured promotions and announcements

### Admin Panel
- **Secure Authentication**: Login with JWT and bcrypt
- **Dashboard**: System statistics and summary
- **Lead Management**: View, filter by status, and update leads
- **Inventory Management**: Stock updates for products and machines
- **Product Management**: Full CRUD for products
- **Machine Management**: Full CRUD for machines
- **Brand Management**: Brand administration and relationships
- **Protected Routes**: Authentication middleware for all admin routes

### Backend API
- **RESTful API**: Complete endpoints for all operations
- **PostgreSQL Database**: With Prisma ORM
- **JWT Authentication**: Secure tokens for admin sessions
- **Data Validation**: With Zod
- **Error Handling**: Centralized middleware
- **CORS Configured**: Support for development and production

## 🛠️ Technology Stack

### Frontend
- **Framework**: Vite + React 19 + TypeScript
- **Routing**: React Router DOM v7
- **Styles**: Tailwind CSS v4
- **Forms**: EmailJS for contacts
- **HTTP Client**: Axios
- **Testing**: Vitest + Testing Library

### Backend
- **Runtime**: Node.js + Express
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT + bcrypt
- **Validation**: Zod
- **Testing**: Jest + Supertest

### DevOps
- **Frontend Deployment**: Vercel (configured)
- **Backend Deployment**: Railway/Render compatible
- **Version Control**: Git

## 📦 Installation and Setup

### Prerequisites
- Node.js v18 or higher
- PostgreSQL (local or remote)
- npm or yarn

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Larsen-WebPage
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Setup the backend**
   ```bash
   cd backend
   npm install
   ```

4. **Configure backend environment variables**
   
   Create `backend/.env`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/larsen_db"
   JWT_SECRET="your-super-secure-secret-key"
   PORT=3001
   CORS_ORIGIN="http://localhost:5173"
   ```

5. **Setup database**
   ```bash
   cd backend
   npm run prisma:generate
   npm run prisma:migrate
   npm run seed
   ```
   
   **Alternative: Use Prisma Studio for database management**
   ```bash
   npm run prisma:studio
   ```
   This opens a GUI at `http://localhost:5555` to view and edit your database.

6. **Configure frontend environment variables**
   
   Create `.env` in the root:
   ```env
   VITE_API_URL=http://localhost:3001/api
   ```

7. **Create admin user**
   ```bash
   # From the backend directory
   curl -X POST http://localhost:3001/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@larsenitaliana.com","password":"your-secure-password"}'
   ```

### Development

**Start backend:**
```bash
cd backend
npm run dev
```

**Start frontend (in another terminal):**
```bash
npm run dev
```

**Using development script (Windows):**
```bash
dev.bat
```

Frontend will be available at `http://localhost:5173`  
Backend will be available at `http://localhost:3001`

## 🗂️ Project Structure

```
Larsen-WebPage/
├── backend/                    # Backend API
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   ├── seed.ts            # Initial data
│   │   └── migrations/        # Database migrations
│   ├── src/
│   │   ├── config/            # Configuration (DB, env)
│   │   ├── controllers/       # Route controllers
│   │   │   ├── auth.controller.ts
│   │   │   ├── products.controller.ts
│   │   │   ├── machines.controller.ts
│   │   │   ├── brands.controller.ts
│   │   │   └── leads.controller.ts
│   │   ├── middleware/        # Middleware (auth, errors)
│   │   ├── routes/            # Route definitions
│   │   ├── services/          # Business logic
│   │   ├── types/             # TypeScript types
│   │   ├── utils/             # Utilities
│   │   └── server.ts          # Entry point
│   ├── __tests__/             # Backend tests
│   └── package.json
│
├── src/                        # Frontend
│   ├── admin/                  # Admin panel
│   │   ├── components/
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── InventoryManager.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Products.tsx
│   │   │   ├── Machines.tsx
│   │   │   ├── Brands.tsx
│   │   │   └── Leads.tsx
│   │   └── services/
│   │       └── adminApi.ts
│   │
│   ├── components/             # Public components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Hero.tsx
│   │   ├── HeroCarousel.tsx
│   │   ├── TopBanner.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── ProductCard.tsx
│   │   ├── ProductCarousel.tsx
│   │   ├── ContactModal.tsx
│   │   ├── ContactAlternatives.tsx
│   │   ├── InteractiveQuoteForm.tsx
│   │   ├── QuoteSteps.tsx
│   │   └── ImagePlaceholder.tsx
│   │
│   ├── pages/                  # Application pages
│   │   ├── HomePage.tsx
│   │   ├── BrandsPage.tsx
│   │   ├── MachinesPage.tsx
│   │   ├── QuotePage.tsx
│   │   └── AboutPage.tsx
│   │
│   ├── services/               # API services
│   │   └── api.ts
│   │
│   ├── types/                  # TypeScript types
│   │   └── index.ts
│   │
│   ├── data/                   # Static data (fallback)
│   │   ├── products.json
│   │   └── machines.json
│   │
│   ├── __tests__/              # Frontend tests
│   ├── App.tsx
│   └── main.tsx
│
├── public/
│   └── images/
│       ├── logo/
│       ├── brands/
│       └── machines/
│
├── BACKEND_SETUP.md            # Backend setup guide
├── DEPLOYMENT.md               # Deployment guide
├── TESTING.md                  # Testing guide
└── README.md                   # This file
```

## 📡 API Endpoints

### Public Endpoints
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product by ID
- `GET /api/machines` - List all machines
- `GET /api/machines/:id` - Get machine by ID
- `GET /api/brands` - List all brands
- `GET /api/brands/:id` - Get brand by ID
- `POST /api/leads` - Create new lead (quote request)
- `POST /api/contact` - Submit contact form

### Authentication Endpoints
- `POST /api/auth/register` - Register admin (development only)
- `POST /api/auth/login` - Admin login

### Admin Endpoints (Require Authentication)

**Products:**
- `GET /api/admin/products` - List products (with pagination)
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `PUT /api/admin/products/:id/stock` - Update product stock status

**Machines:**
- `GET /api/admin/machines` - List machines (with pagination)
- `POST /api/admin/machines` - Create machine
- `PUT /api/admin/machines/:id` - Update machine
- `DELETE /api/admin/machines/:id` - Delete machine
- `PUT /api/admin/machines/:id/stock` - Update machine stock status

**Brands:**
- `GET /api/admin/brands` - List brands
- `POST /api/admin/brands` - Create brand
- `PUT /api/admin/brands/:id` - Update brand
- `DELETE /api/admin/brands/:id` - Delete brand

**Leads:**
- `GET /api/admin/leads` - List leads
- `GET /api/admin/leads/:id` - Get lead by ID
- `PUT /api/admin/leads/:id/status` - Update lead status
- `GET /api/admin/leads/stats` - Dashboard statistics

**Statistics:**
- `GET /api/admin/stats` - Dashboard statistics

## 🎨 Color Palette

```css
/* Main colors */
--larsen-blue: #28327B
--larsen-red: #D81E2A
--larsen-pink: #D3AFC4
--larsen-dark-red: #B7444C
--larsen-white: #FFFFFF
```

## 🗄️ Data Model

### Prisma Schema
- **User**: Admin users
- **Brand**: Product/machine brands
- **Product**: Products with stock (`inStock` boolean field)
- **Machine**: Industrial machines with stock (`inStock` boolean field)
- **Lead**: Quote requests with status tracking
- **ContactSubmission**: Contact form submissions

All models include timestamps (`createdAt`, `updatedAt`) and appropriate relationships.

### Inventory Management

Products and machines have an `inStock` boolean field for stock status tracking. Update stock status using:

```bash
PUT /api/admin/products/:id/stock
PUT /api/admin/machines/:id/stock

Body: { "inStock": true } OR { "quantity": 5 }
```

**Note:** If `quantity` is provided, it converts to boolean (quantity > 0 = inStock = true, quantity = 0 = inStock = false).

## 🧪 Testing

### Frontend Testing
```bash
# Run tests
npm test

# Tests with UI
npm run test:ui

# Coverage
npm run test:coverage
```

### Backend Testing
```bash
cd backend
npm test
npm run test:watch
npm run test:coverage
```

See `TESTING.md` for complete manual and automated testing guide.

## 🚀 Deployment

### Frontend (Vercel)
1. Connect repository to Vercel
2. Configure environment variables:
   - `VITE_API_URL`: Your backend API URL
3. Deploy automatically

### Backend (Railway/Render)
1. Connect repository
2. Configure environment variables:
   - `DATABASE_URL`: PostgreSQL URL
   - `JWT_SECRET`: Secret key for JWT
   - `CORS_ORIGIN`: Frontend URL
   - `PORT`: Server port
3. Run migrations: `npm run prisma:migrate`
4. Run seed: `npm run seed`

See `DEPLOYMENT.md` for complete details.

## ⚙️ EmailJS Configuration (Optional)

For the traditional contact form:

1. Create account at [EmailJS](https://www.emailjs.com/)
2. Configure email service
3. Create template with variables:
   - `{{from_name}}`, `{{from_email}}`, `{{phone}}`, `{{company}}`, `{{message}}`, `{{product_name}}`
4. Update `src/components/ContactModal.tsx` with your IDs

## 🎯 Lead Generation Flow

1. User browses catalog (products/machines)
2. Clicks "I'm interested" or navigates to `/cotizacion`
3. Completes interactive multi-step form
4. Data saved to database as Lead
5. Lead appears in admin panel with "New" status
6. Admin can update status (Contacted, Converted, Archived)
7. Optional email via EmailJS for notifications

## 📱 Responsive Features

The site is optimized for:
- 📱 Mobile (320px+)
- 📱 Tablets (768px+)
- 💻 Desktop (1024px+)
- 🖥️ Large screens (1280px+)

## 🔒 Security

- JWT authentication with secure tokens
- Passwords hashed with bcrypt
- Authentication middleware on protected routes
- Data validation with Zod
- CORS configured appropriately
- Environment variables for secrets

## 🖼️ Images

Images should be placed in `public/images/`:
- `logo/` - Larsen logos
- `brands/` - Brand images
- `machines/` - Machine images

The system includes automatic placeholders if images are not available.

## 📚 Additional Documentation

- `TESTING.md` - Manual and automated testing guide with detailed test procedures

## 🔧 Available Scripts

### Frontend
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run preview` - Preview build
- `npm test` - Run tests
- `npm run lint` - Linter

### Backend
- `npm run dev` - Development server with hot reload
- `npm run build` - Compile TypeScript
- `npm start` - Run production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (GUI for database management)
- `npm run seed` - Seed database with initial data
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## 🆘 Troubleshooting

### Database connection error
- Verify PostgreSQL is running
- Verify `DATABASE_URL` in `.env`
- Ensure database exists

### CORS errors
- Verify `CORS_ORIGIN` in backend `.env`
- Must match frontend URL

### Authentication error
- Verify `JWT_SECRET` is configured
- Verify token hasn't expired
- Verify admin user exists

### Products/Machines not appearing
- Verify backend is running
- Verify `VITE_API_URL` in frontend `.env`
- Check browser console for errors

## 🔄 Potential Future Improvements

- [ ] Email notification system for new leads
- [ ] Export leads to CSV/Excel
- [ ] Advanced search and filters
- [ ] Image upload for products/machines
- [ ] Multi-language (i18n)
- [ ] Integrated analytics
- [ ] Live chat
- [ ] Blog/News

## 📄 License

This project is private and property of Larsen Italiana.

---

**Larsen Italiana** - Industrial sewing machine specialists since 2004.
