A full-stack e-commerce application built with the MERN stack (MongoDB, Express.js, React.js, Node.js) with comprehensive admin functionality and order management.

## 🚀 Features

### Customer Features

- **Product Browsing**: Browse products with search and filtering
- **Shopping Cart**: Add/remove items, update quantities
- **User Authentication**: Register, login, and profile management
- **Order Management**: Place orders, view order history
- **Payment Integration**: PayPal payment processing
- **Responsive Design**: Mobile-friendly interface

### Admin Features

- **Product Management**: Create, edit, delete products
- **Order Management**: View all orders, mark as delivered
- **User Management**: View and manage user accounts
- **Image Upload**: Upload product images
- **Inventory Management**: Track stock levels

## 🛠️ Tech Stack

### Backend

- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Multer** for file uploads
- **Morgan** for logging

### Frontend

- **React.js** with hooks
- **Redux** for state management
- **React Bootstrap** for UI components
- **React Router** for navigation
- **Axios** for API calls
- **PayPal** integration

## 📁 Project Structure

```
proshop/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── data/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── uploads/
│   ├── server.js
│   └── seeder.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── actions/
│   │   ├── components/
│   │   ├── constants/
│   │   ├── reducers/
│   │   ├── screens/
│   │   ├── utils/
│   │   ├── App.js
│   │   └── store.js
│   └── package.json
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd proshop
   ```

2. **Install dependencies**

   ```bash
   # Install backend dependencies
   npm install

   # Install frontend dependencies
   cd frontend
   npm install
   cd ..
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:

   ```env
   NODE_ENV=development
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PAYPAL_CLIENT_ID=your_paypal_client_id
   ```

4. **Database Setup**

   ```bash
   # Import sample data
   npm run data:import
   ```

5. **Start the application**

   ```bash
   # Development mode (runs both frontend and backend)
   npm run dev

   # Or run separately:
   # Backend only
   npm run server

   # Frontend only
   npm run client
   ```

## 📱 Available Routes

### Customer Routes

- `/` - Home page
- `/login` - User login
- `/register` - User registration
- `/profile` - User profile
- `/product/:id` - Product details
- `/cart/:id?` - Shopping cart
- `/shipping` - Shipping information
- `/payment` - Payment method
- `/placeorder` - Place order
- `/order/:id` - Order details

### Admin Routes

- `/admin/productlist` - Product management
- `/admin/product/:id/edit` - Edit product
- `/admin/userlist` - User management
- `/admin/user/:id/edit` - Edit user
- `/admin/orderlist` - Order management

## 🔧 API Endpoints

### Products

- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Users

- `POST /api/users/login` - User login
- `POST /api/users/register` - User registration
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users` - Get all users (Admin)
- `DELETE /api/users/:id` - Delete user (Admin)
- `PUT /api/users/:id` - Update user (Admin)

### Orders

- `POST /api/orders` - Create order
- `GET /api/orders/myorders` - Get user orders
- `GET /api/orders/:id` - Get order by ID
- `PUT /api/orders/:id/pay` - Mark order as paid
- `PUT /api/orders/:id/deliver` - Mark order as delivered (Admin)
- `GET /api/orders` - Get all orders (Admin)

### Upload

- `POST /api/upload` - Upload image

## 🔐 Authentication

The application uses JWT (JSON Web Tokens) for authentication. Admin routes require both authentication and admin privileges.

### Admin Access

To create an admin user, you can either:

1. Modify the user directly in the database
2. Use the seeder script to create admin users
3. Register normally and then update the user's `isAdmin` field to `true`

## 📊 Database Models

### User Model

```javascript
{
  name: String,
  email: String,
  password: String,
  isAdmin: Boolean,
  // ... other fields
}
```

### Product Model

```javascript
{
  name: String,
  price: Number,
  description: String,
  image: String,
  brand: String,
  category: String,
  countInStock: Number,
  colors: Array,
  sizes: Array,
  sale: Object,
  // ... other fields
}
```

### Order Model

```javascript
{
  user: ObjectId,
  orderItems: Array,
  shippingAddress: Object,
  paymentMethod: String,
  totalPrice: Number,
  isPaid: Boolean,
  isDelivered: Boolean,
  // ... other fields
}
```

## 🎨 Styling

The application uses:

- **React Bootstrap** for UI components
- **Custom CSS** for styling
- **Responsive design** for mobile compatibility

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server (frontend + backend)
- `npm run server` - Start backend server only
- `npm run client` - Start frontend server only
- `npm run data:import` - Import sample data
- `npm run data:destroy` - Clear database

### Code Structure

- **Actions**: Redux actions for API calls
- **Reducers**: Redux reducers for state management
- **Components**: Reusable UI components
- **Screens**: Page-level components
- **Constants**: Redux action types

## 🚀 Deployment

### Backend Deployment

1. Set `NODE_ENV=production`
2. Configure MongoDB connection
3. Set up environment variables
4. Deploy to your preferred platform (Heroku, Vercel, etc.)

### Frontend Deployment

1. Run `npm run build`
2. Deploy the `build` folder to your hosting platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Check the documentation
- Review existing issues
- Create a new issue with detailed information

## 🔄 Updates

### Recent Changes

- Added comprehensive order management
- Implemented admin functionality
- Added image upload capability
- Enhanced user management
- Improved error handling
- Added PayPal integration

### Future Enhancements

- Real-time notifications
- Advanced search and filtering
- Product reviews and ratings
- Email notifications
- Advanced analytics
- Mobile app development
