import {
  PRODUCT_LIST_REQUEST,
  PRODUCT_LIST_SUCCESS,
  PRODUCT_LIST_FAIL,
} from "../constants/productConstants"; // Constants for product actions
import axios from "axios"; // Import axios for making HTTP requests

export const listProducts = () => async (dispatch) => {
  try {
    // Dispatch request action to indicate loading state
    dispatch({ type: PRODUCT_LIST_REQUEST });
    // Simulate an API call to fetch products
    const { data } = await axios.get("/api/products");

    // Dispatch success action with fetched data
    dispatch({ type: PRODUCT_LIST_SUCCESS, payload: data });
  } catch (error) {
    // Dispatch fail action with error message
    dispatch({
      type: PRODUCT_LIST_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};
