import { createStore, combineReducers, applyMiddleware } from "redux";
import { thunk } from "redux-thunk";
import { composeWithDevTools } from "@redux-devtools/extension";
import { productListReducer } from './reducers/productReducers';

// Combine all reducers into a single root reducer
const reducer = combineReducers({
    productList: productListReducer,
})

// Initial state for the store
const initialState = {}
// Middleware configuration
const middleware = [thunk]
// Create Redux store with combined reducers, initial state, and middleware configuration
// composeWithDevTools enables Redux DevTools for debugging
const store = createStore(reducer, initialState, composeWithDevTools(applyMiddleware(...middleware)))

export default store;