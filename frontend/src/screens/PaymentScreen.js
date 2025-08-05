import React, { useState, useEffect } from "react";
import { Form, Button, Col, Alert } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import FormContainer from "../components/FormContainer";
import CheckoutSteps from "../components/CheckoutSteps";
import { savePaymentMethod } from "../actions/cartActions";

const PaymentScreen = ({ history }) => {
  const cart = useSelector((state) => state.cart);
  const { shippingAddress } = cart;

  const [paymentMethod, setPaymentMethod] = useState("PayPal");

  useEffect(() => {
    if (!shippingAddress.address) {
      history.push("/shipping");
    }
  }, [history, shippingAddress.address]);

  const dispatch = useDispatch();

  const submitHandler = (e) => {
    e.preventDefault();
    dispatch(savePaymentMethod(paymentMethod));
    history.push("/placeorder");
  };

  return (
    <FormContainer>
      <CheckoutSteps step1 step2 step3 />
      <h1>Phương thức thanh toán</h1>
      <Form onSubmit={submitHandler}>
        <Form.Group>
          <Form.Label as="legend">Chọn phương thức</Form.Label>
          <Col>
            <Form.Check
              type="radio"
              label="PayPal hoặc Thẻ tín dụng"
              id="PayPal"
              name="paymentMethod"
              value="PayPal"
              checked={paymentMethod === "PayPal"}
              onChange={(e) => setPaymentMethod(e.target.value)}
            ></Form.Check>
            <Form.Check
              type="radio"
              label="Ví điện tử MoMo"
              id="MoMo"
              name="paymentMethod"
              value="MoMo"
              checked={paymentMethod === "MoMo"}
              onChange={(e) => setPaymentMethod(e.target.value)}
            ></Form.Check>
            {/* <Form.Check
              type='radio'
              label='Stripe'
              id='Stripe'
              name='paymentMethod'
              value='Stripe'
              onChange={(e) => setPaymentMethod(e.target.value)}
            ></Form.Check> */}
          </Col>
        </Form.Group>

        {paymentMethod === "MoMo" && (
          <Alert variant="info" className="mt-3">
            <Alert.Heading>Thanh toán bằng ví điện tử MoMo</Alert.Heading>
            <p>
              Bạn sẽ được chuyển hướng đến cổng thanh toán an toàn của MoMo để
              hoàn tất giao dịch. Hãy đảm bảo bạn đã cài đặt ứng dụng MoMo trên
              thiết bị di động hoặc có thể truy cập vào tài khoản MoMo của bạn.
            </p>
            <hr />
            <p className="mb-0">
              <strong>Lưu ý:</strong> Đây chỉ là mục đích giáo dục sử dụng môi
              trường thử nghiệm của MoMo.
            </p>
          </Alert>
        )}

        <Button type="submit" variant="primary">
          Tiếp tục
        </Button>
      </Form>
    </FormContainer>
  );
};

export default PaymentScreen;
