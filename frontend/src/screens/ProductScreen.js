import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Row, Col, Image, ListGroup, Card, Button } from "react-bootstrap";
import Rating from "../components/Rating";
import Message from "../components/Message";
import Loader from "../components/Loader";
import { listProductDetails } from "../actions/productActions";
import { Form } from "react-bootstrap";

const ProductScreen = ({ history, match }) => {
  const [qty, setQty] = useState(1);

  const dispatch = useDispatch();
  // Use selector here
  const productDetails = useSelector((state) => state.productDetails);
  const { loading, error, product } = productDetails;

  useEffect(() => {
    dispatch(listProductDetails(match.params.id));
  }, [dispatch, match]);

  const addToCartHandler = () => {
    history.push(`/cart/${match.params.id}?qty=${qty}`);
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
                    style={{ maxHeight: "600px", objectFit: "cover" }}
                  />
                </Col>
              </Row>
            </Col>
            {/* Product Info */}
            <Col lg={6}>
              <div className="ps-lg-4">
                <h1 className="h3 fw-bold mb-3">{product.name}</h1>

                {/* Price */}
                <div className="mb-3">
                  <span className="h4 text-danger fw-bold">
                    ${product.price}
                  </span>
                  <span className="text-muted text-decoration-line-through ms-2">
                    $99.99
                  </span>
                </div>

                {/* Rating */}
                <div className="mb-3">
                  <Rating
                    value={product.rating}
                    text={`${product.numReviews} reviews`}
                  />
                </div>

                {/* Color Selection */}
                <div className="mb-4">
                  <h6 className="fw-bold mb-2">Màu:</h6>
                  <div className="d-flex gap-2">
                    <div
                      className="border rounded-circle"
                      style={{
                        width: "30px",
                        height: "30px",
                        backgroundColor: "#FFB6C1",
                        cursor: "pointer",
                      }}
                    ></div>
                    <div
                      className="border rounded-circle"
                      style={{
                        width: "30px",
                        height: "30px",
                        backgroundColor: "#87CEEB",
                        cursor: "pointer",
                      }}
                    ></div>
                    <div
                      className="border rounded-circle"
                      style={{
                        width: "30px",
                        height: "30px",
                        backgroundColor: "#DDA0DD",
                        cursor: "pointer",
                      }}
                    ></div>
                  </div>
                </div>

                {/* Size Selection */}
                <div className="mb-4">
                  <h6 className="fw-bold mb-2">Chọn loại:</h6>
                  <Form.Control as="select">
                    <option value="">Chọn size</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                  </Form.Control>
                </div>

                {/* Quantity */}
                {product.countInStock > 0 && (
                  <div className="mb-4">
                    <Row>
                      <Col xs={4}>
                        <h6 className="fw-bold mb-2">Qty</h6>
                        <Form.Control
                          as="select"
                          value={qty}
                          onChange={(e) => setQty(Number(e.target.value))}
                          className="w-100"
                        >
                          {[...Array(product.countInStock).keys()].map((x) => (
                            <option key={x + 1} value={x + 1}>
                              {x + 1}
                            </option>
                          ))}
                        </Form.Control>
                      </Col>
                    </Row>
                  </div>
                )}

                {/* Stock Status */}
                <div className="mb-4">
                  <span
                    className={`badge ${
                      product.countInStock > 0 ? "bg-success" : "bg-danger"
                    }`}
                  >
                    {product.countInStock > 0 ? "Còn hàng" : "Hết hàng"}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="d-grid gap-2 mb-4">
                  <Button
                    variant="dark"
                    size="lg"
                    disabled={product.countInStock === 0}
                  >
                    MUA NGAY
                  </Button>
                  <Button
                    variant="outline-dark"
                    size="lg"
                    onClick={addToCartHandler}
                    disabled={product.countInStock === 0}
                  >
                    THÊM VÀO GIỎ
                  </Button>
                </div>

                {/* Product Description */}
                <div className="mb-4">
                  <h6 className="fw-bold mb-2">Thông tin sản phẩm:</h6>
                  <p className="text-muted">{product.description}</p>
                </div>
              </div>
            </Col>
          </Row>

          {/* Product Details Tabs */}
          <Row className="mb-5">
            <Col>
              <h5 className="fw-bold mb-3">BẢNG GIÁ SẢN PHẨM</h5>
              <div className="table-responsive">
                <table className="table table-bordered">
                  <thead className="table-light">
                    <tr>
                      <th>Size</th>
                      <th>M</th>
                      <th>L</th>
                      <th>XL</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Dài áo</td>
                      <td>65</td>
                      <td>67</td>
                      <td>69</td>
                    </tr>
                    <tr>
                      <td>Ngang vai</td>
                      <td>42</td>
                      <td>44</td>
                      <td>46</td>
                    </tr>
                    <tr>
                      <td>Ngang ngực</td>
                      <td>47</td>
                      <td>49</td>
                      <td>51</td>
                    </tr>
                    <tr>
                      <td>Ngang tay</td>
                      <td>38</td>
                      <td>40</td>
                      <td>42</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Col>
          </Row>

          {/* Related Products */}
          <Row>
            <Col>
              <h5 className="fw-bold mb-4">CÁC SẢN PHẨM KHÁC</h5>
              <Row>
                {[1, 2, 3, 4].map((item) => (
                  <Col key={item} lg={3} md={4} sm={6} className="mb-4">
                    <Card className="h-100">
                      <Card.Img
                        variant="top"
                        src={product.image}
                        style={{ height: "200px", objectFit: "cover" }}
                      />
                      <Card.Body className="d-flex flex-column">
                        <Card.Title className="h6">
                          Áo Khoác Thun UV Miss Sunshine
                        </Card.Title>
                        <div className="mt-auto">
                          <div className="mb-2">
                            <Rating value={4.5} text="" />
                          </div>
                          <div className="text-danger fw-bold">
                            Giá: 299.000 VNĐ
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Col>
          </Row>
        </>
      )}
    </>
  );
};

export default ProductScreen;
