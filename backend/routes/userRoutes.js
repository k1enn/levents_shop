import express from "express";
const router = express.Router();
import { protect } from "../middleware/authMiddleware.js";
import { authUser, getUserProfile } from "../controllers/userController.js";

router.post("/login", authUser);
router.get("/profile", protect, getUserProfile);

export default router;
