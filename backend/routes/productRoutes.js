import express from "express";
const router = express.Router();
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getProducts,
  getProductById, // Add this import
} from "../controllers/productController.js";
import { protect, admin } from "../middleware/authMiddleware.js";
// Public routes
router.get("/", getProducts);

// Protected admin routes
router.post("/", protect, admin, createProduct);

router
  .route("/:id")
  .get(getProductById)
  .put(protect, admin, updateProduct)
  .delete(protect, admin, deleteProduct);

export default router;
