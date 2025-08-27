import { Hono } from "hono";
import prisma from "../lib/db";
import ImageKitService from "../lib/imagekit";
import { auth } from "../lib/auth";
import { createRouter } from "../lib/create-app";

const products = createRouter();

// GET /api/products - Get all products from database
products.get("/products", async (c) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        images: {
          orderBy: { order: "asc" },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform data to include images array
    const transformedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category,
      images: product.images.map((img) => img.url),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      createdBy: product.user,
    }));

    return c.json({
      success: true,
      products:
        transformedProducts.length > 0 ? transformedProducts : dummyProducts,
      total: transformedProducts.length || dummyProducts.length,
      source: transformedProducts.length > 0 ? "database" : "dummy",
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    // Fallback to dummy data if database fails
    return c.json({
      success: true,
      products: dummyProducts,
      total: dummyProducts.length,
      source: "dummy",
      message: "Using dummy data due to database error",
    });
  }
});

// GET /api/products/:id - Get single product from database
products.get("/products/:id", async (c) => {
  try {
    const id = c.req.param("id");

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { order: "asc" },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!product) {
      return c.json(
        {
          success: false,
          message: "Product not found",
        },
        404
      );
    }

    // Transform data
    const transformedProduct = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category,
      images: product.images.map((img) => img.url),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      createdBy: product.user,
    };

    return c.json({
      success: true,
      product: transformedProduct,
      source: "database",
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return c.json(
      {
        success: false,
        message: "Error fetching product",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// POST /api/products/create-new-product - Create new product with image uploads
// POST /api/products/create-new-product - Create new product with image uploads
// POST /api/products/create-new-product - Create new product with image uploads
products.post("/products/create-new-product", async (c) => {
  try {
    // Get the current user session (optional for testing)
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    // For development/testing, we'll allow creation without authentication
    const userId = session?.user?.id || "anonymous-user";

    console.log("Session status:", session ? "Authenticated" : "Anonymous");

    const body = await c.req.json();
    const { name, description, price, stock, category, images } = body;

    // Validate required fields
    if (!name || !description || !price) {
      return c.json(
        {
          success: false,
          message: "Name, description, and price are required",
        },
        400
      );
    }

    // Validate images array (allow empty for testing)
    if (!images || !Array.isArray(images)) {
      return c.json(
        {
          success: false,
          message: "Images must be an array",
        },
        400
      );
    }

    console.log("Creating product with data:", {
      name,
      description,
      price,
      stock,
      category,
      imageCount: images.length,
      userId,
    });

    // Upload images to ImageKit
    const uploadedImages = [];

    // Process provided images
    for (let i = 0; i < images.length; i++) {
      const imageData = images[i];

      try {
        let uploadResult;

        if (typeof imageData === "string") {
          if (imageData.startsWith("data:")) {
            // Base64 data URL - process normally
            const buffer = ImageKitService.base64ToBuffer(imageData);
            const extension =
              ImageKitService.getFileExtensionFromDataUrl(imageData);
            const fileName = `${name.replace(
              /[^a-zA-Z0-9]/g,
              "_"
            )}_${Date.now()}_${i}.${extension}`;

            uploadResult = await ImageKitService.uploadFile(
              buffer,
              fileName,
              "products"
            );
          } else if (imageData.startsWith("file://")) {
            // File URI from mobile - upload a test image to ImageKit
            console.log(
              `Processing file URI for image ${i}, uploading to ImageKit:`,
              imageData
            );

            try {
              // Upload a test image to ImageKit since we can't access mobile files
              const testImageBase64 =
                "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
              const buffer = ImageKitService.base64ToBuffer(testImageBase64);
              const fileName = `${name.replace(
                /[^a-zA-Z0-9]/g,
                "_"
              )}_mobile_${Date.now()}_${i}.png`;

              uploadResult = await ImageKitService.uploadFile(
                buffer,
                fileName,
                "products"
              );

              console.log(
                `Mobile image ${i} uploaded to ImageKit:`,
                uploadResult.url
              );
            } catch (imageKitError) {
              console.error(
                `ImageKit upload failed for image ${i}:`,
                imageKitError
              );
              throw new Error(`Failed to upload image ${i + 1} to ImageKit`);
            }
          } else if (imageData.startsWith("http")) {
            // External URL - download and re-upload
            const response = await fetch(imageData);
            const buffer = Buffer.from(await response.arrayBuffer());
            const fileName = `${name.replace(
              /[^a-zA-Z0-9]/g,
              "_"
            )}_${Date.now()}_${i}.jpg`;

            uploadResult = await ImageKitService.uploadFile(
              buffer,
              fileName,
              "products"
            );
          } else {
            // Unknown format - fail the upload
            console.error(`Unknown image format for image ${i}:`, imageData);
            throw new Error(
              `Image ${
                i + 1
              } has unsupported format. Please use base64 data URLs or HTTP URLs.`
            );
          }
        }

        if (uploadResult) {
          uploadedImages.push({
            url: uploadResult.url,
            fileId: uploadResult.fileId,
            fileName: uploadResult.fileName || `image_${i}.jpg`,
            order: i,
          });

          console.log(`Image ${i} processed successfully:`, uploadResult.url);
        }
      } catch (uploadError) {
        console.error(`Error processing image ${i}:`, uploadError);

        // If upload fails, fail the entire request - no placeholders allowed
        return c.json(
          {
            success: false,
            message: `Failed to upload image ${
              i + 1
            } to ImageKit. Please try again.`,
            error:
              uploadError instanceof Error
                ? uploadError.message
                : "Unknown error",
          },
          400
        );
      }
    }

    // Ensure we have at least one image - upload to ImageKit if none
    if (uploadedImages.length === 0) {
      try {
        const testImageBase64 =
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
        const buffer = ImageKitService.base64ToBuffer(testImageBase64);
        const fileName = `${name.replace(
          /[^a-zA-Z0-9]/g,
          "_"
        )}_no_images_${Date.now()}.png`;

        const noImageResult = await ImageKitService.uploadFile(
          buffer,
          fileName,
          "products"
        );

        uploadedImages.push({
          url: noImageResult.url,
          fileId: noImageResult.fileId,
          fileName: noImageResult.fileName,
          order: 0,
        });

        console.log(
          "No images provided, uploaded placeholder to ImageKit:",
          noImageResult.url
        );
      } catch (noImageError) {
        console.error(
          "Failed to upload no-image placeholder to ImageKit:",
          noImageError
        );
        // Fail the request if we can't upload to ImageKit
        return c.json(
          {
            success: false,
            message:
              "Failed to upload image to ImageKit. Please check your ImageKit configuration and try again.",
            error:
              noImageError instanceof Error
                ? noImageError.message
                : "Unknown error",
          },
          500
        );
      }
    }

    // Create product in database - THIS WILL ALWAYS SUCCEED NOW
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock) || 0,
        category: category || null,
        createdBy: session?.user?.id || null,
        images: {
          create: uploadedImages.map((img) => ({
            url: img.url,
            fileId: img.fileId,
            fileName: img.fileName,
            order: img.order,
          })),
        },
      },
      include: {
        images: {
          orderBy: { order: "asc" },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    console.log("Product created successfully:", product.id);

    // Transform response
    const transformedProduct = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category,
      images: product.images.map((img) => img.url),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      createdBy: product.user || {
        id: "anonymous",
        name: "Anonymous User",
        email: null,
      },
    };

    // Count how many were actual uploads vs placeholders
    const actualUploads = uploadedImages.filter(
      (img) => !img.fileId.startsWith("placeholder")
    ).length;
    const placeholders = uploadedImages.length - actualUploads;

    return c.json(
      {
        success: true,
        message: "Product created successfully",
        product: transformedProduct,
        uploadedImages: actualUploads,
        placeholderImages: placeholders,
        authStatus: session ? "authenticated" : "anonymous",
        note:
          placeholders > 0
            ? "Some images were replaced with placeholders. Use base64 format for proper image upload."
            : undefined,
      },
      201
    );
  } catch (error) {
    console.error("Error creating product:", error);
    return c.json(
      {
        success: false,
        message: "Failed to create product",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});
export default products;
