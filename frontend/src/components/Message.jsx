import React from "react";
import { Alert } from "react-bootstrap";

const Message = ({ variant, children }) => {
  // Return whatever children is
  return <Alert variant={variant}>{children}</Alert>;
};

Message.defaultProps = {
  variant: "info", // Set default is blue color
};

export default Message;
