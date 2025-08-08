# 🛒 E-Commerce MERN App

A full-stack e-commerce application built with MongoDB, Express.js, React.js, and Node.js featuring comprehensive admin functionality and order management.

## ✨ Features

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

## 🛠️ Tech Stack

**Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT, Multer  
**Frontend:** React.js, Redux, React Bootstrap, React Router, Axios

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- MongoDB
- npm/yarn

### Installation

1. **Clone & Install**
   ```bash
   git clone <repository-url>
   cd proshop
   npm install
   cd frontend && npm install && cd ..
   ```

2. **Environment Setup**
   Create `.env` file in root:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PAYPAL_CLIENT_ID=your_paypal_client_id
   ```

3. **Database Setup**
   ```bash
   npm run data:import
   ```

4. **Start Application**
   ```bash
   npm run dev  # Runs both frontend & backend
   ```

## 📁 Project Structure

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

## 🚀 Deployment

**Backend:**
1. Set `NODE_ENV=production`
2. Configure MongoDB connection
3. Deploy to Heroku/Vercel/etc.

**Frontend:**
1. Run `npm run build`
2. Deploy build folder to hosting platform

## 📊 Key Models

**User:** `{ name, email, password, isAdmin }`  
**Product:** `{ name, price, description, image, category, countInStock, colors, sizes }`  
**Order:** `{ user, orderItems, shippingAddress, paymentMethod, totalPrice, isPaid, isDelivered }`

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License.

---

**Live Demo:** [Add your demo link here]  
**Documentation:** [Add documentation link here]