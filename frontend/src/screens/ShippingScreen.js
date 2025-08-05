import React, { useState } from "react";
import { Form, Button, Alert } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import FormContainer from "../components/FormContainer";
import CheckoutSteps from "../components/CheckoutSteps";
import { saveShippingAddress } from "../actions/cartActions";
import DarkButton from "../components/StyledButton";

const ShippingScreen = ({ history }) => {
  const cart = useSelector((state) => state.cart);
  const { shippingAddress } = cart;

  const [address, setAddress] = useState(shippingAddress.address || "");
  const [city, setCity] = useState(shippingAddress.city || "");
  const [postalCode, setPostalCode] = useState(
    shippingAddress.postalCode || ""
  );
  const [country, setCountry] = useState(shippingAddress.country || "");
  const [errors, setErrors] = useState({});

  const dispatch = useDispatch();

  // Clear specific error when user starts typing
  const clearError = (field) => {
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!address.trim()) {
      newErrors.address = "Địa chỉ là bắt buộc";
    }

    if (!city.trim()) {
      newErrors.city = "Thành phố là bắt buộc";
    }

    if (!postalCode.trim()) {
      newErrors.postalCode = "Mã bưu điện là bắt buộc";
    }

    if (!country.trim()) {
      newErrors.country = "Quốc gia là bắt buộc";
    }

    return newErrors;
  };

  const submitHandler = (e) => {
    e.preventDefault();

    const formErrors = validateForm();

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    // Clear errors if validation passes
    setErrors({});

    dispatch(saveShippingAddress({ address, city, postalCode, country }));
    history.push("/payment");
  };

  return (
    <FormContainer>
      <CheckoutSteps step1 step2 />
      <h1>Thông tin giao hàng</h1>
      <Form onSubmit={submitHandler}>
        <Form.Group controlId="address">
          <Form.Label>Địa chỉ</Form.Label>
          <Form.Control
            type="text"
            placeholder="Nhập địa chỉ"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              clearError("address");
            }}
            isInvalid={!!errors.address}
          />
          <Form.Control.Feedback type="invalid">
            {errors.address}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group controlId="city">
          <Form.Label>Thành phố</Form.Label>
          <Form.Control
            type="text"
            placeholder="Nhập thành phố"
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              clearError("city");
            }}
            isInvalid={!!errors.city}
          />
          <Form.Control.Feedback type="invalid">
            {errors.city}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group controlId="postalCode">
          <Form.Label>Mã bưu điện</Form.Label>
          <Form.Control
            type="text"
            placeholder="Nhập mã bưu điện"
            value={postalCode}
            onChange={(e) => {
              setPostalCode(e.target.value);
              clearError("postalCode");
            }}
            isInvalid={!!errors.postalCode}
          />
          <Form.Control.Feedback type="invalid">
            {errors.postalCode}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group controlId="country">
          <Form.Label>Quốc gia</Form.Label>
          <Form.Control
            type="text"
            placeholder="Nhập quốc gia"
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              clearError("country");
            }}
            isInvalid={!!errors.country}
          />
          <Form.Control.Feedback type="invalid">
            {errors.country}
          </Form.Control.Feedback>
        </Form.Group>

        <DarkButton type="submit" variant="primary">
          Tiếp tục
        </DarkButton>
      </Form>
    </FormContainer>
  );
};

export default ShippingScreen;
