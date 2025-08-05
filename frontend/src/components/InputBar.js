import React from "react";
import { Form } from "react-bootstrap";

const InputBar = ({
  legend,
  placeholder,
  value,
  onChange,
  type = "text",
  width = "100%",
  height = "40px",
  backgroundColor = "#D9D9D9",
  borderRadius = "8px",
  border = "1px solid #ccc",
  fontSize = "14px",
  padding = "8px 12px",
  disabled = false,
  required = false,
  name,
  id,
  className = "",
  style = {},
  ...props
}) => {
  const inputStyle = {
    width,
    height,
    backgroundColor,
    borderRadius,
    border,
    fontSize,
    padding,
    outline: "none",
    transition: "all 0.3s ease",
    ...Object.fromEntries(
      Object.entries(style).filter(([key]) => key !== "marginBottom")
    ),
  };

  const containerStyle = {
    marginBottom:
      style.marginBottom !== undefined ? style.marginBottom : "1rem",
  };

  const legendStyle = {
    marginBottom: "0.5rem",
    fontSize: "14px",
    fontWeight: "500",
    color: "#333",
  };

  return (
    <div style={containerStyle} className={className}>
      {legend && (
        <Form.Label style={legendStyle}>
          {legend}
          {required && (
            <span style={{ color: "red", marginLeft: "2px" }}>*</span>
          )}
        </Form.Label>
      )}
      <Form.Control
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        name={name}
        id={id}
        style={inputStyle}
        onFocus={(e) => {
          e.target.style.borderColor = "#007bff";
          e.target.style.boxShadow = "0 0 0 0.2rem rgba(0, 123, 255, 0.25)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#ccc";
          e.target.style.boxShadow = "none";
        }}
        {...props}
      />
    </div>
  );
};

export default InputBar;
