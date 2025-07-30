// Luna: HomeScreen
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Row, Col, Container } from "react-bootstrap";
import Product from "../components/Product";
import Message from "../components/Message";
import Loader from "../components/Loader";
import Banner from "../components/Banner";
import CategoryBar from "../components/CategoryBar";
import { listProducts } from "../actions/productActions";

const HomeScreen = () => {
  const dispatch = useDispatch();
  const [activeCategory, setActiveCategory] = useState("male");

  const productList = useSelector((state) => state.productList);
  const { loading, error, products } = productList;

  useEffect(() => {
    dispatch(listProducts());
  }, [dispatch]);

  // Filter products based on active category
  const getFilteredProducts = () => {
    if (activeCategory === "all") {
      return products;
    }

    return products.filter((product) => {
      return product.category?.toLowerCase() === activeCategory.toLowerCase();
    });
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
  };

  const filteredProducts = getFilteredProducts();

  return (
    <div className="wrapper">
      {/* Banner */}
      <div
        className="banner-container w-100 p-0 m-0"
        style={{ maxWidth: "100vw" }}
      >
        <Banner />
      </div>

      {/* Add spacing to account for fixed category bar */}
      <div style={{ height: "80px" }}></div>

      {/* Product container */}
      <Container>
        <h1 className="mb-4 pt-5 pb-2 text-center">Khám Phá Ngay</h1>
        {/* Category Filter Bar */}
        <CategoryBar
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
        />

        {loading ? (
          <Loader />
        ) : error ? (
          <Message variant="danger">{error}</Message>
        ) : (
          <>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-5">
                <Message variant="info">
                  Không tìm thấy sản phẩm nào trong danh mục này.
                </Message>
              </div>
            ) : (
              <Row xs={1} sm={2} md={3} lg={4} className="g-2">
                {filteredProducts.map((product) => (
                  <Col key={product._id} className="mb-1">
                    <Product product={product} />
                  </Col>
                ))}
              </Row>
            )}
          </>
        )}
      </Container>
    </div>
  );
};

export default HomeScreen;
