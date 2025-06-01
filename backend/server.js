import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import colors from "colors";
import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import productRoute from "./routes/productRoutes.js";
dotenv.config();

connectDB(); // To connect database

const app = express();

app.get("/", (req, res) => {
  res.send("API is running...test");
});

app.use("/api/products", productRoute);

app.use(notFound);
app.use(errorHandler);
const PORT = process.env.PORT || 5000;
// Init port is 5000 (environment variable later)
app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} port ${PORT}`.yellow.bold
  )
);
