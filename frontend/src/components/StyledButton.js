import React from "react";
import styled from "styled-components";

const getSizeStyles = (size) => {
  switch (size) {
    case "small":
      return `
        padding: 7.2px 14.4px;
        font-size: 10.8px;
        min-width: 108px;
        border-radius: 7.2px;
      `;
    case "large":
      return `
        padding: 18px 36px;
        font-size: 16.2px;
        min-width: 216px;
        border-radius: 14.4px;
      `;
    case "medium":
    default:
      return `
        padding: 11.7px 23.4px;
        font-size: 11.7px;
        min-width: 144px;
        border-radius: 9px;
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
  variant, // Extract variant to prevent it from being passed to DOM
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
