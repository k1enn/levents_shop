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
      alert("Tên sản phẩm là bắt buộc");
      setIsSubmitting(false);
      return;
    }

    if (!category) {
      alert("Vui lòng chọn danh mục");
      setIsSubmitting(false);
      return;
    }

    if (!description.trim()) {
      alert("Mô tả sản phẩm là bắt buộc");
      setIsSubmitting(false);
      return;
    }

    if (!price || parseFloat(price) <= 0) {
      alert("Giá phải lớn hơn 0");
      setIsSubmitting(false);
      return;
    }

    if (!countInStock || parseInt(countInStock) < 0) {
      alert("Số lượng tồn kho không thể âm");
      setIsSubmitting(false);
      return;
    }

    if (!image.trim()) {
      alert("Hình ảnh sản phẩm là bắt buộc");
      setIsSubmitting(false);
      return;
    }

    if (colors.length === 0) {
      alert("Sản phẩm phải có ít nhất một tùy chọn màu");
      setIsSubmitting(false);
      return;
    }

    if (sizes.length === 0) {
      alert("Sản phẩm phải có ít nhất một tùy chọn kích thước");
      setIsSubmitting(false);
      return;
    }

    // Sale validation
    if (isOnSale) {
      if (!saleValue || parseFloat(saleValue) <= 0) {
        alert("Giá trị khuyến mãi phải lớn hơn 0 khi sản phẩm đang giảm giá");
        setIsSubmitting(false);
        return;
      }

      if (saleType === "percentage" && parseFloat(saleValue) > 100) {
        alert("Phần trăm giảm giá không thể vượt quá 100%");
        setIsSubmitting(false);
        return;
      }

      if (saleType === "fixed" && parseFloat(saleValue) >= parseFloat(price)) {
        alert(
          "Số tiền giảm giá cố định không thể vượt quá hoặc bằng giá sản phẩm"
        );
        setIsSubmitting(false);
        return;
      }

      if (!saleStartDate) {
        alert("Ngày bắt đầu khuyến mãi là bắt buộc khi sản phẩm đang giảm giá");
        setIsSubmitting(false);
        return;
      }

      if (!saleEndDate) {
        alert(
          "Ngày kết thúc khuyến mãi là bắt buộc khi sản phẩm đang giảm giá"
        );
        setIsSubmitting(false);
        return;
      }

      if (new Date(saleEndDate) <= new Date(saleStartDate)) {
        alert("Ngày kết thúc khuyến mãi phải sau ngày bắt đầu khuyến mãi");
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
      alert("Sản phẩm phải có ít nhất một tùy chọn màu");
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
      alert("Sản phẩm phải có ít nhất một tùy chọn kích thước");
      return;
    }
    setSizes(sizes.filter((_, i) => i !== index));
  };

  return (
    <>
      <Link to="/admin/productlist" className="btn btn-light my-3">
        Quay lại
      </Link>
      <FormContainer>
        <h1>Tạo sản phẩm</h1>
        {loadingCreate && <Loader />}
        {errorCreate && <Message variant="danger">{errorCreate}</Message>}
        {successCreate && (
          <Message variant="success">
            Tạo sản phẩm thành công! Đang chuyển hướng...
          </Message>
        )}
        <Form onSubmit={submitHandler}>
          <Form.Group controlId="name">
            <Form.Label>Tên *</Form.Label>
            <Form.Control
              type="text"
              placeholder="Nhập tên sản phẩm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            ></Form.Control>
          </Form.Group>

          <Form.Group controlId="price">
            <Form.Label>Giá *</Form.Label>
            <Form.Control
              type="number"
              placeholder="Nhập giá"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0.01"
              step="0.01"
              required
            ></Form.Control>
          </Form.Group>

          <Form.Group controlId="image">
            <Form.Label>Hình ảnh *</Form.Label>
            <Form.Control
              type="text"
              placeholder="Nhập URL hình ảnh"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              required
            ></Form.Control>
            <Form.File
              id="image-file"
              label="Chọn tệp"
              custom
              onChange={uploadFileHandler}
            ></Form.File>
            {uploading && <Loader />}
          </Form.Group>

          <Form.Group controlId="countInStock">
            <Form.Label>Số lượng tồn kho *</Form.Label>
            <Form.Control
              type="number"
              placeholder="Nhập số lượng tồn kho"
              value={countInStock}
              onChange={(e) => setCountInStock(e.target.value)}
              min="0"
              required
            ></Form.Control>
          </Form.Group>

          <Form.Group controlId="category">
            <Form.Label>Danh mục *</Form.Label>
            <Form.Control
              as="select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="">Chọn danh mục</option>
              <option value="female">Nữ</option>
              <option value="male">Nam</option>
              <option value="jacket">Áo khoác</option>
              <option value="accessory">Phụ kiện</option>
            </Form.Control>
          </Form.Group>

          <Form.Group controlId="description">
            <Form.Label>Mô tả *</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Nhập mô tả sản phẩm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            ></Form.Control>
          </Form.Group>

          {/* Product Status */}
          <Form.Group controlId="isActive">
            <Form.Check
              type="checkbox"
              label="Sản phẩm đang hoạt động"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
          </Form.Group>

          {/* Colors Section */}
          <Form.Group>
            <Form.Label>Màu sắc *</Form.Label>
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
                  <option value="blue">Xanh dương</option>
                  <option value="black">Đen</option>
                  <option value="pink">Hồng</option>
                </Form.Control>
                <Form.Check
                  type="checkbox"
                  label="Có sẵn"
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
                  Xóa
                </Button>
              </div>
            ))}
            <Button variant="secondary" onClick={addColor}>
              Thêm màu
            </Button>
          </Form.Group>

          {/* Sizes Section */}
          <Form.Group>
            <Form.Label>Kích thước *</Form.Label>
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
                  label="Có sẵn"
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
                  Xóa
                </Button>
              </div>
            ))}
            <Button variant="secondary" onClick={addSize}>
              Thêm kích thước
            </Button>
          </Form.Group>

          {/* Sale Information */}
          <Form.Group controlId="isOnSale">
            <Form.Check
              type="checkbox"
              label="Sản phẩm đang khuyến mãi"
              checked={isOnSale}
              onChange={(e) => setIsOnSale(e.target.checked)}
            />
          </Form.Group>

          {isOnSale && (
            <>
              <Form.Group controlId="saleType">
                <Form.Label>Loại khuyến mãi</Form.Label>
                <Form.Control
                  as="select"
                  value={saleType}
                  onChange={(e) => setSaleType(e.target.value)}
                >
                  <option value="percentage">Phần trăm</option>
                  <option value="fixed">Số tiền cố định</option>
                </Form.Control>
              </Form.Group>

              <Form.Group controlId="saleValue">
                <Form.Label>
                  Giá trị khuyến mãi{" "}
                  {saleType === "percentage" ? "(%)" : "(VND)"}
                </Form.Label>
                <Form.Control
                  type="number"
                  placeholder={`Nhập ${
                    saleType === "percentage" ? "phần trăm" : "số tiền"
                  }`}
                  value={saleValue}
                  onChange={(e) => setSaleValue(e.target.value)}
                  min="0.01"
                  step="0.01"
                  max={saleType === "percentage" ? "100" : undefined}
                />
              </Form.Group>

              <Form.Group controlId="saleStartDate">
                <Form.Label>Ngày bắt đầu khuyến mãi</Form.Label>
                <Form.Control
                  type="date"
                  value={saleStartDate}
                  onChange={(e) => setSaleStartDate(e.target.value)}
                />
              </Form.Group>

              <Form.Group controlId="saleEndDate">
                <Form.Label>Ngày kết thúc khuyến mãi</Form.Label>
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
              {loadingCreate || isSubmitting ? "Đang tạo..." : "Tạo sản phẩm"}
            </DarkButton>
            <Button
              variant="secondary"
              onClick={() => history.push("/admin/productlist")}
              disabled={loadingCreate || isSubmitting}
            >
              Hủy
            </Button>
          </div>
        </Form>
      </FormContainer>
    </>
  );
};

export default ProductCreateScreen;
