import axios from "axios";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Form, Button } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import Message from "../components/Message";
import Loader from "../components/Loader";
import FormContainer from "../components/FormContainer";
import { createProduct } from "../actions/productActions";
import { PRODUCT_CREATE_RESET } from "../constants/productConstants";
import DarkButton from "../components/StyledButton";

const ProductCreateScreen = ({ history }) => {
  // Form state
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [category, setCategory] = useState("");
  const [countInStock, setCountInStock] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [colors, setColors] = useState([
    { colorName: "blue", isAvailable: true },
  ]);
  const [sizes, setSizes] = useState([{ sizeName: "M", isAvailable: true }]);
  const [isOnSale, setIsOnSale] = useState(false);
  const [saleType, setSaleType] = useState("percentage");
  const [saleValue, setSaleValue] = useState("");
  const [saleStartDate, setSaleStartDate] = useState("");
  const [saleEndDate, setSaleEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dispatch = useDispatch();

  const productCreate = useSelector((state) => state.productCreate);
  const {
    loading: loadingCreate,
    error: errorCreate,
    success: successCreate,
    product: createdProduct,
  } = productCreate;

  useEffect(() => {
    if (successCreate) {
      // Show success message briefly before redirecting
      setTimeout(() => {
        dispatch({ type: PRODUCT_CREATE_RESET });
        setIsSubmitting(false);
        history.push("/admin/productlist");
      }, 1500);
    }

    // Reset submitting state if there's an error
    if (errorCreate) {
      setIsSubmitting(false);
    }
  }, [dispatch, history, successCreate, errorCreate]);

  const uploadFileHandler = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("image", file);
    setUploading(true);

    try {
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };

      const { data } = await axios.post("/api/upload", formData, config);

      setImage(data);
      setUploading(false);
    } catch (error) {
      console.error(error);
      setUploading(false);
    }
  };

  const submitHandler = (e) => {
    e.preventDefault();

    // Prevent duplicate submissions
    if (isSubmitting || loadingCreate) {
      return;
    }

    // Set submitting state
    setIsSubmitting(true);

    // Validation
    if (!name.trim()) {
      alert("Product name is required");
      setIsSubmitting(false);
      return;
    }

    if (!category) {
      alert("Please select a category");
      setIsSubmitting(false);
      return;
    }

    if (!description.trim()) {
      alert("Product description is required");
      setIsSubmitting(false);
      return;
    }

    if (!price || parseFloat(price) <= 0) {
      alert("Price must be greater than 0");
      setIsSubmitting(false);
      return;
    }

    if (!countInStock || parseInt(countInStock) < 0) {
      alert("Count in stock cannot be negative");
      setIsSubmitting(false);
      return;
    }

    if (!image.trim()) {
      alert("Product image is required");
      setIsSubmitting(false);
      return;
    }

    if (colors.length === 0) {
      alert("Product must have at least one color option");
      setIsSubmitting(false);
      return;
    }

    if (sizes.length === 0) {
      alert("Product must have at least one size option");
      setIsSubmitting(false);
      return;
    }

    // Sale validation
    if (isOnSale) {
      if (!saleValue || parseFloat(saleValue) <= 0) {
        alert("Sale value must be greater than 0 when product is on sale");
        setIsSubmitting(false);
        return;
      }

      if (saleType === "percentage" && parseFloat(saleValue) > 100) {
        alert("Percentage discount cannot exceed 100%");
        setIsSubmitting(false);
        return;
      }

      if (saleType === "fixed" && parseFloat(saleValue) >= parseFloat(price)) {
        alert("Fixed discount cannot exceed or equal product price");
        setIsSubmitting(false);
        return;
      }

      if (!saleStartDate) {
        alert("Sale start date is required when product is on sale");
        setIsSubmitting(false);
        return;
      }

      if (!saleEndDate) {
        alert("Sale end date is required when product is on sale");
        setIsSubmitting(false);
        return;
      }

      if (new Date(saleEndDate) <= new Date(saleStartDate)) {
        alert("Sale end date must be after sale start date");
        setIsSubmitting(false);
        return;
      }
    }

    dispatch(
      createProduct({
        name,
        price: parseFloat(price),
        image,
        category,
        description,
        countInStock: parseInt(countInStock),
        isActive,
        colors,
        sizes,
        sale: {
          isOnSale,
          saleType,
          saleValue: isOnSale ? parseFloat(saleValue) : 0,
          saleStartDate: isOnSale ? saleStartDate : null,
          saleEndDate: isOnSale ? saleEndDate : null,
        },
      })
    );
  };

  // Color management functions
  const addColor = () => {
    setColors([...colors, { colorName: "blue", isAvailable: true }]);
  };

  const updateColor = (index, field, value) => {
    const updatedColors = colors.map((color, i) =>
      i === index ? { ...color, [field]: value } : color
    );
    setColors(updatedColors);
  };

  const removeColor = (index) => {
    if (colors.length <= 1) {
      alert("Product must have at least one color option");
      return;
    }
    setColors(colors.filter((_, i) => i !== index));
  };

  // Size management functions
  const addSize = () => {
    setSizes([...sizes, { sizeName: "M", isAvailable: true }]);
  };

  const updateSize = (index, field, value) => {
    const updatedSizes = sizes.map((size, i) =>
      i === index ? { ...size, [field]: value } : size
    );
    setSizes(updatedSizes);
  };

  const removeSize = (index) => {
    if (sizes.length <= 1) {
      alert("Product must have at least one size option");
      return;
    }
    setSizes(sizes.filter((_, i) => i !== index));
  };

  return (
    <>
      <Link to="/admin/productlist" className="btn btn-light my-3">
        Go Back
      </Link>
      <FormContainer>
        <h1>Create Product</h1>
        {loadingCreate && <Loader />}
        {errorCreate && <Message variant="danger">{errorCreate}</Message>}
        {successCreate && (
          <Message variant="success">
            Product created successfully! Redirecting...
          </Message>
        )}
        <Form onSubmit={submitHandler}>
          <Form.Group controlId="name">
            <Form.Label>Name *</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter product name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            ></Form.Control>
          </Form.Group>

          <Form.Group controlId="price">
            <Form.Label>Price *</Form.Label>
            <Form.Control
              type="number"
              placeholder="Enter price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0.01"
              step="0.01"
              required
            ></Form.Control>
          </Form.Group>

          <Form.Group controlId="image">
            <Form.Label>Image *</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter image url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              required
            ></Form.Control>
            <Form.File
              id="image-file"
              label="Choose File"
              custom
              onChange={uploadFileHandler}
            ></Form.File>
            {uploading && <Loader />}
          </Form.Group>

          <Form.Group controlId="countInStock">
            <Form.Label>Count In Stock *</Form.Label>
            <Form.Control
              type="number"
              placeholder="Enter count in stock"
              value={countInStock}
              onChange={(e) => setCountInStock(e.target.value)}
              min="0"
              required
            ></Form.Control>
          </Form.Group>

          <Form.Group controlId="category">
            <Form.Label>Category *</Form.Label>
            <Form.Control
              as="select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="">Select Category</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="jacket">Jacket</option>
              <option value="accessory">Accessory</option>
            </Form.Control>
          </Form.Group>

          <Form.Group controlId="description">
            <Form.Label>Description *</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Enter product description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            ></Form.Control>
          </Form.Group>

          {/* Product Status */}
          <Form.Group controlId="isActive">
            <Form.Check
              type="checkbox"
              label="Product is Active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
          </Form.Group>

          {/* Colors Section */}
          <Form.Group>
            <Form.Label>Colors *</Form.Label>
            {colors.map((color, index) => (
              <div key={index} className="d-flex align-items-center mb-2">
                <Form.Control
                  as="select"
                  value={color.colorName}
                  onChange={(e) =>
                    updateColor(index, "colorName", e.target.value)
                  }
                  className="mr-2"
                >
                  <option value="blue">Blue</option>
                  <option value="black">Black</option>
                  <option value="pink">Pink</option>
                </Form.Control>
                <Form.Check
                  type="checkbox"
                  label="Available"
                  checked={color.isAvailable}
                  onChange={(e) =>
                    updateColor(index, "isAvailable", e.target.checked)
                  }
                  className="mr-2"
                />
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => removeColor(index)}
                  disabled={colors.length <= 1}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button variant="secondary" onClick={addColor}>
              Add Color
            </Button>
          </Form.Group>

          {/* Sizes Section */}
          <Form.Group>
            <Form.Label>Sizes *</Form.Label>
            {sizes.map((size, index) => (
              <div key={index} className="d-flex align-items-center mb-2">
                <Form.Control
                  as="select"
                  value={size.sizeName}
                  onChange={(e) =>
                    updateSize(index, "sizeName", e.target.value)
                  }
                  className="mr-2"
                >
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                </Form.Control>
                <Form.Check
                  type="checkbox"
                  label="Available"
                  checked={size.isAvailable}
                  onChange={(e) =>
                    updateSize(index, "isAvailable", e.target.checked)
                  }
                  className="mr-2"
                />
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => removeSize(index)}
                  disabled={sizes.length <= 1}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button variant="secondary" onClick={addSize}>
              Add Size
            </Button>
          </Form.Group>

          {/* Sale Information */}
          <Form.Group controlId="isOnSale">
            <Form.Check
              type="checkbox"
              label="Product is on Sale"
              checked={isOnSale}
              onChange={(e) => setIsOnSale(e.target.checked)}
            />
          </Form.Group>

          {isOnSale && (
            <>
              <Form.Group controlId="saleType">
                <Form.Label>Sale Type</Form.Label>
                <Form.Control
                  as="select"
                  value={saleType}
                  onChange={(e) => setSaleType(e.target.value)}
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </Form.Control>
              </Form.Group>

              <Form.Group controlId="saleValue">
                <Form.Label>
                  Sale Value {saleType === "percentage" ? "(%)" : "($)"}
                </Form.Label>
                <Form.Control
                  type="number"
                  placeholder={`Enter ${
                    saleType === "percentage" ? "percentage" : "amount"
                  }`}
                  value={saleValue}
                  onChange={(e) => setSaleValue(e.target.value)}
                  min="0.01"
                  step="0.01"
                  max={saleType === "percentage" ? "100" : undefined}
                />
              </Form.Group>

              <Form.Group controlId="saleStartDate">
                <Form.Label>Sale Start Date</Form.Label>
                <Form.Control
                  type="date"
                  value={saleStartDate}
                  onChange={(e) => setSaleStartDate(e.target.value)}
                />
              </Form.Group>

              <Form.Group controlId="saleEndDate">
                <Form.Label>Sale End Date</Form.Label>
                <Form.Control
                  type="date"
                  value={saleEndDate}
                  onChange={(e) => setSaleEndDate(e.target.value)}
                />
              </Form.Group>
            </>
          )}

          <div className="d-flex justify-content-between">
            <DarkButton
              type="submit"
              variant="primary"
              disabled={loadingCreate || isSubmitting}
            >
              {loadingCreate || isSubmitting ? "Creating..." : "Create Product"}
            </DarkButton>
            <Button
              variant="secondary"
              onClick={() => history.push("/admin/productlist")}
              disabled={loadingCreate || isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </Form>
      </FormContainer>
    </>
  );
};

export default ProductCreateScreen;
