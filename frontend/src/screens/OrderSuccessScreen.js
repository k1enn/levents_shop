import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Row, Col, Card, Alert, Button, Spinner } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { checkMomoPaymentStatus } from "../actions/momoActions";
import Message from "../components/Message";

const OrderSuccessScreen = ({ history, location }) => {
  const dispatch = useDispatch();
  const [paymentStatus, setPaymentStatus] = useState("checking");
  const [orderInfo, setOrderInfo] = useState(null);

  // Extract query parameters from URL
  const urlParams = new URLSearchParams(location.search);
  const orderId = urlParams.get("orderId");
  const resultCode = urlParams.get("resultCode");
  const message = urlParams.get("message");

  const momoPaymentStatus = useSelector((state) => state.momoPaymentStatus);
  const { loading, statusData, error } = momoPaymentStatus;

  useEffect(() => {
    console.log("OrderSuccessScreen - URL params:", {
      orderId,
      resultCode,
      message,
    });

    if (orderId) {
      // Check payment status with MoMo
      console.log("Checking payment status for order:", orderId);

      // Set a timeout to fall back to URL parameters if status check takes too long
      const timeoutId = setTimeout(() => {
        if (paymentStatus === "checking") {
          console.log("Status check timeout, falling back to URL parameters");
          if (resultCode === "0") {
            setPaymentStatus("success");
          } else {
            setPaymentStatus("failed");
          }
        }
      }, 10000); // 10 second timeout

      dispatch(checkMomoPaymentStatus(orderId))
        .then((result) => {
          clearTimeout(timeoutId);
          console.log("Payment status result:", result);
          // Check if payment was successful based on MoMo response
          if (result.resultCode === 0 || result.resultCode === "0") {
            setPaymentStatus("success");
          } else {
            setPaymentStatus("failed");
          }
          setOrderInfo(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          console.error("Error checking payment status:", error);
          // If MoMo status check fails, fall back to URL parameters
          if (resultCode === "0") {
            console.log("Falling back to URL resultCode - payment successful");
            setPaymentStatus("success");
          } else {
            setPaymentStatus("failed");
          }
        });

      return () => clearTimeout(timeoutId);
    } else {
      // If no orderId, check URL parameters
      console.log("No orderId, checking URL resultCode:", resultCode);
      if (resultCode === "0") {
        setPaymentStatus("success");
      } else {
        setPaymentStatus("failed");
      }
    }
  }, [dispatch, orderId, resultCode, paymentStatus]);

  const renderPaymentResult = () => {
    if (loading || paymentStatus === "checking") {
      return (
        <Card className="text-center p-4">
          <Spinner animation="border" role="status" className="mx-auto mb-3">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <h4>Checking Payment Status...</h4>
          <p>Please wait while we verify your payment with MoMo.</p>
        </Card>
      );
    }

    if (error) {
      return (
        <Message variant="danger">
          Error checking payment status: {error}
        </Message>
      );
    }

    if (paymentStatus === "success") {
      return (
        <Card className="text-center p-4 border-success">
          <div className="text-success mb-3">
            <i className="fas fa-check-circle fa-4x"></i>
          </div>
          <h2 className="text-success">Payment Successful!</h2>
          <p className="lead">
            Your MoMo payment has been processed successfully.
          </p>
          {orderId && (
            <p>
              <strong>Order ID:</strong> {orderId}
            </p>
          )}
          {statusData && statusData.transId && (
            <p>
              <strong>Transaction ID:</strong> {statusData.transId}
            </p>
          )}
          <div className="mt-4">
            <Button
              as={Link}
              to={orderId ? `/order/${orderId}` : "/profile"}
              variant="success"
              size="lg"
              className="me-3"
            >
              View Order Details
            </Button>
            <Button as={Link} to="/" variant="outline-primary" size="lg">
              Continue Shopping
            </Button>
          </div>
        </Card>
      );
    }

    if (paymentStatus === "failed") {
      return (
        <Card className="text-center p-4 border-danger">
          <div className="text-danger mb-3">
            <i className="fas fa-times-circle fa-4x"></i>
          </div>
          <h2 className="text-danger">Payment Failed</h2>
          <p className="lead">
            Unfortunately, your MoMo payment could not be processed.
          </p>
          {message && (
            <Alert variant="danger">
              <strong>Error:</strong> {message}
            </Alert>
          )}
          {orderId && (
            <p>
              <strong>Order ID:</strong> {orderId}
            </p>
          )}
          <div className="mt-4">
            <Button
              as={Link}
              to={orderId ? `/order/${orderId}` : "/cart"}
              variant="danger"
              size="lg"
              className="me-3"
            >
              {orderId ? "View Order" : "Return to Cart"}
            </Button>
            <Button as={Link} to="/payment" variant="outline-primary" size="lg">
              Try Different Payment Method
            </Button>
          </div>
        </Card>
      );
    }

    return null;
  };

  return (
    <div className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <h1 className="text-center mb-4">Payment Result</h1>
          {renderPaymentResult()}

          <div className="text-center mt-4">
            <small className="text-muted">
              If you have any questions about your payment, please contact our
              support team.
            </small>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default OrderSuccessScreen;
