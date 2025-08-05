import React from "react";
import { Pagination } from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";

const Paginate = ({
  pages,
  page,
  isAdmin = false,
  keyword = "",
  isProductsPage = false,
}) => {
  const buildPageUrl = (pageNum) => {
    if (isAdmin) {
      return `/admin/productlist/${pageNum}`;
    }

    if (isProductsPage) {
      const currentParams = new URLSearchParams(window.location.search);
      currentParams.set("page", pageNum);
      return `/products?${currentParams.toString()}`;
    }

    // Legacy behavior for search routes
    return keyword ? `/search/${keyword}/page/${pageNum}` : `/page/${pageNum}`;
  };

  return (
    pages > 1 && (
      <Pagination>
        {[...Array(pages).keys()].map((x) => (
          <LinkContainer key={x + 1} to={buildPageUrl(x + 1)}>
            <Pagination.Item active={x + 1 === page}>{x + 1}</Pagination.Item>
          </LinkContainer>
        ))}
      </Pagination>
    )
  );
};

export default Paginate;
