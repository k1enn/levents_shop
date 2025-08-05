import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";
import InputBar from "./InputBar";

const SearchBox = ({
  onSearch,
  placeholder = "Search Products...",
  className = "",
}) => {
  const [keyword, setKeyword] = useState("");

  const submitHandler = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(keyword.trim());
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setKeyword(value);
  };

  return (
    <Form
      onSubmit={submitHandler}
      className={`d-flex align-items-center ${className}`}
    >
      <InputBar
        placeholder={placeholder}
        value={keyword}
        onChange={handleInputChange}
        width="100%"
        height="40px"
        backgroundColor="#f8f9fa"
        style={{ marginBottom: "0", marginRight: "8px", paddingBottom: "4px" }}
      />
      <Button
        variant=""
        type="submit"
        style={{
          backgroundColor: "#ffffffff",
          borderRadius: "8px",
          height: "40px",
          minWidth: "20px",
          marginBottom: "4px",
          paddingLeft: "0.8rem",
        }}
      >
        <i className="fas fa-search"></i>
      </Button>
    </Form>
  );
};

export default SearchBox;
