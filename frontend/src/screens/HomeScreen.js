import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Row, Col, Container } from "react-bootstrap";
import Product from "../components/Product";
import Message from "../components/Message";
import Loader from "../components/Loader";
import { listProducts } from "../actions/productActions";
import Banner from "../components/Banner";

const HomeScreen = () => {
  const dispatch = useDispatch();

  const productList = useSelector((state) => state.productList);
  const { loading, error, products } = productList;

  useEffect(() => {
    dispatch(listProducts());
  }, [dispatch]);

  return (
    <div className="wrapper">
      {/* Use w-100 and remove any padding/margin */}
      <div
        className="banner-container w-100 p-0 m-0"
        style={{ maxWidth: "100vw" }}
      >
        <Banner />
      </div>
      <Container>
        <h1 className="mb-4 text-center">Latest Products</h1>
        {loading ? (
          <Loader />
        ) : error ? (
          <Message variant="danger">{error}</Message>
        ) : (
          <Row xs={1} sm={2} md={3} lg={4} className="g-2">
            {products.map((product) => (
              <Col key={product._id} className="mb-1">
                <Product product={product} />
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </div>
  );
};

export default HomeScreen;
