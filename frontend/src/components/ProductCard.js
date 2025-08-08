import React from "react";
import { Link } from "react-router-dom";
import { Card, Row, Col } from "react-bootstrap";
import Rating from "./Rating";
import { saleUtils } from "../utils/saleUtils";
import CurrencyFormat from "react-currency-format";

// This component is for displaying products in a list/grid
const ProductCard = ({ product }) => {
  // Get sale information
  const saleInfo = saleUtils.getSaleInfo(product);
  const isOnSale = saleUtils.isProductOnSale(product);

  return (
    <Card className="my-1 mx-0 px-0 py-3 product-card">
      <Link to={`/product/${product._id}`} className="text-decoration-none">
        <div className="product-image-wrapper position-relative">
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
            <Rating
              value={product.rating || 0}
              text=""
              size="small"
              justifyEnd={true}
            />
          </Col>
        </Row>

        {/* Price Section */}
        <div className="pt-4 product-price">
          {isOnSale ? (
            <div className="price-section">
              <div>
                <span className="h5 fw-bold">
                  Giá:{" "}
                  <CurrencyFormat
                    value={saleInfo.salePrice}
                    displayType={"text"}
                    thousandSeparator={true}
                    prefix={""}
                  />
                  VND{" "}
                </span>
                <span
                  className="original-price text-muted"
                  style={{
                    textDecoration: "line-through",
                    fontSize: "0.85em",
                    padding: "0.6rem",
                  }}
                >
                  {saleInfo.originalPrice} VND
                </span>
              </div>
            </div>
          ) : (
            <Card.Text className="h5 fw-bold">
              Giá:
              <CurrencyFormat
                value={product.price}
                displayType={"text"}
                thousandSeparator={true}
                prefix={""}
              />
              VND
            </Card.Text>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProductCard;
