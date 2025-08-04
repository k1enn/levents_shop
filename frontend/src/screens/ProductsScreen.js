import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory, useLocation, useParams } from "react-router-dom";
import {
  Row,
  Col,
  Container,
  Form,
  Button,
  Card,
  InputGroup,
  Dropdown,
  Badge,
} from "react-bootstrap";
import ProductCard from "../components/ProductCard";
import SearchBox from "../components/SearchBox";
import Message from "../components/Message";
import Loader from "../components/Loader";
import Paginate from "../components/Paginate";
import { listProducts } from "../actions/productActions";
import { saleUtils } from "../utils/saleUtils";

const ProductsScreen = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const location = useLocation();
  const params = useParams();

  // Parse URL parameters from both route params and query string
  const urlParams = new URLSearchParams(location.search);
  const currentPage = parseInt(params.pageNumber || urlParams.get("page") || 1);
  const keyword = params.keyword || urlParams.get("keyword") || "";
  const category = urlParams.get("category") || "";
  const minPrice = urlParams.get("minPrice") || "";
  const maxPrice = urlParams.get("maxPrice") || "";

  // Local state for filters
  const [filters, setFilters] = useState({
    keyword: keyword,
    category: category,
    minPrice: minPrice,
    maxPrice: maxPrice,
  });

  // Pagination settings
  const PRODUCTS_PER_PAGE = 12;

  // Redux state
  const productList = useSelector((state) => state.productList);
  const { loading, error, products } = productList;

  // Categories configuration
  const categories = [
    { key: "", label: "Tất cả danh mục" },
    { key: "male", label: "Nam" },
    { key: "female", label: "Nữ" },
    { key: "jacket", label: "Áo Khoác" },
    { key: "accessory", label: "Phụ Kiện" },
  ];

  // Price ranges for quick selection
  const priceRanges = [
    { label: "Tất cả", min: "", max: "" },
    { label: "Dưới 500K", min: "", max: "500000" },
    { label: "500K - 1M", min: "500000", max: "1000000" },
    { label: "1M - 2M", min: "1000000", max: "2000000" },
    { label: "Trên 2M", min: "2000000", max: "" },
  ];

  // Filter products based on current filters (similar to HomeScreen logic)
  const filteredProducts = useMemo(() => {
    if (!products || !Array.isArray(products)) {
      return [];
    }

    let filtered = products.filter((product) => product.isActive);

    // Apply keyword filter with relevance scoring
    if (filters.keyword) {
      const searchTerm = filters.keyword.toLowerCase();

      // First filter products that match the search term
      const matchingProducts = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm) ||
          product.description?.toLowerCase().includes(searchTerm)
      );

      // Then score and sort by relevance
      const scoredProducts = matchingProducts.map((product) => {
        const productName = product.name.toLowerCase();
        const productDescription = product.description?.toLowerCase() || "";
        let score = 0;

        // Exact name match gets highest score
        if (productName === searchTerm) {
          score += 1000;
        }
        // Name starts with search term gets high score
        else if (productName.startsWith(searchTerm)) {
          score += 500;
        }
        // Name contains search term gets medium score
        else if (productName.includes(searchTerm)) {
          // Give higher score for matches closer to the beginning
          const index = productName.indexOf(searchTerm);
          score += 200 - index;
        }
        // Description contains search term gets lower score
        else if (productDescription.includes(searchTerm)) {
          score += 50;
        }

        // Bonus points for shorter names (more specific matches)
        score += Math.max(0, 50 - productName.length);

        return { ...product, searchScore: score };
      });

      // Sort by score (highest first)
      filtered = scoredProducts.sort((a, b) => b.searchScore - a.searchScore);
    }

    // Apply category filter
    if (filters.category) {
      if (filters.category === "sale-off") {
        filtered = filtered.filter((product) =>
          saleUtils.isProductOnSale(product)
        );
      } else {
        filtered = filtered.filter(
          (product) =>
            product.category?.toLowerCase() === filters.category.toLowerCase()
        );
      }
    }

    // Apply price filter
    if (filters.minPrice || filters.maxPrice) {
      filtered = filtered.filter((product) => {
        const productPrice = saleUtils.isProductOnSale(product)
          ? saleUtils.getSaleInfo(product).salePrice
          : product.price;

        const min = filters.minPrice ? parseFloat(filters.minPrice) : 0;
        const max = filters.maxPrice ? parseFloat(filters.maxPrice) : Infinity;

        return productPrice >= min && productPrice <= max;
      });
    }

    return filtered;
  }, [products, filters]);

  // Page logic
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // Update URL
  const updateURL = (newFilters, newPage = 1) => {
    const params = new URLSearchParams();

    if (newFilters.keyword) params.set("keyword", newFilters.keyword);
    if (newFilters.category) params.set("category", newFilters.category);
    if (newFilters.minPrice) params.set("minPrice", newFilters.minPrice);
    if (newFilters.maxPrice) params.set("maxPrice", newFilters.maxPrice);
    if (newPage > 1) params.set("page", newPage);

    const queryString = params.toString();
    const newPath = queryString ? `/products?${queryString}` : "/products";

    history.push(newPath);
  };

  // Handle search input
  const handleSearchChange = (e) => {
    setFilters((prev) => ({ ...prev, keyword: e.target.value }));
  };

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateURL(filters, 1);
  };

  // Handle search from SearchBox component
  const handleSearch = (searchKeyword) => {
    const newFilters = { ...filters, keyword: searchKeyword };
    setFilters(newFilters);
    updateURL(newFilters, 1);
  };

  // Handle category change
  const handleCategoryChange = (selectedCategory) => {
    const newFilters = { ...filters, category: selectedCategory };
    setFilters(newFilters);
    updateURL(newFilters, 1);
  };

  // Handle price range change
  const handlePriceRangeChange = (min, max) => {
    const newFilters = {
      ...filters,
      minPrice: min,
      maxPrice: max,
    };
    setFilters(newFilters);
    updateURL(newFilters, 1);
  };

  // Handle custom price input
  const handleCustomPriceChange = (type, value) => {
    setFilters((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  // Apply custom price filter
  const applyCustomPrice = () => {
    updateURL(filters, 1);
  };

  // Clear all filters
  const clearFilters = () => {
    const clearedFilters = {
      keyword: "",
      category: "",
      minPrice: "",
      maxPrice: "",
    };
    setFilters(clearedFilters);
    updateURL(clearedFilters, 1);
  };

  // Handle page change
  const handlePageChange = (pageNumber) => {
    updateURL(filters, pageNumber);
  };

  // Format price for display
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  // Get active filters count
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.keyword) count++;
    if (filters.category) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    return count;
  };

  // Initial load - fetch all products
  useEffect(() => {
    dispatch(listProducts()); // Fetch all products without filters
  }, [dispatch]);

  // Update local state when URL changes
  useEffect(() => {
    setFilters({
      keyword: keyword,
      category: category,
      minPrice: minPrice,
      maxPrice: maxPrice,
    });
  }, [keyword, category, minPrice, maxPrice]);

  return (
    <Container>
      <Row>
        <Col>
          <h1 className="mb-4">Tất cả sản phẩm</h1>

          {/* Filter Bar */}
          <Card className="mb-4" style={{ borderRadius: "8px" }}>
            <Card.Body style={{ padding: "0.8rem 1rem" }}>
              <Row className="g-2 " style={{ alignItems: "center" }}>
                {/* Search */}
                <Col md={4} style={{ marginBottom: "0.3rem" }}>
                  <SearchBox
                    onSearch={handleSearch}
                    placeholder="Tìm kiếm sản phẩm..."
                  />
                </Col>

                {/* Category Filter */}
                <Col md={3} style={{ marginBottom: "0.3rem" }}>
                  <Dropdown>
                    <Dropdown.Toggle
                      variant="outline-secondary"
                      className="w-100"
                      style={{
                        borderRadius: "8px",
                        border: "1px solid #dee2e6",
                        backgroundColor: filters.category
                          ? "#000000ff"
                          : "#00000004",
                        color: filters.category ? "white" : "black",
                        fontWeight: "500",
                        padding: "0.6rem 1rem",
                        height: "38px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      {categories.find((cat) => cat.key === filters.category)
                        ?.label || "Tất cả danh mục"}
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="w-100">
                      {categories.map((cat) => (
                        <Dropdown.Item
                          key={cat.key}
                          onClick={() => handleCategoryChange(cat.key)}
                          active={filters.category === cat.key}
                        >
                          {cat.label}
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>
                </Col>

                {/* Price Range Filter */}
                <Col md={3} style={{ marginBottom: "0.3rem" }}>
                  <Dropdown>
                    <Dropdown.Toggle
                      variant="outline-secondary"
                      className="w-100"
                      style={{
                        borderRadius: "8px",
                        border: "1px solid #dee2e6",
                        backgroundColor:
                          filters.minPrice || filters.maxPrice
                            ? "#000000ff"
                            : "#00000004",
                        color:
                          filters.minPrice || filters.maxPrice
                            ? "white"
                            : "black",
                        fontWeight: "500",
                        padding: "0.6rem 1rem",
                        height: "38px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      Khoảng giá
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="w-100">
                      {priceRanges.map((range, index) => (
                        <Dropdown.Item
                          key={index}
                          onClick={() =>
                            handlePriceRangeChange(range.min, range.max)
                          }
                        >
                          {range.label}
                        </Dropdown.Item>
                      ))}
                      <Dropdown.Divider />
                      <div className="px-3 py-2">
                        <Form.Label className="small">
                          Tùy chỉnh (VND)
                        </Form.Label>
                        <Row className="g-2">
                          <Col>
                            <Form.Control
                              type="number"
                              placeholder="Từ"
                              size="sm"
                              value={filters.minPrice}
                              onChange={(e) =>
                                handleCustomPriceChange(
                                  "minPrice",
                                  e.target.value
                                )
                              }
                            />
                          </Col>
                          <Col>
                            <Form.Control
                              type="number"
                              placeholder="Đến"
                              size="sm"
                              value={filters.maxPrice}
                              onChange={(e) =>
                                handleCustomPriceChange(
                                  "maxPrice",
                                  e.target.value
                                )
                              }
                            />
                          </Col>
                        </Row>
                        <Button
                          size="sm"
                          variant="primary"
                          className="w-100 mt-2"
                          onClick={applyCustomPrice}
                        >
                          Áp dụng
                        </Button>
                      </div>
                    </Dropdown.Menu>
                  </Dropdown>
                </Col>

                {/* Clear Filters */}
                <Col md={2} style={{ marginBottom: "0.3rem" }}>
                  <Button
                    variant="outline-danger"
                    className="w-100"
                    onClick={clearFilters}
                    disabled={getActiveFiltersCount() === 0}
                    style={{
                      borderRadius: "8px",
                      border: "1px solid #dc3545",
                      backgroundColor:
                        getActiveFiltersCount() > 0 ? "#dc3545" : "transparent",
                      color: getActiveFiltersCount() > 0 ? "white" : "#dc3545",
                      fontWeight: "500",
                      padding: "0.6rem 1rem",
                      height: "38px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    Xóa bộ lọc{" "}
                    {getActiveFiltersCount() > 0 && (
                      <Badge bg="light" text="dark" className="ms-1">
                        {getActiveFiltersCount()}
                      </Badge>
                    )}
                  </Button>
                </Col>
              </Row>

              {/* Active Filters Display */}
              {getActiveFiltersCount() > 0 && (
                <Row className="mt-3">
                  <Col>
                    <div className="d-flex flex-wrap gap-2">
                      <span className="text-muted small">
                        Bộ lọc đang áp dụng:
                      </span>
                      {filters.keyword && (
                        <Badge bg="primary">Từ khóa: "{filters.keyword}"</Badge>
                      )}
                      {filters.category && (
                        <Badge bg="info">
                          Danh mục:{" "}
                          {
                            categories.find(
                              (cat) => cat.key === filters.category
                            )?.label
                          }
                        </Badge>
                      )}
                      {(filters.minPrice || filters.maxPrice) && (
                        <Badge bg="success">
                          Giá:{" "}
                          {filters.minPrice
                            ? formatPrice(filters.minPrice)
                            : "0"}{" "}
                          -{" "}
                          {filters.maxPrice
                            ? formatPrice(filters.maxPrice)
                            : "∞"}{" "}
                          VND
                        </Badge>
                      )}
                    </div>
                  </Col>
                </Row>
              )}
            </Card.Body>
          </Card>

          {/* Products Grid */}
          {loading ? (
            <div className="text-center py-5">
              <Loader />
            </div>
          ) : error ? (
            <Message variant="danger">{error}</Message>
          ) : (
            <>
              {/* Results Info */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-muted">
                  {filteredProducts.length > 0
                    ? `Hiển thị ${currentProducts.length} trong ${
                        filteredProducts.length
                      } sản phẩm${
                        totalPages > 1
                          ? ` (trang ${currentPage}/${totalPages})`
                          : ""
                      }`
                    : "Không tìm thấy sản phẩm nào"}
                </span>
              </div>

              {/* Products */}
              {currentProducts.length > 0 ? (
                <Row>
                  {currentProducts.map((product) => (
                    <Col
                      key={product._id}
                      sm={12}
                      md={6}
                      lg={4}
                      xl={3}
                      className="mb-4"
                    >
                      <ProductCard product={product} />
                    </Col>
                  ))}
                </Row>
              ) : (
                <div className="text-center py-5">
                  <Message variant="info">
                    Không tìm thấy sản phẩm nào phù hợp với bộ lọc của bạn.
                    <br />
                    <Button
                      variant="link"
                      onClick={clearFilters}
                      className="p-0 mt-2"
                    >
                      Xóa tất cả bộ lọc
                    </Button>
                  </Message>
                </div>
              )}

              {/* Pagination */}
              <div className="d-flex justify-content-center mt-4">
                <Paginate
                  pages={totalPages}
                  page={currentPage}
                  isProductsPage={true}
                />
              </div>
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default ProductsScreen;
