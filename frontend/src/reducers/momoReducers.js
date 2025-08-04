import {
  MOMO_PAYMENT_CREATE_REQUEST,
  MOMO_PAYMENT_CREATE_SUCCESS,
  MOMO_PAYMENT_CREATE_FAIL,
  MOMO_PAYMENT_STATUS_REQUEST,
  MOMO_PAYMENT_STATUS_SUCCESS,
  MOMO_PAYMENT_STATUS_FAIL,
  MOMO_PAYMENT_RESET,
} from "../constants/momoConstants";

export const momoPaymentCreateReducer = (state = {}, action) => {
  switch (action.type) {
    case MOMO_PAYMENT_CREATE_REQUEST:
      return { loading: true };
    case MOMO_PAYMENT_CREATE_SUCCESS:
      return { loading: false, success: true, paymentData: action.payload };
    case MOMO_PAYMENT_CREATE_FAIL:
      return { loading: false, error: action.payload };
    case MOMO_PAYMENT_RESET:
      return {};
    default:
      return state;
  }
};

export const momoPaymentStatusReducer = (state = {}, action) => {
  switch (action.type) {
    case MOMO_PAYMENT_STATUS_REQUEST:
      return { loading: true };
    case MOMO_PAYMENT_STATUS_SUCCESS:
      return { loading: false, success: true, statusData: action.payload };
    case MOMO_PAYMENT_STATUS_FAIL:
      return { loading: false, error: action.payload };
    case MOMO_PAYMENT_RESET:
      return {};
    default:
      return state;
  }
};
