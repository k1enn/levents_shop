/*
PRODUCT STRUCTURE
- Name: string
- Image: string
- Description: string
- Category: string
- Price: int
- Rating: int
- CIS: int
- isActive: bool
- COLOR STRUCTURE
  - colorName: string
  - isAvailable: bool
- SIZE STRUCTURE
  - sizeName: string
  - isAvailable: bool
- SALE STRUCTURE 
    - isOnSale: bool
    - saleType: string
    - saleValue: int
    - saleStartDate: Date
    - saleEndDate: Date
 */
const products = [
  {
    name: "Classic White Cotton T-Shirt",
    image: "/images/image_8.png",
    description:
      "Premium cotton basic tee with a comfortable fit. Perfect for everyday wear with breathable fabric and durable stitching.",
    category: "female",
    price: 29.99,
    rating: 5,
    countInStock: 50,
    isActive: true,
    colors: [
      { colorName: "blue", isAvailable: true },
      { colorName: "black", isAvailable: true },
      { colorName: "pink", isAvailable: true },
    ],
    sizes: [
      { sizeName: "M", isAvailable: true },
      { sizeName: "L", isAvailable: true },
      { sizeName: "XL", isAvailable: true },
    ],
    // ON SALE - 25% off
    sale: {
      isOnSale: true,
      saleType: "percentage",
      saleValue: 25,
      saleStartDate: new Date("2025-07-30"),
      saleEndDate: new Date("2026-01-30"),
    },
  },
  {
    name: "Slim Fit Denim Jeans",
    image: "/images/image_9.png",
    description:
      "Modern slim fit jeans in dark wash denim. Features stretch fabric for comfort and versatile styling options.",
    category: "female",
    price: 79.99,
    rating: 5,
    countInStock: 35,
    isActive: true,
    colors: [
      { colorName: "blue", isAvailable: true },
      { colorName: "black", isAvailable: true },
      { colorName: "pink", isAvailable: false },
    ],
    sizes: [
      { sizeName: "M", isAvailable: true },
      { sizeName: "L", isAvailable: true },
      { sizeName: "XL", isAvailable: false },
    ],
    sale: {
      isOnSale: false,
      saleType: "fixed",
      saleValue: 50,
      saleStartDate: new Date("2025-07-30"),
      saleEndDate: new Date("2026-01-30"),
    },
  },
  {
    name: "Floral Summer Dress",
    image: "/images/image_10.png",
    description:
      "Light and airy summer dress with floral print. Features a flattering A-line cut and comfortable cotton blend fabric.",
    category: "female",
    price: 89.99,
    rating: 5,
    countInStock: 25,
    isActive: true,
    colors: [
      { colorName: "blue", isAvailable: false },
      { colorName: "black", isAvailable: true },
      { colorName: "pink", isAvailable: true },
    ],
    sizes: [
      { sizeName: "M", isAvailable: true },
      { sizeName: "L", isAvailable: true },
      { sizeName: "XL", isAvailable: true },
    ],
    sale: {
      isOnSale: false,
      saleType: "fixed",
      saleValue: 50,
      saleStartDate: new Date("2025-07-30"),
      saleEndDate: new Date("2026-01-30"),
    },
  },
  {
    name: "Wool Blend Winter Coat",
    image: "/images/image_11.png",
    description:
      "Elegant winter coat with wool blend fabric. Features double-breasted buttons and a warm inner lining.",
    category: "jacket",
    price: 199.99,
    rating: 5,
    countInStock: 15,
    isActive: true,
    colors: [
      { colorName: "blue", isAvailable: false },
      { colorName: "black", isAvailable: true },
      { colorName: "pink", isAvailable: false },
    ],
    sizes: [
      { sizeName: "M", isAvailable: true },
      { sizeName: "L", isAvailable: true },
      { sizeName: "XL", isAvailable: false },
    ],
    // ON SALE - $50 off
    sale: {
      isOnSale: true,
      saleType: "fixed",
      saleValue: 50,
      saleStartDate: new Date("2025-07-30"),
      saleEndDate: new Date("2026-01-30"),
    },
  },
  {
    name: "Athletic Performance Hoodie",
    image: "/images/image_12.png",
    description:
      "Moisture-wicking athletic hoodie perfect for workouts or casual wear. Features zippered pockets and thumb holes.",
    category: "female",
    price: 69.99,
    rating: 5,
    countInStock: 40,
    isActive: true,
    colors: [
      { colorName: "blue", isAvailable: true },
      { colorName: "black", isAvailable: true },
      { colorName: "pink", isAvailable: true },
    ],
    sizes: [
      { sizeName: "M", isAvailable: true },
      { sizeName: "L", isAvailable: true },
      { sizeName: "XL", isAvailable: true },
    ],
    sale: {
      isOnSale: false,
      saleType: "fixed",
      saleValue: 50,
      saleStartDate: new Date("2025-07-30"),
      saleEndDate: new Date("2026-01-30"),
    },
  },
  {
    name: "Silk Evening Blouse",
    image: "/images/image_13.png",
    description:
      "Elegant silk blouse with delicate detailing. Perfect for formal occasions or office wear.",
    category: "female",
    price: 119.99,
    rating: 5,
    countInStock: 20,
    isActive: true,
    colors: [
      { colorName: "blue", isAvailable: true },
      { colorName: "black", isAvailable: true },
      { colorName: "pink", isAvailable: false },
    ],
    sizes: [
      { sizeName: "M", isAvailable: true },
      { sizeName: "L", isAvailable: false },
      { sizeName: "XL", isAvailable: true },
    ],
    sale: {
      isOnSale: false,
      saleType: "fixed",
      saleValue: 50,
      saleStartDate: new Date("2025-07-30"),
      saleEndDate: new Date("2026-01-30"),
    },
  },
  {
    name: "Casual Linen Shorts",
    image: "/images/image_14.png",
    description:
      "Comfortable linen shorts perfect for summer. Features multiple pockets and an elastic waistband.",
    category: "female",
    price: 49.99,
    rating: 5,
    countInStock: 30,
    isActive: true,
    colors: [
      { colorName: "blue", isAvailable: true },
      { colorName: "black", isAvailable: false },
      { colorName: "pink", isAvailable: true },
    ],
    sizes: [
      { sizeName: "M", isAvailable: true },
      { sizeName: "L", isAvailable: true },
      { sizeName: "XL", isAvailable: true },
    ],
    sale: {
      isOnSale: false,
      saleType: "fixed",
      saleValue: 50,
      saleStartDate: new Date("2025-07-30"),
      saleEndDate: new Date("2026-01-30"),
    },
  },
  {
    name: "Women's High-Waisted Yoga Leggings",
    image: "/images/female_1.png",
    description:
      "Ultra-soft yoga leggings with high waistband and moisture-wicking technology. Perfect for workouts or casual wear.",
    category: "female",
    price: 54.99,
    rating: 4,
    countInStock: 45,
    isActive: true,
    colors: [
      { colorName: "blue", isAvailable: true },
      { colorName: "black", isAvailable: true },
      { colorName: "pink", isAvailable: true },
    ],
    sizes: [
      { sizeName: "M", isAvailable: true },
      { sizeName: "L", isAvailable: true },
      { sizeName: "XL", isAvailable: false },
    ],
    // ON SALE - 30% off
    sale: {
      isOnSale: true,
      saleType: "percentage",
      saleValue: 30,
      saleStartDate: new Date("2025-07-30"),
      saleEndDate: new Date("2026-01-30"),
    },
  },
  {
    name: "Leather Brown Belt",
    image: "/images/acc_1.jpg",
    description:
      "Genuine leather belt with classic buckle design. Adjustable and perfect for both casual and formal occasions.",
    category: "accessory",
    price: 39.99,
    rating: 4,
    countInStock: 60,
    isActive: true,
    colors: [
      { colorName: "blue", isAvailable: false },
      { colorName: "black", isAvailable: true },
      { colorName: "pink", isAvailable: false },
    ],
    sizes: [
      { sizeName: "M", isAvailable: true },
      { sizeName: "L", isAvailable: true },
      { sizeName: "XL", isAvailable: true },
    ],
    sale: {
      isOnSale: false,
      saleType: "fixed",
      saleValue: 50,
      saleStartDate: new Date("2025-07-30"),
      saleEndDate: new Date("2026-01-30"),
    },
  },
  {
    name: "Vintage Denim Jacket",
    image: "/images/jacket_1.png",
    description:
      "Classic vintage-style denim jacket with distressed details. Perfect layering piece for any season.",
    category: "jacket",
    price: 89.99,
    rating: 5,
    countInStock: 22,
    isActive: true,
    colors: [
      { colorName: "blue", isAvailable: true },
      { colorName: "black", isAvailable: true },
      { colorName: "pink", isAvailable: false },
    ],
    sizes: [
      { sizeName: "M", isAvailable: false },
      { sizeName: "L", isAvailable: true },
      { sizeName: "XL", isAvailable: true },
    ],
    sale: {
      isOnSale: false,
      saleType: "fixed",
      saleValue: 50,
      saleStartDate: new Date("2025-07-30"),
      saleEndDate: new Date("2026-01-30"),
    },
  },
  {
    name: "Women's Silk Scarf",
    image: "/images/acc_2.jpg",
    description:
      "Luxurious silk scarf with floral pattern. Versatile accessory that can be worn multiple ways.",
    category: "accessory",
    price: 34.99,
    rating: 4,
    countInStock: 35,
    isActive: true,
    colors: [
      { colorName: "blue", isAvailable: true },
      { colorName: "black", isAvailable: false },
      { colorName: "pink", isAvailable: true },
    ],
    sizes: [
      { sizeName: "M", isAvailable: true },
      { sizeName: "L", isAvailable: true },
      { sizeName: "XL", isAvailable: true },
    ],
    sale: {
      isOnSale: false,
      saleType: "fixed",
      saleValue: 50,
      saleStartDate: new Date("2025-07-30"),
      saleEndDate: new Date("2026-01-30"),
    },
  },
  {
    name: "Men's Business Dress Shirt",
    image: "/images/male_2.jpg",
    description:
      "Professional dress shirt made from wrinkle-resistant fabric. Features spread collar and French cuffs.",
    category: "male",
    price: 65.99,
    rating: 5,
    countInStock: 28,
    isActive: true,
    colors: [
      { colorName: "blue", isAvailable: true },
      { colorName: "black", isAvailable: true },
      { colorName: "pink", isAvailable: false },
    ],
    sizes: [
      { sizeName: "M", isAvailable: true },
      { sizeName: "L", isAvailable: true },
      { sizeName: "XL", isAvailable: true },
    ],
    // ON SALE - 20% off
    sale: {
      isOnSale: true,
      saleType: "percentage",
      saleValue: 20,
      saleStartDate: new Date("2025-07-30"),
      saleEndDate: new Date("2026-01-30"),
    },
  },
  {
    name: "Women's Midi Pencil Skirt",
    image: "/images/female_2.png",
    description:
      "Elegant pencil skirt in stretchy fabric. Perfect for office wear with a flattering high-waisted design.",
    category: "female",
    price: 45.99,
    rating: 4,
    countInStock: 32,
    isActive: true,
    colors: [
      { colorName: "blue", isAvailable: false },
      { colorName: "black", isAvailable: true },
      { colorName: "pink", isAvailable: true },
    ],
    sizes: [
      { sizeName: "M", isAvailable: true },
      { sizeName: "L", isAvailable: true },
      { sizeName: "XL", isAvailable: false },
    ],
    sale: {
      isOnSale: false,
      saleType: "fixed",
      saleValue: 50,
      saleStartDate: new Date("2025-07-30"),
      saleEndDate: new Date("2026-01-30"),
    },
  },
  {
    name: "Unisex Baseball Cap",
    image: "/images/acc_3.jpg",
    description:
      "Classic baseball cap with adjustable strap. Made from durable cotton with embroidered logo.",
    category: "accessory",
    price: 24.99,
    rating: 4,
    countInStock: 55,
    isActive: true,
    colors: [
      { colorName: "blue", isAvailable: true },
      { colorName: "black", isAvailable: true },
      { colorName: "pink", isAvailable: true },
    ],
    sizes: [
      { sizeName: "M", isAvailable: true },
      { sizeName: "L", isAvailable: true },
      { sizeName: "XL", isAvailable: true },
    ],
    sale: {
      isOnSale: false,
      saleType: "fixed",
      saleValue: 50,
      saleStartDate: new Date("2025-07-30"),
      saleEndDate: new Date("2026-01-30"),
    },
  },
  {
    name: "Men's Polo Shirt",
    image: "/images/male_3.jpg",
    description:
      "Premium cotton polo shirt with ribbed collar and cuffs. Available in multiple colors for versatile styling.",
    category: "male",
    price: 42.99,
    rating: 5,
    countInStock: 40,
    isActive: true,
    colors: [
      { colorName: "blue", isAvailable: true },
      { colorName: "black", isAvailable: true },
      { colorName: "pink", isAvailable: false },
    ],
    sizes: [
      { sizeName: "M", isAvailable: true },
      { sizeName: "L", isAvailable: false },
      { sizeName: "XL", isAvailable: true },
    ],
    sale: {
      isOnSale: false,
      saleType: "fixed",
      saleValue: 50,
      saleStartDate: new Date("2025-07-30"),
      saleEndDate: new Date("2026-01-30"),
    },
  },
  {
    name: "Women's Cardigan Sweater",
    image: "/images/female_3.png",
    description:
      "Soft knit cardigan with button closure. Perfect for layering in cooler weather with a comfortable fit.",
    category: "female",
    price: 59.99,
    rating: 4,
    countInStock: 25,
    isActive: true,
    colors: [
      { colorName: "blue", isAvailable: true },
      { colorName: "black", isAvailable: false },
      { colorName: "pink", isAvailable: true },
    ],
    sizes: [
      { sizeName: "M", isAvailable: true },
      { sizeName: "L", isAvailable: true },
      { sizeName: "XL", isAvailable: true },
    ],
    sale: {
      isOnSale: false,
      saleType: "fixed",
      saleValue: 50,
      saleStartDate: new Date("2025-07-30"),
      saleEndDate: new Date("2026-01-30"),
    },
  },
  {
    name: "Bomber Jacket",
    image: "/images/jacket_2.jpg",
    description:
      "Modern bomber jacket with ribbed cuffs and hem. Lightweight yet warm with a sleek urban design.",
    category: "jacket",
    price: 95.99,
    rating: 5,
    countInStock: 18,
    isActive: true,
    colors: [
      { colorName: "blue", isAvailable: true },
      { colorName: "black", isAvailable: true },
      { colorName: "pink", isAvailable: false },
    ],
    sizes: [
      { sizeName: "M", isAvailable: false },
      { sizeName: "L", isAvailable: true },
      { sizeName: "XL", isAvailable: true },
    ],
    sale: {
      isOnSale: true,
      saleType: "fixed",
      saleValue: 25,
      saleStartDate: new Date("2025-07-30"),
      saleEndDate: new Date("2026-01-30"),
    },
  },
  {
    name: "Women's Ankle Boots",
    image: "/images/female_4.png",
    description:
      "Stylish ankle boots with block heel. Made from premium materials with comfortable cushioned insole.",
    category: "female",
    price: 79.99,
    rating: 4,
    countInStock: 30,
    isActive: true,
    colors: [
      { colorName: "blue", isAvailable: false },
      { colorName: "black", isAvailable: true },
      { colorName: "pink", isAvailable: false },
    ],
    sizes: [
      { sizeName: "M", isAvailable: true },
      { sizeName: "L", isAvailable: true },
      { sizeName: "XL", isAvailable: true },
    ],
    sale: {
      isOnSale: false,
      saleType: "fixed",
      saleValue: 50,
      saleStartDate: new Date("2025-07-30"),
      saleEndDate: new Date("2026-01-30"),
    },
  },
  {
    name: "Men's Chino Pants",
    image: "/images/male_4.jpg",
    description:
      "Versatile chino pants in classic fit. Made from cotton twill with clean tailoring for smart-casual looks.",
    category: "male",
    price: 55.99,
    rating: 4,
    countInStock: 35,
    isActive: true,
    colors: [
      { colorName: "blue", isAvailable: true },
      { colorName: "black", isAvailable: true },
      { colorName: "pink", isAvailable: false },
    ],
    sizes: [
      { sizeName: "M", isAvailable: true },
      { sizeName: "L", isAvailable: true },
      { sizeName: "XL", isAvailable: false },
    ],
    sale: {
      isOnSale: false,
      saleType: "fixed",
      saleValue: 50,
      saleStartDate: new Date("2025-07-30"),
      saleEndDate: new Date("2026-01-30"),
    },
  },
  {
    name: "Men's Crew Neck Sweater",
    image: "/images/male_6.jpg",
    description:
      "Warm crew neck sweater in merino wool blend. Classic fit with ribbed trim for a timeless look.",
    category: "male",
    price: 85.99,
    rating: 5,
    countInStock: 22,
    isActive: true,
    colors: [
      { colorName: "blue", isAvailable: true },
      { colorName: "black", isAvailable: true },
      { colorName: "pink", isAvailable: false },
    ],
    sizes: [
      { sizeName: "M", isAvailable: true },
      { sizeName: "L", isAvailable: false },
      { sizeName: "XL", isAvailable: true },
    ],
    sale: {
      isOnSale: false,
      saleType: "fixed",
      saleValue: 50,
      saleStartDate: new Date("2025-07-30"),
      saleEndDate: new Date("2026-01-30"),
    },
  },
  {
    name: "Women's Wrap Dress",
    image: "/images/female_4.png",
    description:
      "Flattering wrap dress in jersey fabric. Features three-quarter sleeves and a tie waist for an elegant silhouette.",
    category: "female",
    price: 74.99,
    rating: 4,
    countInStock: 28,
    isActive: true,
    colors: [
      { colorName: "blue", isAvailable: true },
      { colorName: "black", isAvailable: false },
      { colorName: "pink", isAvailable: true },
    ],
    sizes: [
      { sizeName: "M", isAvailable: true },
      { sizeName: "L", isAvailable: true },
      { sizeName: "XL", isAvailable: true },
    ],
    sale: {
      isOnSale: false,
      saleType: "fixed",
      saleValue: 50,
      saleStartDate: new Date("2025-07-30"),
      saleEndDate: new Date("2026-01-30"),
    },
  },
  {
    name: "Men's Graphic Print T-Shirt",
    image: "/images/male_7.jpg",
    description:
      "Trendy graphic print t-shirt made from soft cotton blend. Features unique artwork and comfortable regular fit.",
    category: "male",
    price: 35.99,
    rating: 4,
    countInStock: 42,
    isActive: true,
    colors: [
      { colorName: "blue", isAvailable: true },
      { colorName: "black", isAvailable: true },
      { colorName: "pink", isAvailable: true },
    ],
    sizes: [
      { sizeName: "M", isAvailable: true },
      { sizeName: "L", isAvailable: true },
      { sizeName: "XL", isAvailable: false },
    ],
    sale: {
      isOnSale: false,
      saleType: "fixed",
      saleValue: 50,
      saleStartDate: new Date("2025-07-30"),
      saleEndDate: new Date("2026-01-30"),
    },
  },
  {
    name: "Men's Dark Wash Jeans",
    image: "/images/male_8.jpg",
    description:
      "Classic straight-leg jeans in premium denim. Features five-pocket design and reinforced stitching for durability.",
    category: "male",
    price: 72.99,
    rating: 5,
    countInStock: 38,
    isActive: true,
    colors: [
      { colorName: "blue", isAvailable: true },
      { colorName: "black", isAvailable: true },
      { colorName: "pink", isAvailable: false },
    ],
    sizes: [
      { sizeName: "M", isAvailable: true },
      { sizeName: "L", isAvailable: true },
      { sizeName: "XL", isAvailable: true },
    ],
    sale: {
      isOnSale: false,
      saleType: "fixed",
      saleValue: 50,
      saleStartDate: new Date("2025-07-30"),
      saleEndDate: new Date("2026-01-30"),
    },
  },
];

export default products;
