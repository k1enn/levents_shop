import React from "react";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";

const Rating = ({
  value,
  text,
  size = "normal",
  justifyEnd = true,
  blackStar = false,
}) => {
  const starSize = size === "small" ? "0.6rem" : "0.75rem";
  const starColor = blackStar ? "#000000" : "#f8e825"; // black if blackStar is true, otherwise yellow
  const alignmentClass = justifyEnd ? "justify-content-end" : "";

  return (
    <div className={`rating d-flex align-items-center ${alignmentClass}`}>
      <span className="stars" style={{ fontSize: starSize }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} style={{ color: starColor }}>
            {value >= star ? (
              <FaStar />
            ) : value >= star - 0.5 ? (
              <FaStarHalfAlt />
            ) : (
              <FaRegStar />
            )}
          </span>
        ))}
      </span>
      {text && (
        <span className="rating-text small text-muted ms-1">{text}</span>
      )}
    </div>
  );
};

export default Rating;
