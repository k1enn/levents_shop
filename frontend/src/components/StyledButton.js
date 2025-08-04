import React from "react";
import styled from "styled-components";

const getSizeStyles = (size) => {
  switch (size) {
    case "small":
      return `
        padding: 8px 16px;
        font-size: 12px;
        min-width: 120px;
        border-radius: 8px;
      `;
    case "large":
      return `
        padding: 20px 40px;
        font-size: 18px;
        min-width: 240px;
        border-radius: 16px;
      `;
    case "medium":
    default:
      return `
        padding: 13px 26px;
        font-size: 13px;
        min-width: 160px;
        border-radius: 10px;
      `;
  }
};

const StyledButton = styled.button`
  background-color: #000000;
  color: #ffffff;
  border: none;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);

  ${(props) => getSizeStyles(props.size)}

  &:hover {
    background-color: #333333;
    transform: translateY(-1px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.2);
  }

  &:disabled {
    background-color: #666666;
    cursor: not-allowed;
    transform: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const DarkButton = ({
  children,
  onClick,
  disabled,
  className,
  size = "medium",
  ...props
}) => {
  return (
    <StyledButton
      onClick={onClick}
      disabled={disabled}
      className={className}
      size={size}
      {...props}
    >
      {children}
    </StyledButton>
  );
};

export default DarkButton;
