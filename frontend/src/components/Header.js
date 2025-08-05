import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LinkContainer } from "react-router-bootstrap";
import { useHistory } from "react-router-dom";
import {
  Navbar,
  Nav,
  Container,
  NavDropdown,
  Form,
  Button,
} from "react-bootstrap";
import { logout } from "../actions/userActions";
import InputBar from "./InputBar";

const Header = () => {
  const [keyword, setKeyword] = useState("");
  const dispatch = useDispatch();
  const history = useHistory();
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const logoutHandler = () => {
    dispatch(logout());
  };

  const searchSubmitHandler = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      history.push(`/search/${keyword.trim()}`);
      setKeyword(""); // Clear search after submission
    }
  };

  return (
    <header>
      <Navbar
        bg="light"
        variant="light"
        expand="md"
        collapseOnSelect
        className="custom-navbar"
      >
        <Container>
          {/* Logo */}
          <LinkContainer to="/">
            <Navbar.Brand className="text-dark fw-bold">Levents</Navbar.Brand>
          </LinkContainer>

          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            {/* Left side navigation items */}
            <Nav className="me-auto">
              <LinkContainer to="/products" st>
                <Nav.Link className="text-dark">Sản phẩm</Nav.Link>
              </LinkContainer>
              <LinkContainer to="/products?category=male">
                <Nav.Link className="text-dark">Nam</Nav.Link>
              </LinkContainer>
              <LinkContainer to="/products?category=female">
                <Nav.Link className="text-dark">Nữ</Nav.Link>
              </LinkContainer>
              <LinkContainer to="/products?category=jacket">
                <Nav.Link className="text-dark">Áo khoác</Nav.Link>
              </LinkContainer>
              <LinkContainer to="/products?category=accessory">
                <Nav.Link className="text-dark">Phụ kiện</Nav.Link>
              </LinkContainer>
            </Nav>

            {/* Right side - Search, Account, Cart */}
            <Nav className="ms-auto d-flex align-items-center">
              {/* Search Bar */}
              <Form
                className="d-flex align-items-center me-3 d-none d-md-flex"
                onSubmit={searchSubmitHandler}
              >
                <InputBar
                  placeholder="Tìm kiếm..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  width="200px"
                  height="38px"
                  backgroundColor="#f8f9fa"
                  borderRadius="8px"
                  border="1px solid #ced4da"
                  style={{
                    marginBottom: "0",
                    marginRight: "8px",
                    minWidth: "150px",
                    maxWidth: "250px",
                  }}
                />
                <Button
                  type="submit"
                  style={{
                    height: "38px",
                    backgroundColor: "#ffffffff",
                    color: "black",
                    marginBottom: "4px",
                    paddingLeft: "0.4rem",
                  }}
                >
                  <i className="fas fa-search"></i>
                </Button>
              </Form>

              {/* Mobile Search Button */}
              <Nav.Link
                className="text-dark me-3 d-md-none"
                onClick={() => {
                  // You can implement a mobile search modal here
                  const searchTerm = prompt("Tìm kiếm sản phẩm:");
                  if (searchTerm && searchTerm.trim()) {
                    history.push(`/search/${searchTerm.trim()}`);
                  }
                }}
              >
                <i className="fas fa-search"></i>
              </Nav.Link>

              {/* Account */}
              {userInfo ? (
                <NavDropdown
                  title={
                    <span className="text-dark">
                      <i className="fas fa-user"></i> {userInfo.name}
                    </span>
                  }
                  id="username"
                  className="me-3"
                >
                  <LinkContainer to="/profile">
                    <NavDropdown.Item>Hồ sơ</NavDropdown.Item>
                  </LinkContainer>
                  {userInfo.isAdmin && (
                    <>
                      <NavDropdown.Divider />

                      <LinkContainer to="/admin/userlist">
                        <NavDropdown.Item>Quản lý người dùng</NavDropdown.Item>
                      </LinkContainer>
                      <LinkContainer to="/admin/productlist">
                        <NavDropdown.Item>Quản lý sản phẩm</NavDropdown.Item>
                      </LinkContainer>
                      <LinkContainer to="/admin/orderlist">
                        <NavDropdown.Item>Quản lý đơn hàng</NavDropdown.Item>
                      </LinkContainer>
                      <NavDropdown.Divider />
                    </>
                  )}
                  <NavDropdown.Item onClick={logoutHandler}>
                    Đăng xuất
                  </NavDropdown.Item>
                </NavDropdown>
              ) : (
                <LinkContainer to="/login">
                  <Nav.Link className="text-dark me-3">
                    <i className="fas fa-user"></i>
                  </Nav.Link>
                </LinkContainer>
              )}

              {/* Cart */}
              <LinkContainer to="/cart">
                <Nav.Link className="text-dark">
                  <i className="fas fa-shopping-cart"></i>
                </Nav.Link>
              </LinkContainer>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Custom CSS */}
      <style jsx="true">{`
        .custom-navbar {
          background-color: white !important;
          border-bottom: 1px solid #dee2e6;
        }
        .custom-navbar .navbar-nav .nav-link {
          color: black !important;
          font-weight: 500;
          padding: 0.5rem 1rem;
        }
        .custom-navbar .navbar-nav .nav-link:hover {
          color: #495057 !important;
        }
        .custom-navbar .navbar-brand {
          color: black !important;
          font-size: 1.5rem;
        }
        .dropdown-toggle::after {
          display: none;
        }

        /* Responsive improvements */
        @media (max-width: 767.98px) {
          .custom-navbar .navbar-nav .nav-link {
            padding: 0.5rem 0.75rem;
          }
          .custom-navbar .navbar-brand {
            font-size: 1.25rem;
          }
        }

        @media (max-width: 575.98px) {
          .custom-navbar .navbar-brand {
            font-size: 1.1rem;
          }
        }
      `}</style>
    </header>
  );
};

export default Header;
