import colors from "colors";
import express from "express";
import products from "./data/products.js";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

dotenv.config();

connectDB(); // To connect database

const app = express();

app.get("/", (req, res) => {
  res.send("API is running...test");
});

// Get all products
app.get("/api/products", (req, res) => {
  res.json(products); // It will get convert to JSON
});

// Get single products
app.get("/api/products/:id", (req, res) => {
  const product = products.find((p) => p._id === req.params.id);
  res.json(product);
});

const PORT = process.env.PORT || 5000;
// Init port is 5000 (enviroment variable later)
app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} port ${PORT}`.yellow.bold
  )
);
