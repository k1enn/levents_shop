import express from "express";
const router = express.Router();
import { protect } from "../middleware/authMiddleware.js";
import {
  authUser,
  getUserProfile,
  registerUser,
} from "../controllers/userController.js";

router.route("/").post(registerUser);
router.post("/login", authUser);
router.get("/profile", protect, getUserProfile);

export default router;
