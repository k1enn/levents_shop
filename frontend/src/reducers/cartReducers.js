import {
  CART_ADD_ITEM,
  CART_REMOVE_ITEM,
  CART_REMOVE_SPECIFIC_ITEM,
  CART_CLEAR_ITEMS,
} from "../constants/cartConstants";

export const cartReducer = (state = { cartItems: [] }, action) => {
  switch (action.type) {
    case CART_ADD_ITEM:
      const item = action.payload;

      // Check existing items (compare by product, color, and size)
      const existItem = state.cartItems.find(
        (x) =>
          x.product === item.product &&
          x.color === item.color &&
          x.size === item.size
      );

      // Handle existed items
      if (existItem) {
        return {
          ...state,
          cartItems: state.cartItems.map((x) =>
            x.product === existItem.product &&
            x.color === existItem.color &&
            x.size === existItem.size
              ? item
              : x
          ),
        };
      }
      // If not existed
      else {
        return {
          ...state,
          cartItems: [...state.cartItems, item],
        };
      }
    case CART_REMOVE_ITEM:
      return {
        ...state,
        // Trip out whatever id we removed
        cartItems: state.cartItems.filter((x) => x.product !== action.payload),
      };
    case CART_REMOVE_SPECIFIC_ITEM:
      return {
        ...state,
        cartItems: state.cartItems.filter(
          (x) =>
            !(
              x.product === action.payload.productId &&
              x.color === action.payload.color &&
              x.size === action.payload.size
            )
        ),
      };
    case CART_CLEAR_ITEMS:
      return {
        ...state,
        cartItems: [],
      };
    default:
      return state;
  }
};
