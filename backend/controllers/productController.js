import asyncHandler from "express-async-handler";
import Product from "../models/productModel.js";
import Order from "../models/orderModel.js";
import mongoose from "mongoose";

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    price,
    description,
    image,
    category,
    countInStock,
    isActive,
    colors,
    sizes,
    sale,
  } = req.body;

  // Validate required fields
  if (!name || !price || !category || !description || !image) {
    res.status(400);
    throw new Error(
      "Name, price, category, description, and image are required"
    );
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

  // Validate category enum
  const validCategories = ["female", "male", "jacket", "accessory"];
  if (!validCategories.includes(category)) {
    res.status(400);
    throw new Error("Category must be one of: female, male, jacket, accessory");
  }

  // Validate colors array
  if (!colors || !Array.isArray(colors) || colors.length === 0) {
    res.status(400);
    throw new Error("Product must have at least one color option");
  }

  // Validate each color
  const validColors = ["blue", "black", "pink"];
  for (const color of colors) {
    if (!color.colorName || !validColors.includes(color.colorName)) {
      res.status(400);
      throw new Error("Color must be one of: blue, black, pink");
    }
    if (typeof color.isAvailable !== "boolean") {
      res.status(400);
      throw new Error("Color availability must be a boolean");
    }
  }

  // Validate sizes array
  if (!sizes || !Array.isArray(sizes) || sizes.length === 0) {
    res.status(400);
    throw new Error("Product must have at least one size option");
  }

  // Validate each size
  const validSizes = ["M", "L", "XL"];
  for (const size of sizes) {
    if (!size.sizeName || !validSizes.includes(size.sizeName)) {
      res.status(400);
      throw new Error("Size must be one of: M, L, XL");
    }
    if (typeof size.isAvailable !== "boolean") {
      res.status(400);
      throw new Error("Size availability must be a boolean");
    }
  }

  // Validate sale information if provided
  if (sale && sale.isOnSale) {
    if (!sale.saleValue || sale.saleValue <= 0) {
      res.status(400);
      throw new Error(
        "Sale value must be greater than 0 when product is on sale"
      );
    }

    if (sale.saleType === "percentage" && sale.saleValue > 100) {
      res.status(400);
      throw new Error("Percentage discount cannot exceed 100%");
    }

    if (sale.saleType === "fixed" && sale.saleValue >= price) {
      res.status(400);
      throw new Error("Fixed discount cannot exceed or equal product price");
    }

    if (!sale.saleStartDate || !sale.saleEndDate) {
      res.status(400);
      throw new Error(
        "Sale start date and end date are required when product is on sale"
      );
    }

    if (new Date(sale.saleEndDate) <= new Date(sale.saleStartDate)) {
      res.status(400);
      throw new Error("Sale end date must be after sale start date");
    }
  }

  const product = new Product({
    name: name.trim(),
    price: parseFloat(price),
    user: req.user._id,
    image: image.trim(),
    category: category.trim(),
    countInStock: parseInt(countInStock) || 0,
    description: description.trim(),
    isActive: isActive !== undefined ? isActive : true,
    colors: colors,
    sizes: sizes,
    sale: sale || {
      isOnSale: false,
      saleType: "percentage",
      saleValue: 0,
    },
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

// @desc    Delete a product with cascade delete
// @route   DELETE /api/products/:id?force=true
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { force } = req.query;

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid product ID format");
  }

  const product = await Product.findById(id);

  if (product) {
    // Check if product exists in any orders
    const ordersWithProduct = await Order.find({
      "orderItems.product": id,
    });

    if (ordersWithProduct.length > 0) {
      if (force === "true") {
        // Force delete: remove all orders containing this product and then delete the product
        const orderIds = ordersWithProduct.map((order) => order._id);

        // Delete all orders containing this product
        await Order.deleteMany({
          "orderItems.product": id,
        });

        // Delete the product
        await Product.findByIdAndDelete(id);

        res.json({
          message: "Sản phẩm và các đơn hàng liên quan đã được xóa hoàn toàn",
          deletedProduct: product.name,
          deletedOrdersCount: ordersWithProduct.length,
          deletedOrderIds: orderIds,
        });
      } else {
        // Show warning with order details
        const orderIds = ordersWithProduct.map((order) => order._id);

        res.status(409).json({
          warning: true,
          message: "Không thể xóa sản phẩm vì đang tồn tại trong đơn hàng",
          productName: product.name,
          ordersCount: ordersWithProduct.length,
          orderIds: orderIds,
          suggestion:
            "Thêm tham số ?force=true để xóa sản phẩm cùng với các đơn hàng liên quan",
          forceDeleteUrl: `/api/products/${id}?force=true`,
        });
      }
    } else {
      // Safe to delete completely if no orders reference this product
      await Product.findByIdAndDelete(id);
      res.json({
        message: "Sản phẩm đã được xóa hoàn toàn",
        deletedProduct: product.name,
      });
    }
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
