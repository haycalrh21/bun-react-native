# Products API with ImageKit Integration

## Overview

This API provides full CRUD operations for UMKM (small business) products with multiple image upload support using ImageKit.io.

## Environment Setup

Add these environment variables to your `.env` file:

```bash
# ImageKit.io Configuration (Get from https://imagekit.io/dashboard)
IMAGEKIT_PUBLIC_KEY="your_public_key_here"
IMAGEKIT_PRIVATE_KEY="your_private_key_here"
IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/your_imagekit_id"
```

## API Endpoints

### 1. Get All Products

**GET** `/api/products`

Returns all products with their images from the database, falls back to dummy data if database is empty.

**Response:**

```json
{
  "success": true,
  "products": [
    {
      "id": "clxxx...",
      "name": "Kopi Arabika Premium",
      "description": "High-quality coffee...",
      "price": 85000,
      "stock": 50,
      "category": "Minuman",
      "images": ["https://ik.imagekit.io/..."],
      "createdAt": "2024-01-15T08:00:00.000Z",
      "updatedAt": "2024-01-15T08:00:00.000Z",
      "createdBy": {
        "id": "user_id",
        "name": "User Name",
        "email": "user@email.com"
      }
    }
  ],
  "total": 5,
  "source": "database"
}
```

### 2. Get Single Product

**GET** `/api/products/:id`

Returns a specific product by ID.

**Response:**

```json
{
  "success": true,
  "product": {
    "id": "clxxx...",
    "name": "Product Name",
    "description": "Product description...",
    "price": 50000,
    "stock": 10,
    "category": "Fashion",
    "images": ["https://ik.imagekit.io/..."],
    "createdAt": "2024-01-15T08:00:00.000Z",
    "updatedAt": "2024-01-15T08:00:00.000Z",
    "createdBy": { ... }
  },
  "source": "database"
}
```

### 3. Get Categories

**GET** `/api/products/categories`

Returns all unique product categories.

**Response:**

```json
{
  "success": true,
  "categories": ["Minuman", "Fashion", "Makanan", "Aksesoris"],
  "source": "database"
}
```

### 4. Create Product (JSON) - MAIN ENDPOINT

**POST** `/api/products/create-new-product`

Creates a new product with multiple image uploads. **Requires authentication.**

**Request Body:**

```json
{
  "name": "Product Name",
  "description": "Product description",
  "price": 50000,
  "stock": 10,
  "category": "Fashion",
  "images": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...", // Base64 data URL
    "https://example.com/image.jpg" // HTTP URL (will be re-uploaded to ImageKit)
  ]
}
```

**Supported Image Formats:**

- ✅ Base64 data URLs (`data:image/jpeg;base64,...`)
- ✅ HTTP/HTTPS URLs (downloaded and re-uploaded)
- ❌ File URIs (`file://...`) - Use multipart endpoint instead

**Response:**

```json
{
  "success": true,
  "message": "Product created successfully",
  "product": { ... },
  "uploadedImages": 2,
  "skippedImages": 0
}
```

### 5. Create Product (Multipart) - FOR MOBILE

**POST** `/api/products/upload-multipart`

Creates a product with file uploads via multipart/form-data. **Requires authentication.**

**Form Data:**

- `name`: Product name (required)
- `description`: Product description (required)
- `price`: Product price (required)
- `stock`: Stock quantity (optional)
- `category`: Product category (optional)
- `images`: Multiple image files (required, at least 1)

**Example using FormData:**

```javascript
const formData = new FormData();
formData.append("name", "Test Product");
formData.append("description", "Test description");
formData.append("price", "50000");
formData.append("stock", "10");
formData.append("category", "Fashion");
formData.append("images", file1);
formData.append("images", file2);

fetch("/api/products/upload-multipart", {
  method: "POST",
  body: formData,
  headers: {
    Authorization: "Bearer your_token",
  },
});
```

### 6. Test Endpoint

**GET** `/api/products/test`

Returns API status and available endpoints.

## Frontend Integration

### For React Native/Expo:

```javascript
// Using JSON endpoint with base64 images
const createProduct = async (productData) => {
  const response = await fetch(`${API_URL}/api/products/create-new-product`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: JSON.stringify({
      name: productData.name,
      description: productData.description,
      price: productData.price,
      stock: productData.stock,
      category: productData.category,
      images: productData.images, // Array of base64 data URLs
    }),
  });

  return await response.json();
};

// Using multipart endpoint with files
const createProductWithFiles = async (productData, imageFiles) => {
  const formData = new FormData();
  formData.append("name", productData.name);
  formData.append("description", productData.description);
  formData.append("price", productData.price.toString());
  formData.append("stock", productData.stock.toString());
  formData.append("category", productData.category);

  imageFiles.forEach((file) => {
    formData.append("images", file);
  });

  const response = await fetch(`${API_URL}/api/products/upload-multipart`, {
    method: "POST",
    body: formData,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  return await response.json();
};
```

## Database Schema

### Product Model

```prisma
model Product {
  id          String         @id @default(cuid())
  name        String
  description String
  price       Float
  stock       Int            @default(0)
  category    String?
  images      ProductImage[]
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  createdBy   String?
  user        User?          @relation(fields: [createdBy], references: [id])
}
```

### ProductImage Model

```prisma
model ProductImage {
  id        String   @id @default(cuid())
  url       String   // ImageKit.io URL
  fileId    String   // ImageKit.io file ID
  fileName  String   // Original file name
  alt       String?  // Alt text
  order     Int      @default(0) // Image order (0 = primary)
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (in development)"
}
```

Common HTTP status codes:

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (authentication required)
- `404`: Not Found
- `500`: Internal Server Error

## Authentication

Most endpoints require authentication via Better Auth. Include the session cookie or authorization header in your requests.

## Image Management

- Images are automatically uploaded to ImageKit.io
- Multiple formats supported (JPEG, PNG, WebP, etc.)
- Images are organized in the `/products` folder
- Unique filenames are generated automatically
- Failed image uploads don't prevent product creation (logs warnings)

## Migration Commands

```bash
# Generate Prisma client
bun prisma generate

# Create and apply migration
bun prisma migrate dev --name add-products

# Reset database (development only)
bun prisma migrate reset --force
```

## Installation

```bash
# Install ImageKit SDK
bun add imagekit

# Update TypeScript config for proper imports
# (Already done in tsconfig.json)
```
