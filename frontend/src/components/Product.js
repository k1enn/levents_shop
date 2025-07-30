import React from "react";
import { Link } from "react-router-dom";
import { Card, Row, Col } from "react-bootstrap";
import Rating from "./Rating";

const Product = ({ product }) => {
  return (
    <Card className="my-1 mx-0 px-0 py-3 product-card">
      <Link to={`/product/${product._id}`} className="text-decoration-none">
        <div className="product-image-wrapper">
          <Card.Img
            src={product.image}
            variant="top"
            className="product-image"
          />
        </div>
      </Link>

      <Card.Body className="py-3 px-0">
        <Row className="align-items-center mb-1">
          <Col xs={7}>
            <Link
              to={`/product/${product._id}`}
              className="text-decoration-none"
            >
              <Card.Title as="div" className="product-title-small">
                {product.name}
              </Card.Title>
            </Link>
          </Col>
          <Col xs={5} className="text-end">
            <Rating value={product.rating} text="" size="small" />
          </Col>
        </Row>

        <Card.Text className="pt-4 product-price">
          Giá: {product.price} VND
        </Card.Text>
      </Card.Body>
    </Card>
  );
};

export default Product;
