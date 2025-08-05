import axios from "axios";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Form, Button } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import Message from "../components/Message";
import Loader from "../components/Loader";
import FormContainer from "../components/FormContainer";
import { listProductDetails, updateProduct } from "../actions/productActions";
import { PRODUCT_UPDATE_RESET } from "../constants/productConstants";

const ProductEditScreen = ({ match, history }) => {
  const productId = match.params.id;

  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [image, setImage] = useState("");
  const [category, setCategory] = useState("");
  const [countInStock, setCountInStock] = useState(0);
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [isOnSale, setIsOnSale] = useState(false);
  const [saleType, setSaleType] = useState("percentage");
  const [saleValue, setSaleValue] = useState(0);
  const [saleStartDate, setSaleStartDate] = useState("");
  const [saleEndDate, setSaleEndDate] = useState("");

  const dispatch = useDispatch();

  const productDetails = useSelector((state) => state.productDetails);
  const { loading, error, product } = productDetails;

  const productUpdate = useSelector((state) => state.productUpdate);
  const {
    loading: loadingUpdate,
    error: errorUpdate,
    success: successUpdate,
  } = productUpdate;

  useEffect(() => {
    if (successUpdate) {
      dispatch({ type: PRODUCT_UPDATE_RESET });
      history.push("/admin/productlist");
    } else {
      if (!product.name || product._id !== productId) {
        dispatch(listProductDetails(productId));
      } else {
        setName(product.name);
        setPrice(product.price);
        setImage(product.image);
        setCategory(product.category);
        setCountInStock(product.countInStock);
        setDescription(product.description);

        // Add new fields
        setIsActive(product.isActive);
        setColors(
          product.colors && product.colors.length > 0
            ? product.colors
            : [{ colorName: "blue", isAvailable: true }]
        );
        setSizes(
          product.sizes && product.sizes.length > 0
            ? product.sizes
            : [{ sizeName: "M", isAvailable: true }]
        );

        // Sale information
        if (product.sale) {
          setIsOnSale(product.sale.isOnSale);
          setSaleType(product.sale.saleType);
          setSaleValue(product.sale.saleValue);
          setSaleStartDate(
            product.sale.saleStartDate
              ? new Date(product.sale.saleStartDate).toISOString().split("T")[0]
              : ""
          );

          setSaleEndDate(
            product.sale.saleEndDate
              ? new Date(product.sale.saleEndDate).toISOString().split("T")[0]
              : ""
          );
        }
      }
    }
  }, [dispatch, history, productId, product, successUpdate]);

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

    // Validation
    if (!name.trim()) {
      alert("Tên sản phẩm là bắt buộc");
      return;
    }

    if (!category) {
      alert("Vui lòng chọn danh mục");
      return;
    }

    if (!description.trim()) {
      alert("Mô tả sản phẩm là bắt buộc");
      return;
    }

    if (price <= 0) {
      alert("Giá phải lớn hơn 0");
      return;
    }

    if (countInStock < 0) {
      alert("Số lượng tồn kho không thể âm");
      return;
    }

    if (!image.trim()) {
      alert("Hình ảnh sản phẩm là bắt buộc");
      return;
    }

    if (colors.length === 0) {
      alert("Sản phẩm phải có ít nhất một tùy chọn màu");
      return;
    }

    if (sizes.length === 0) {
      alert("Sản phẩm phải có ít nhất một tùy chọn kích thước");
      return;
    }

    // Sale validation
    if (isOnSale) {
      if (!saleValue || saleValue <= 0) {
        alert("Giá trị khuyến mãi phải lớn hơn 0 khi sản phẩm đang giảm giá");
        return;
      }

      if (saleType === "percentage" && saleValue > 100) {
        alert("Phần trăm giảm giá không thể vượt quá 100%");
        return;
      }

      if (saleType === "fixed" && saleValue >= price) {
        alert(
          "Số tiền giảm giá cố định không thể vượt quá hoặc bằng giá sản phẩm"
        );
        return;
      }

      if (!saleStartDate) {
        alert("Ngày bắt đầu khuyến mãi là bắt buộc khi sản phẩm đang giảm giá");
        return;
      }

      if (!saleEndDate) {
        alert(
          "Ngày kết thúc khuyến mãi là bắt buộc khi sản phẩm đang giảm giá"
        );
        return;
      }

      if (new Date(saleEndDate) <= new Date(saleStartDate)) {
        alert("Ngày kết thúc khuyến mãi phải sau ngày bắt đầu khuyến mãi");
        return;
      }
    }

    dispatch(
      updateProduct({
        _id: productId,
        name,
        price,
        image,
        category,
        description,
        countInStock,
        isActive,
        colors,
        sizes,
        sale: {
          isOnSale,
          saleType,
          saleValue: isOnSale ? saleValue : 0,
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
        <h1>Chỉnh sửa sản phẩm</h1>
        {loadingUpdate && <Loader />}
        {errorUpdate && <Message variant="danger">{errorUpdate}</Message>}
        {loading ? (
          <Loader />
        ) : error ? (
          <Message variant="danger">{error}</Message>
        ) : (
          <Form onSubmit={submitHandler}>
            <Form.Group controlId="name">
              <Form.Label>Tên *</Form.Label>
              <Form.Control
                type="name"
                placeholder="Nhập tên"
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
                placeholder="Nhập mô tả"
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
              <Form.Label>Màu sắc</Form.Label>
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
              <Form.Label>Kích thước</Form.Label>
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

            <Button type="submit" variant="primary">
              Cập nhật
            </Button>
          </Form>
        )}
      </FormContainer>
    </>
  );
};

export default ProductEditScreen;
