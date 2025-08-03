import asyncHandler from "express-async-handler";
import Product from "../models/productModel.js";
import mongoose from "mongoose";

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  const { name, price, description, image, brand, category, countInStock } =
    req.body;

  // Validate required fields
  if (!name || !price || !brand || !category) {
    res.status(400);
    throw new Error("Name, price, brand, and category are required");
  }

  // Validate data types
  if (isNaN(price) || price <= 0) {
    res.status(400);
    throw new Error("Price must be a positive number");
  }

  if (countInStock !== undefined && (isNaN(countInStock) || countInStock < 0)) {
    res.status(400);
    throw new Error("Count in stock must be a non-negative number");
  }

  const product = new Product({
    name: name.trim(),
    price: parseFloat(price),
    user: req.user._id,
    image: image || "",
    brand: brand.trim(),
    category: category.trim(),
    countInStock: parseInt(countInStock) || 0,
    description: description || "",
  });

  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid product ID format");
  }

  const {
    name,
    price,
    description,
    image,
    brand,
    category,
    countInStock,
    isActive,
    colors,
    sizes,
    sale,
  } = req.body;

  const product = await Product.findById(id);

  if (product) {
    // Existing validations...
    if (price !== undefined && (isNaN(price) || price <= 0)) {
      res.status(400);
      throw new Error("Price must be a positive number");
    }

    if (
      countInStock !== undefined &&
      (isNaN(countInStock) || countInStock < 0)
    ) {
      res.status(400);
      throw new Error("Count in stock must be a non-negative number");
    }

    // Update existing fields
    product.name = name?.trim() || product.name;
    product.price = price ? parseFloat(price) : product.price;
    product.description = description || product.description;
    product.image = image || product.image;
    product.category = category?.trim() || product.category;
    product.countInStock =
      countInStock !== undefined
        ? parseInt(countInStock)
        : product.countInStock;

    // Update new fields
    if (isActive !== undefined) {
      product.isActive = isActive;
    }

    if (colors && Array.isArray(colors) && colors.length > 0) {
      product.colors = colors;
    }

    if (sizes && Array.isArray(sizes) && sizes.length > 0) {
      product.sizes = sizes;
    }

    if (sale) {
      product.sale = {
        isOnSale: sale.isOnSale || false,
        saleType: sale.saleType || "percentage",
        saleValue: sale.isOnSale ? sale.saleValue : 0,
        saleStartDate: sale.isOnSale ? sale.saleStartDate : null,
        saleEndDate: sale.isOnSale ? sale.saleEndDate : null,
      };
    }

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } else {
    res.status(404);
    throw new Error("Không tìm thấy sản phẩm");
  }
});

// @desc    Delete a product (soft delete)
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid product ID format");
  }

  const product = await Product.findById(id);

  if (product) {
    product.isActive = false;
    await product.save();
    res.json({ message: "Sản phẩm đã được loại bỏ" });
  } else {
    res.status(404);
    throw new Error("Không tìm thấy sản phẩm");
  }
});

// @desc    Get all products
// @route   GET /api/products
// @access  Private/Admin
const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isActive: true });
  res.json(products);
});

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(404);
    throw new Error("Invalid product ID format");
  }

  const product = await Product.findById(id);

  if (product && product.isActive !== false) {
    // Check if product exists and is active
    res.json(product);
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

export {
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  getProducts,
};
