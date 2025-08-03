import React, { useState, useEffect, useRef } from "react";
import ProductCard from "../components/ProductCard";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Row, Col, Image, Button, ToggleButton } from "react-bootstrap";

import Rating from "../components/Rating";
import Message from "../components/Message";
import Loader from "../components/Loader";
import { listProductDetails, listProducts } from "../actions/productActions";
import { Form } from "react-bootstrap";

const ProductScreen = ({ history, match }) => {
  const [qty, setQty] = useState(1);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");

  const dispatch = useDispatch();
  // Use selector here
  const productDetails = useSelector((state) => state.productDetails);
  const { loading, error, product } = productDetails;
  const productList = useSelector((state) => state.productList);
  const { products = [] } = productList; // Default to empty array

  // Hard coded this because only have 3 colors
  const colorMapping = {
    blue: "#4A90E2",
    black: "#2C2C2C",
    pink: "#FF6B9D",
  };

  useEffect(() => {
    dispatch(listProductDetails(match.params.id));
    dispatch(listProducts());
  }, [dispatch, match]);

  // Reset selections when product changes
  useEffect(() => {
    if (product && product.colors && product.sizes) {
      // Set default selections to first available options
      const firstAvailableColor = product.colors.find(
        (color) => color.isAvailable
      );
      const firstAvailableSize = product.sizes.find((size) => size.isAvailable);

      setSelectedColor(
        firstAvailableColor ? firstAvailableColor.colorName : ""
      );
      setSelectedSize(firstAvailableSize ? firstAvailableSize.sizeName : "");
    }
  }, [product, products]);

  const addToCartHandler = () => {
    // Include color and size in the cart URL if needed
    const params = new URLSearchParams({
      qty: qty,
      ...(selectedColor && { color: selectedColor }),
      ...(selectedSize && { size: selectedSize }),
    });
    history.push(`/cart/${match.params.id}?${params.toString()}`);
  };

  // Helper function to check if a variant combination is valid
  const isVariantAvailable = (colorName, sizeName) => {
    const color = product.colors?.find((c) => c.colorName === colorName);
    const size = product.sizes?.find((s) => s.sizeName === sizeName);
    return color?.isAvailable && size?.isAvailable;
  };

  return (
    <>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <>
          {/* Main Product Section */}
          <Row className="mb-4">
            {/* Product Images */}
            <Col lg={6}>
              <Row>
                <Col md={12} xs={12}>
                  <Image
                    src={product.image}
                    alt={product.name}
                    className="w-100"
                    style={{ objectFit: "scale" }}
                  />
                </Col>
              </Row>
            </Col>
            {/* Product Info */}
            <Col lg={6}>
              <div className="ps-lg-4">
                <h1 className="h3 fw-bold mb-1">{product.name}</h1>

                {/* Rating */}
                <div className="mb-3">
                  <Rating
                    value={product.rating || 0}
                    justifyEnd={false}
                    blackStar={true}
                  />
                </div>

                {/* Price */}
                <div className="mb-3">
                  <span className="h4 fw-bold">
                    {product.currentPrice || product.price} VND
                  </span>
                  {product.saleInfo?.isOnSale && (
                    <span
                      className="text-muted text-decoration-line-through ms-2 "
                      style={{
                        textDecoration: "line-through",
                        fontSize: "0.95em",
                        padding: "0.6rem",
                      }}
                    >
                      {product.price} VND
                    </span>
                  )}
                </div>

                {/* Size */}
                {product.sizes && product.sizes.length > 0 && (
                  <div className="mb-3">
                    <h6 className="fw-bold mb-2">Size:</h6>
                    <div className="d-flex gap-3 gap-sm-3">
                      {" "}
                      {/* Increased gap for more horizontal spacing */}
                      {product.sizes
                        .filter((size) => size.isAvailable)
                        .map((size, idx) => (
                          <ToggleButton
                            key={idx}
                            id={`size-${idx}`}
                            type="radio"
                            variant={
                              selectedSize === size.sizeName
                                ? "dark"
                                : "outline-secondary"
                            }
                            name="size"
                            value={size.sizeName}
                            checked={selectedSize === size.sizeName}
                            onChange={(e) =>
                              setSelectedSize(e.currentTarget.value)
                            }
                            className="rounded d-flex align-items-center justify-content-center p-3"
                            style={{
                              marginRight: "0.4rem",
                              width: "clamp(19px, 4.8vw, 29px)",
                              height: "clamp(19px, 4.8vw, 29px)",
                              border: "none",
                            }}
                          >
                            {size.sizeName}
                          </ToggleButton>
                        ))}
                    </div>
                  </div>
                )}

                {/* Color */}
                {product.colors && product.colors.length > 0 && (
                  <div className="mb-3">
                    <h6 className="fw-bold mb-2">
                      Màu:{" "}
                      {selectedColor && (
                        <span className="text-muted fw-normal">
                          ({selectedColor})
                        </span>
                      )}
                    </h6>
                    <div className="d-flex gap-4">
                      {product.colors
                        .filter((color) => color.isAvailable)
                        .map((color, index) => (
                          <div
                            key={index}
                            className={`border rounded-circle position-relative ${
                              selectedColor === color.colorName
                                ? "border-dark border-3"
                                : "border-2"
                            }`}
                            style={{
                              marginRight: "0.4rem",
                              width: "20px",
                              height: "20px",
                              backgroundColor:
                                colorMapping[color.colorName] || "#ccc",
                              cursor: "pointer",
                            }}
                            onClick={() => {
                              setSelectedColor(color.colorName);
                            }}
                          />
                        ))}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                {product.countInStock > 0 && (
                  <div className="mb-4">
                    <Row className="align-items-center">
                      <Col xs={3} className="d-flex align-items-center">
                        <h6 className="fw-bold mb-0 me-3">Số lượng</h6>
                      </Col>
                      <Col xs={6} className="d-flex align-items-start">
                        <div
                          className="d-flex align-items-center border rounded"
                          style={{
                            width: "fit-content",
                            backgroundColor: "#ffffff",
                            border: "1px solid #eeeeee",
                          }}
                        >
                          <button
                            type="button"
                            className="btn btn-outline-secondary border-0 px-3 py-2"
                            onClick={() => setQty(qty > 1 ? qty - 1 : 1)}
                            style={{
                              fontSize: "16px",
                              lineHeight: "1",
                              minWidth: "40px",
                              fontWeight: "bold",
                            }}
                          >
                            -
                          </button>
                          <span
                            className="px-3 py-2 border-start border-end text-center"
                            style={{
                              minWidth: "40px",
                              fontSize: "15px",
                              backgroundColor: "#f8f9fa",
                            }}
                          >
                            {qty}
                          </span>
                          <button
                            type="button"
                            className="btn btn-outline-secondary border-0 px-3 py-2"
                            onClick={() =>
                              setQty(qty < product.countInStock ? qty + 1 : qty)
                            }
                            style={{
                              fontSize: "16px",
                              lineHeight: "1",
                              minWidth: "40px",
                              fontWeight: "bold",
                            }}
                          >
                            +
                          </button>
                        </div>
                      </Col>
                    </Row>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="d-flex gap-2 mb-4">
                  <Button
                    variant="primary"
                    disabled={
                      product.countInStock === 0 ||
                      !selectedColor ||
                      !selectedSize ||
                      !isVariantAvailable(selectedColor, selectedSize)
                    }
                    style={{
                      borderRadius: "8px",
                      marginRight: "1rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      maxWidth: "200px",
                      width: "100%",
                      height: "100%",
                      maxHeight: "40px",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.textDecoration = "underline";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.textDecoration = "none";
                    }}
                  >
                    MUA NGAY
                  </Button>
                  <Button
                    variant="outline-primary"
                    onClick={addToCartHandler}
                    disabled={
                      product.countInStock === 0 ||
                      !selectedColor ||
                      !selectedSize ||
                      !isVariantAvailable(selectedColor, selectedSize)
                    }
                    style={{
                      borderRadius: "8px",
                      border: "solid 1px #000000",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      maxWidth: "200px",
                      width: "100%",
                      height: "100%",
                      maxHeight: "40px",
                      transition: "all 0.2s ease",
                      backgroundColor: "transparent",
                      color: "#000000",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.textDecoration = "underline";
                      e.target.style.backgroundColor = "#e6e6e6";
                      e.target.style.color = "black";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.textDecoration = "none";
                      e.target.style.backgroundColor = "transparent";
                      e.target.style.color = "black";
                    }}
                  >
                    THÊM VÀO GIỎ
                  </Button>
                </div>

                {/* Product Description */}
                <div className="mb-4">
                  <h6 className="fw-bold mb-2">Thông tin sản phẩm:</h6>
                  <p>{product.description}</p>
                </div>
              </div>
            </Col>
          </Row>

          {/* Other Products */}
          {product && (
            <Row>
              <Col>
                <h2 className="fw-bold mb-4 text-center">CÁC SẢN PHẨM KHÁC</h2>
                <div
                  className="d-flex gap-3 pb-3"
                  style={{
                    overflowX: "auto",
                    scrollBehavior: "smooth",
                    WebkitOverflowScrolling: "touch", // For smooth scrolling on iOS
                  }}
                >
                  {products
                    .filter(
                      (p) =>
                        p.category === product.category &&
                        p._id !== product._id &&
                        p.isActive // Only show active products
                    )
                    .map((p) => (
                      <div
                        key={p._id}
                        style={{ minWidth: "200px", margin: "1rem" }}
                      >
                        <ProductCard product={p} />
                      </div>
                    ))}
                </div>
                {products.filter(
                  (p) =>
                    p.category === product.category &&
                    p._id !== product._id &&
                    p.isActive
                ).length === 0 && (
                  <p className="text-muted">
                    Không có sản phẩm cùng danh mục khác.
                  </p>
                )}
              </Col>
            </Row>
          )}
        </>
      )}
    </>
  );
};

export default ProductScreen;
