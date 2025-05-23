const express = require("express");
const products = require("./data/products");

const app = express();

app.get("/", (req, res) => {
  res.send("API is running...");
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

// Init port is 5000 (enviroment variable later)
app.listen(5000, console.log("Server running on port 5000"));
