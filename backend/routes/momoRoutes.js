import express from "express";
const router = express.Router();
import {
  createMomoPayment,
  handleMomoIPN,
  checkMomoPaymentStatus,
} from "../controllers/momoController.js";
import { protect } from "../middleware/authMiddleware.js";

// Test endpoint
router.route("/test").get((req, res) => {
  res.json({ message: "MoMo routes are working!" });
});

// Create MoMo payment
router.route("/create").post(protect, createMomoPayment);

// Handle MoMo IPN (webhook) - no auth required as it comes from MoMo
router.route("/ipn").post(handleMomoIPN);

// Check payment status
router.route("/status").post(protect, checkMomoPaymentStatus);

export default router;
