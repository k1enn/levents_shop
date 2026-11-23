import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { cancelCodes, ddb, now, queryPk, TABLE } from "./db.server";
import { REVIEWS_PER_PAGE } from "./shop";
import { allUserOrders } from "./orders.server";
import { PRODUCT } from "./products.server";
import { UserError } from "./errors";

// SK = userId: at most 1 review per user per product.
export type Review = { _id: string; productId: string; userId: string; name: string; rating: number; comment: string; createdAt: string };

export async function listReviews(productId: string, page: number) {
  const all = (await queryPk<Review>(`REVIEW#${productId}`)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return all.slice((page - 1) * REVIEWS_PER_PAGE, page * REVIEWS_PER_PAGE).map(({ _id, name, rating, comment, createdAt }) => ({ _id, name, rating, comment, createdAt }));
}

// Only buyers with a delivered order may review, once per product. Rating sum and count move in the same transaction.
export async function addReview(r: Omit<Review, "_id" | "createdAt">) {
  const bought = (await allUserOrders(r.userId)).some((o) => o.status === "delivered" && o.items.some((i) => i.productId === r.productId));
  if (!bought) throw new UserError("Chỉ khách đã nhận hàng mới được đánh giá.");
  try {
    await ddb.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: TABLE,
              Item: { PK: `REVIEW#${r.productId}`, SK: r.userId, _id: crypto.randomUUID(), ...r, createdAt: now() },
              ConditionExpression: "attribute_not_exists(SK)",
            },
          },
          {
            Update: {
              TableName: TABLE,
              Key: { PK: PRODUCT, SK: r.productId },
              UpdateExpression: "ADD ratingSum :r, numReviews :one",
              ConditionExpression: "attribute_exists(PK)",
              ExpressionAttributeValues: { ":r": r.rating, ":one": 1 },
            },
          },
        ],
      }),
    );
  } catch (e) {
    if (cancelCodes(e)?.[0] === "ConditionalCheckFailed") throw new UserError("Bạn đã đánh giá sản phẩm này.");
    throw e;
  }
}
