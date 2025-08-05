import axios from "axios";
import {
  MOMO_PAYMENT_CREATE_REQUEST,
  MOMO_PAYMENT_CREATE_SUCCESS,
  MOMO_PAYMENT_CREATE_FAIL,
  MOMO_PAYMENT_STATUS_REQUEST,
  MOMO_PAYMENT_STATUS_SUCCESS,
  MOMO_PAYMENT_STATUS_FAIL,
  MOMO_PAYMENT_RESET,
} from "../constants/momoConstants";

// Create MoMo payment
export const createMomoPayment =
  (paymentData) => async (dispatch, getState) => {
    try {
      console.log("=== Frontend: Creating MoMo Payment ===");
      console.log("Payment data:", paymentData);

      dispatch({
        type: MOMO_PAYMENT_CREATE_REQUEST,
      });

      const {
        userLogin: { userInfo },
      } = getState();

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      console.log("Making request to: /api/payment/momo/create");
      console.log("With config:", config);
      console.log("With data:", paymentData);

      const { data } = await axios.post(
        "/api/payment/momo/create",
        paymentData,
        config
      );

      console.log("Response received:", data);

      dispatch({
        type: MOMO_PAYMENT_CREATE_SUCCESS,
        payload: data,
      });

      return data;
    } catch (error) {
      console.error("=== Frontend: MoMo Payment Error ===");
      console.error("Error object:", error);
      console.error("Error response:", error.response);
      console.error("Error message:", error.message);

      dispatch({
        type: MOMO_PAYMENT_CREATE_FAIL,
        payload:
          error.response && error.response.data.message
            ? error.response.data.message
            : error.message,
      });
      throw error;
    }
  };

// Check MoMo payment status
export const checkMomoPaymentStatus =
  (orderId) => async (dispatch, getState) => {
    try {
      dispatch({
        type: MOMO_PAYMENT_STATUS_REQUEST,
      });

      const {
        userLogin: { userInfo },
      } = getState();

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const { data } = await axios.post(
        "/api/payment/momo/status",
        { orderId },
        config
      );

      dispatch({
        type: MOMO_PAYMENT_STATUS_SUCCESS,
        payload: data,
      });

      return data;
    } catch (error) {
      dispatch({
        type: MOMO_PAYMENT_STATUS_FAIL,
        payload:
          error.response && error.response.data.message
            ? error.response.data.message
            : error.message,
      });
      throw error;
    }
  };

// Reset MoMo payment state
export const resetMomoPayment = () => (dispatch) => {
  dispatch({ type: MOMO_PAYMENT_RESET });
};
