import React, { useState } from "react";
import { Form, Button, InputGroup } from "react-bootstrap";

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
      className={className}
      style={{ borderRadius: "8px" }}
    >
      <InputGroup>
        <Form.Control
          type="text"
          value={keyword}
          onChange={handleInputChange}
          placeholder={placeholder}
          style={{ borderRadius: "8px" }}
        />
        <Button variant="" type="submit" style={{ backgroundColor: "#f7f7f9" }}>
          <i className="fas fa-search"></i>
        </Button>
      </InputGroup>
    </Form>
  );
};

export default SearchBox;
