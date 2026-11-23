// Seed the DynamoDB table: products, 2 coupons, 1 admin (Cognito user + DynamoDB profile). Seed images are uploaded by Terraform.
// Local:     node --env-file=.env scripts/seed.mjs
// Terraform: infra/app/seed.tf runs it with TABLE, USER_POOL_ID, AWS_REGION, ADMIN_EMAIL, ADMIN_PASSWORD.
// Idempotent: ids come from a hash (slug) or the Cognito sub, so a rerun overwrites instead of duplicating.
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { BatchWriteCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { AdminCreateUserCommand, AdminGetUserCommand, AdminSetUserPasswordCommand, CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import { createHash } from "node:crypto";

const { TABLE, USER_POOL_ID, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (!TABLE?.startsWith("phoneshop") || !USER_POOL_ID || !ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) {
  console.error("Need TABLE (phoneshop*), USER_POOL_ID, ADMIN_EMAIL, ADMIN_PASSWORD (8+ chars)");
  process.exit(1);
}

const id = (s) => createHash("sha256").update(s).digest("hex").slice(0, 32);
const iso = (ms) => new Date(ms).toISOString();

const day = 86400_000;
const now = Date.now();
// [name, brand, ram, chip, screen, battery, os, camera, colors, {storage: price}]
const PHONES = [
  ["iPhone 16 Pro Max", "Apple", 8, "A18 Pro", "6.9 inch OLED 120Hz", 4685, "iOS 18", "48MP + 48MP + 12MP", ["Titan Sa Mạc", "Titan Đen"], { 256: 30990000, 512: 37490000, 1024: 43990000 }],
  ["iPhone 16 Pro", "Apple", 8, "A18 Pro", "6.3 inch OLED 120Hz", 3582, "iOS 18", "48MP + 48MP + 12MP", ["Titan Trắng", "Titan Đen"], { 128: 25990000, 256: 28990000 }],
  ["iPhone 16", "Apple", 8, "A18", "6.1 inch OLED", 3561, "iOS 18", "48MP + 12MP", ["Đen", "Xanh Lưu Ly", "Hồng"], { 128: 19990000, 256: 22990000 }],
  ["iPhone 15", "Apple", 6, "A16 Bionic", "6.1 inch OLED", 3349, "iOS 17", "48MP + 12MP", ["Đen", "Xanh Lá"], { 128: 16990000, 256: 19990000 }],
  ["iPhone 13", "Apple", 4, "A15 Bionic", "6.1 inch OLED", 3240, "iOS 17", "12MP + 12MP", ["Trắng", "Đen"], { 128: 11990000 }],
  ["Samsung Galaxy S25 Ultra", "Samsung", 12, "Snapdragon 8 Elite", "6.9 inch AMOLED 120Hz", 5000, "Android 15", "200MP + 50MP + 50MP + 10MP", ["Titan Đen", "Titan Xám"], { 256: 33990000, 512: 37990000 }],
  ["Samsung Galaxy S25", "Samsung", 12, "Snapdragon 8 Elite", "6.2 inch AMOLED 120Hz", 4000, "Android 15", "50MP + 12MP + 10MP", ["Xanh Navy", "Bạc"], { 256: 22990000 }],
  ["Samsung Galaxy Z Fold6", "Samsung", 12, "Snapdragon 8 Gen 3", "7.6 inch gập", 4400, "Android 14", "50MP + 12MP + 10MP", ["Xám", "Hồng"], { 256: 43990000, 512: 47990000 }],
  ["Samsung Galaxy Z Flip6", "Samsung", 12, "Snapdragon 8 Gen 3", "6.7 inch gập", 4000, "Android 14", "50MP + 12MP", ["Xanh Mint", "Vàng"], { 256: 26990000 }],
  ["Samsung Galaxy A56", "Samsung", 8, "Exynos 1580", "6.7 inch AMOLED", 5000, "Android 15", "50MP + 12MP + 5MP", ["Đen", "Hồng"], { 128: 9990000, 256: 10990000 }],
  ["Xiaomi 15 Ultra", "Xiaomi", 16, "Snapdragon 8 Elite", "6.73 inch AMOLED", 5410, "Android 15", "50MP x4 Leica", ["Đen", "Bạc"], { 512: 32990000 }],
  ["Xiaomi 14T Pro", "Xiaomi", 12, "Dimensity 9300+", "6.67 inch AMOLED 144Hz", 5000, "Android 14", "50MP + 50MP + 12MP", ["Xám", "Xanh"], { 256: 15990000, 512: 17990000 }],
  ["Xiaomi Redmi Note 14 Pro", "Xiaomi", 8, "Dimensity 7300 Ultra", "6.67 inch AMOLED", 5110, "Android 14", "200MP + 8MP + 2MP", ["Đen", "Tím"], { 128: 7490000, 256: 8490000 }],
  ["OPPO Find X8 Pro", "OPPO", 16, "Dimensity 9400", "6.78 inch AMOLED", 5910, "Android 15", "50MP x4 Hasselblad", ["Trắng", "Đen"], { 512: 29990000 }],
  ["OPPO Reno13", "OPPO", 12, "Dimensity 8350", "6.59 inch AMOLED", 5600, "Android 15", "50MP + 8MP + 2MP", ["Xanh", "Tím"], { 256: 11990000 }],
  ["OPPO A3", "OPPO", 6, "Snapdragon 6s Gen 1", "6.67 inch LCD", 5100, "Android 14", "50MP + 2MP", ["Đen", "Tím"], { 128: 4990000 }],
  ["vivo X200 Pro", "vivo", 16, "Dimensity 9400", "6.78 inch AMOLED", 6000, "Android 15", "50MP + 50MP + 200MP Zeiss", ["Xám", "Xanh"], { 512: 27990000 }],
  ["vivo V40", "vivo", 12, "Snapdragon 7 Gen 3", "6.78 inch AMOLED", 5500, "Android 14", "50MP + 50MP", ["Bạc", "Tím"], { 256: 12990000 }],
  ["Google Pixel 9 Pro", "Google", 16, "Tensor G4", "6.3 inch OLED 120Hz", 4700, "Android 15", "50MP + 48MP + 48MP", ["Đen", "Hồng"], { 128: 24990000, 256: 26990000 }],
  ["realme 13 Pro+", "realme", 12, "Snapdragon 7s Gen 2", "6.7 inch AMOLED", 5200, "Android 14", "50MP + 50MP + 8MP", ["Xanh", "Tím"], { 256: 10990000 }],
];

const slugify = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const products = PHONES.map(([name, brand, ram, chip, screen, battery, os, camera, colors, prices], i) => {
  const slug = slugify(name);
  const variants = colors.flatMap((color, ci) =>
    Object.entries(prices).map(([storage, price]) => ({
      sku: `${slug}-${slugify(color)}-${storage}`.toUpperCase(),
      color,
      storage: Number(storage),
      price,
      stock: (i + ci) % 7 === 0 ? 1 : 3 + ((i * 3 + ci) % 10), // a few with stock 1 to test the last unit race
    })),
  );
  // Every 4th phone on flash sale for 3 days.
  const onSale = i % 4 === 0;
  return {
    PK: "PRODUCT",
    SK: id(slug),
    _id: id(slug),
    slug,
    name,
    brand,
    description: `${name} chính hãng VN/A, nguyên seal, bảo hành 12 tháng. Chip ${chip}, màn hình ${screen}, pin ${battery} mAh.`,
    images: [`seed/phones/${slug}.jpg`],
    specs: { screen, chip, ram, battery, os, camera },
    variants,
    minPrice: Math.min(...variants.map((v) => v.price)),
    sale: { isOnSale: onSale, saleType: "percentage", saleValue: onSale ? 10 : 0, saleStartDate: iso(now - day), saleEndDate: iso(now + 3 * day) },
    ratingSum: 0,
    numReviews: 0,
    isActive: true,
    createdAt: iso(now - i * day),
  };
});


const email = ADMIN_EMAIL.toLowerCase();
// Admin in Cognito: verified email (gets the login PIN), permanent password, no invite email.
const idp = new CognitoIdentityProviderClient({});
const Username = email;
try {
  await idp.send(new AdminCreateUserCommand({ UserPoolId: USER_POOL_ID, Username, MessageAction: "SUPPRESS", UserAttributes: [{ Name: "email", Value: email }, { Name: "email_verified", Value: "true" }, { Name: "name", Value: "Admin" }] }));
} catch (e) {
  if (e.name !== "UsernameExistsException") throw e;
}
await idp.send(new AdminSetUserPasswordCommand({ UserPoolId: USER_POOL_ID, Username, Password: ADMIN_PASSWORD, Permanent: true }));
const adminId = (await idp.send(new AdminGetUserCommand({ UserPoolId: USER_POOL_ID, Username }))).UserAttributes.find((a) => a.Name === "sub").Value;
const coupons = [
  { code: "GIAM10", type: "percent", value: 10, minOrder: 5_000_000, maxDiscount: 2_000_000, usageLimit: 100 },
  { code: "MOTLAN", type: "fixed", value: 500_000, minOrder: 0, usageLimit: 1 },
].map((c) => ({ PK: "COUPON", SK: c.code, ...c, used: 0, active: true, startsAt: iso(now - day), endsAt: iso(now + 365 * day) }));
const items = [
  ...products,
  ...coupons,
  { PK: "USER", SK: adminId, _id: adminId, email, name: "Admin", isAdmin: true, createdAt: iso(now) },
];

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
for (let i = 0; i < items.length; i += 25) {
  let req = { [TABLE]: items.slice(i, i + 25).map((Item) => ({ PutRequest: { Item } })) };
  for (let n = 0; req[TABLE]?.length; n++) {
    if (n) await new Promise((r) => setTimeout(r, 200 * n));
    req = (await ddb.send(new BatchWriteCommand({ RequestItems: req }))).UnprocessedItems ?? {};
  }
}
console.log(`Seeded ${products.length} phones, ${coupons.length} coupons, admin ${email} into ${TABLE}`);
