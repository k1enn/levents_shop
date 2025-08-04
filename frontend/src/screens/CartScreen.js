import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Message from "../components/Message";
import {
  Row,
  Col,
  ListGroup,
  Image,
  Form,
  Button,
  Card,
  ToggleButton,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import {
  addToCart,
  removeFromCart,
  removeSpecificFromCart,
} from "../actions/cartActions";
import { listProductDetails } from "../actions/productActions";

const CartScreen = ({ match, location, history }) => {
  const productId = match.params.id;

  // Parse query parameters
  const urlParams = new URLSearchParams(location.search);
  const qty = Number(urlParams.get("qty")) || 1;
  const color = urlParams.get("color") || "";
  const size = urlParams.get("size") || "";

  const dispatch = useDispatch();

  // State for managing product details for each cart item
  const [productDetails, setProductDetails] = useState({});
  const [loadingProducts, setLoadingProducts] = useState({});
  const [showEmptyMessage, setShowEmptyMessage] = useState(true);

  const cart = useSelector((state) => state.cart);
  const { cartItems } = cart;

  // Color mapping for visual representation
  const colorMapping = {
    blue: "#4A90E2",
    black: "#2C2C2C",
    pink: "#FF6B9D",
  };

  // Update whenever productId, quantity, color, or size change
  useEffect(() => {
    if (productId) {
      dispatch(addToCart(productId, qty, color, size));
    }
  }, [dispatch, productId, qty, color, size]);

  // Fetch product details for all cart items
  useEffect(() => {
    const fetchProductDetails = async () => {
      const uniqueProductIds = [
        ...new Set(cartItems.map((item) => item.product)),
      ];

      for (const productId of uniqueProductIds) {
        if (!productDetails[productId] && !loadingProducts[productId]) {
          setLoadingProducts((prev) => ({ ...prev, [productId]: true }));

          try {
            const response = await fetch(`/api/products/${productId}`);
            const productData = await response.json();

            setProductDetails((prev) => ({
              ...prev,
              [productId]: productData,
            }));
          } catch (error) {
            console.error(`Error fetching product ${productId}:`, error);
          } finally {
            setLoadingProducts((prev) => ({ ...prev, [productId]: false }));
          }
        }
      }
    };

    if (cartItems.length > 0) {
      fetchProductDetails();
    }
  }, [cartItems, productDetails, loadingProducts]);

  // Handle empty cart message with delay to prevent flickering
  useEffect(() => {
    if (cartItems.length === 0) {
      // Set a timer before showing empty message
      const timer = setTimeout(() => {
        setShowEmptyMessage(true);
      }, 500);

      // Initially hide the message
      setShowEmptyMessage(false);

      return () => clearTimeout(timer);
    } else {
      // If cart has items, show them immediately
      setShowEmptyMessage(false);
    }
  }, [cartItems.length]);

  // Remove cart item
  const removeFromCartHandler = (id) => {
    dispatch(removeFromCart(id));
  };

  // Handle color change for cart item
  const handleColorChange = (item, newColor) => {
    // Remove the current specific item first
    dispatch(removeSpecificFromCart(item.product, item.color, item.size));
    // Add the item with new color
    dispatch(addToCart(item.product, item.qty, newColor, item.size));
  };

  // Handle size change for cart item
  const handleSizeChange = (item, newSize) => {
    // Remove the current specific item first
    dispatch(removeSpecificFromCart(item.product, item.color, item.size));
    // Add the item with new size
    dispatch(addToCart(item.product, item.qty, item.color, newSize));
  };

  // Checkout
  const checkoutHandler = () => {
    history.push("/login?redirect=shipping"); // Not logged will go to login
  };
  return (
    <Row>
      <Col md={8}>
        <h1>Giỏ hàng</h1>
        {cartItems.length <= 0 && showEmptyMessage ? (
          <Message>
            Your cart is empty <Link to="/">Go back</Link>
          </Message>
        ) : cartItems.length > 0 ? (
          <ListGroup variant="flush">
            {cartItems.map((item) => (
              <ListGroup.Item key={item.product}>
                <Row>
                  <Col md={2}>
                    <Image
                      src={item.image}
                      alt={item.name}
                      fluid
                      rounded
                    ></Image>
                  </Col>
                  <Col md={3}>
                    <Link to={`/product/${item.product}`}>
                      {item.name}
                      {(item.color || item.size) && (
                        <div className="text-muted small">
                          {item.color && `Color: ${item.color}`}
                          {item.color && item.size && " | "}
                          {item.size && `Size: ${item.size}`}
                        </div>
                      )}
                    </Link>

                    {/* Color Selection */}
                    {productDetails[item.product] &&
                      productDetails[item.product].colors &&
                      productDetails[item.product].colors.length > 0 && (
                        <div className="mt-2">
                          <small className="text-muted">Màu:</small>
                          <div className="d-flex gap-2 mt-1">
                            {productDetails[item.product].colors
                              .filter((color) => color.isAvailable)
                              .map((color, index) => (
                                <div
                                  key={index}
                                  className={`border rounded-circle position-relative ${
                                    item.color === color.colorName
                                      ? "border-dark border-3"
                                      : "border-2"
                                  }`}
                                  style={{
                                    width: "20px",
                                    height: "20px",
                                    backgroundColor:
                                      colorMapping[color.colorName] || "#ccc",
                                    cursor: "pointer",
                                    marginLeft: "0.3rem",
                                  }}
                                  onClick={() =>
                                    handleColorChange(item, color.colorName)
                                  }
                                  title={color.colorName}
                                />
                              ))}
                          </div>
                        </div>
                      )}

                    {/* Size Selection */}
                    {productDetails[item.product] &&
                      productDetails[item.product].sizes &&
                      productDetails[item.product].sizes.length > 0 && (
                        <div className="mt-2">
                          <small className="text-muted">Kích thước:</small>
                          <div className="d-flex gap-1 mt-1">
                            {productDetails[item.product].sizes
                              .filter((size) => size.isAvailable)
                              .map((size, idx) => (
                                <ToggleButton
                                  key={idx}
                                  id={`size-${item.product}-${idx}`}
                                  type="radio"
                                  variant={
                                    item.size === size.sizeName
                                      ? "dark"
                                      : "outline-secondary"
                                  }
                                  name={`size-${item.product}`}
                                  value={size.sizeName}
                                  checked={item.size === size.sizeName}
                                  onChange={() =>
                                    handleSizeChange(item, size.sizeName)
                                  }
                                  className="rounded d-flex align-items-center justify-content-center"
                                  style={{
                                    width: "30px",
                                    height: "30px",
                                    fontSize: "12px",
                                    border: "none",
                                  }}
                                >
                                  {size.sizeName}
                                </ToggleButton>
                              ))}
                          </div>
                        </div>
                      )}
                  </Col>
                  <Col md={2}>{item.price}</Col>
                  <Col md={2}>
                    <Form.Control
                      as="select"
                      value={item.qty}
                      onChange={(e) =>
                        dispatch(
                          addToCart(
                            item.product,
                            Number(e.target.value),
                            item.color,
                            item.size
                          )
                        )
                      }
                    >
                      {[...Array(item.countInStock).keys()].map((x) => (
                        <option key={x + 1} value={x + 1}>
                          {x + 1}
                        </option>
                      ))}
                    </Form.Control>
                  </Col>
                  <Col md={2}>
                    <Button
                      type="button"
                      variant="light"
                      onClick={() =>
                        dispatch(
                          removeSpecificFromCart(
                            item.product,
                            item.color,
                            item.size
                          )
                        )
                      }
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
                  </Col>
                </Row>
              </ListGroup.Item>
            ))}
          </ListGroup>
        ) : (
          // Show nothing while waiting for the timer (prevents flickering)
          <div></div>
        )}
      </Col>
      <Col md={4}>
        <Card>
          <ListGroup variant="flush">
            <ListGroup.Item>
              <h2>
                Subtotal (
                {
                  cartItems.reduce((acc, item) => acc + item.qty, 0) // Subtotal
                }
                ) items
              </h2>
              $
              {cartItems // Total money
                .reduce((acc, item) => acc + item.qty * item.price, 0)
                .toFixed(2)}
            </ListGroup.Item>
            <ListGroup.Item>
              <Button
                type="button"
                className="btn-block"
                disabled={cartItems.length === 0}
                onClick={checkoutHandler}
              >
                Proceed To Checkout
              </Button>
            </ListGroup.Item>
          </ListGroup>
        </Card>
      </Col>
    </Row>
  );
};

export default CartScreen;
