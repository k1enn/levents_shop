import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Form, Row, Col } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import Message from "../components/Message";
import Loader from "../components/Loader";
import InputBar from "../components/InputBar";
import DarkButton from "../components/StyledButton";
import { register } from "../actions/userActions.js";
import FormContainer from "../components/FormContainer";

const RegisterScreen = ({ location, history }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(null);

  const userRegister = useSelector((state) => state.userRegister);
  const { loading, error, userInfo } = userRegister;
  const dispatch = useDispatch();

  const redirect = location.search ? location.search.split("=")[1] : "/";

  // Redirect if user logged in
  useEffect(() => {
    if (userInfo) {
      history.push(redirect);
    }
  }, [history, userInfo, redirect]);

  const submitHandler = (e) => {
    e.preventDefault();
    if (confirmPassword !== password) {
      setMessage("Mật khẩu không khớp");
    } else {
      dispatch(register(name, email, password));
    }
  };
  return (
    <FormContainer>
      <h1 className="text-center">Đăng ký</h1>
      {message && <Message variant="danger">{message}</Message>}
      {error && <Message variant="danger">{error}</Message>}
      {loading && <Loader></Loader>}
      <Form onSubmit={submitHandler}>
        <InputBar
          legend="Tên"
          type="text"
          placeholder="Nhập tên"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <InputBar
          legend="Địa chỉ Email"
          type="email"
          placeholder="Nhập email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <InputBar
          legend="Mật khẩu"
          type="password"
          placeholder="Nhập mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <InputBar
          legend="Xác nhận mật khẩu"
          type="password"
          placeholder="Xác nhận mật khẩu"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "10px",
          }}
        >
          <DarkButton type="submit" size="medium">
            Đăng ký
          </DarkButton>
        </div>
      </Form>

      <Row className="py-3">
        <Col>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "-8px",
            }}
          >
            Đã có tài khoản?{" "}
            <Link to={redirect ? `/login?redirect=${redirect}` : `/login`}>
              Đăng nhập
            </Link>
          </div>
        </Col>
      </Row>
    </FormContainer>
  );
};

export default RegisterScreen;
