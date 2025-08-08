# E-Commerce MERN App

A full-stack e-commerce application built with MongoDB, Express.js, React.js, and Node.js featuring comprehensive admin functionality and order management.

## **Features**

**Customer Features**
- Product browsing with search & filtering
- Shopping cart & order management
- User authentication & profile management
- PayPal payment integration
- Responsive mobile-friendly design

**Admin Features**
- Product management (CRUD operations)
- Order management & delivery tracking
- User management
- Image upload & inventory tracking

## **Tech Stack**

**Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT, Multer  
**Frontend:** React.js, Redux, React Bootstrap, React Router, Axios

### **Images**
User views: 
<img src="https://github.com/k1enn/levents_shop/blob/master/frontend/public/images/user_view.png?raw=true">
Admin view: 
<img src="https://github.com/k1enn/levents_shop/blob/master/frontend/public/images/admin_view.png?raw=true">

### Installation

1. **Clone & Install**
   ```bash
   git clone https://github.com/k1enn/levents_shop.git
   cd proshop
   npm install
   cd frontend && npm install && cd ..
   ```

2. **Environment Setup**
   Create `.env` file in root:
   ```env
   MONGO_URI=YOUR_MONGO_URI
   PORT=5000
   JWT_SECRET=abc123
   NODE_ENV=development
   MOMO_ACCESS_KEY=F8BBA842ECF85
   MOMO_SECRET_KEY=K951B6PE1waDMi640xX08PD3vg6EkVlz
   MOMO_PARTNER_CODE=MOMO
   MOMO_REDIRECT_URL=http://localhost:3000/order-success
   MOMO_IPN_URL=http://localhost:5000/api/payment/momo/ipn
   ```

3. **Database Setup**
   ```bash
   npm run data:import
   ```

4. **Start Application**
   ```bash
   npm run dev  # Runs both frontend & backend
   ```

## **Project Structure**

```
├── backend/          # Express.js API
│   ├── controllers/  # Route handlers
│   ├── models/       # MongoDB models
│   ├── routes/       # API routes
│   └── middleware/   # Auth & error handling
├── frontend/         # React.js app
│   └── src/
│       ├── components/  # Reusable components
│       ├── screens/     # Page components
│       ├── actions/     # Redux actions
│       └── reducers/    # Redux reducers
└── uploads/          # Image storage
```

## 🔧 API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)
- `DELETE /api/products/:id?force=true` - Force delete with orders (Admin)

### Users
- `POST /api/users/login` - User login
- `POST /api/users/register` - User registration
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users` - Get all users (Admin)

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/myorders` - Get user orders
- `GET /api/orders/:id` - Get order by ID
- `PUT /api/orders/:id/pay` - Mark order as paid
- `PUT /api/orders/:id/deliver` - Mark order as delivered (Admin)

### Upload
- `POST /api/upload` - Upload image

## 🔐 Authentication

Uses JWT tokens for authentication. Admin routes require `isAdmin: true` in user profile.

**Create Admin User:**
1. Register normally
2. Update user's `isAdmin` field to `true` in database
3. Or use seeder script: `npm run data:import`

## 📱 Available Scripts

```bash
npm run dev          # Start both frontend & backend
npm run server       # Backend only
npm run client       # Frontend only
npm run data:import  # Import sample data
npm run data:destroy # Clear database
```
