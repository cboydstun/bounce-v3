import Product from "../Product";
import * as dbHandler from "../../lib/test/db-handler";

// Connect to a new in-memory database before running any tests
beforeAll(async () => {
    await dbHandler.connect();

    // Ensure text index is created
    await Product.createIndexes();
});

// Clear all test data after every test
afterEach(async () => await dbHandler.clearDatabase());

// Close database connection after all tests are done
afterAll(async () => await dbHandler.closeDatabase());

describe("Product Model", () => {
    // Test data
    const validProductData = {
        name: "Test Bounce House",
        description: "A test bounce house for kids",
        category: "bounce-house",
        price: { base: 100, currency: "USD" },
        rentalDuration: "full-day" as const,
        availability: "available" as const,
        images: [{ url: "https://example.com/image.jpg" }],
        specifications: [{ name: "Color", value: "Blue" }],
        dimensions: { length: 10, width: 10, height: 8, unit: "feet" },
        capacity: 5,
        ageRange: { min: 3, max: 12 },
        setupRequirements: {
            space: "12x12 ft",
            powerSource: true,
            surfaceType: ["grass", "concrete"],
        },
        features: ["Slide", "Basketball Hoop"],
        safetyGuidelines: "Adult supervision required",
        weatherRestrictions: ["No use in rain or high winds"],
    };

    // Test validation
    it("should validate a valid product", async () => {
        const product = new Product(validProductData);
        const savedProduct = await product.save();

        // Check that the saved product has an ID
        expect(savedProduct._id).toBeDefined();
        expect(savedProduct.name).toBe(validProductData.name);
        expect(savedProduct.slug).toBeDefined();
        expect(savedProduct.description).toBe(validProductData.description);
        expect(savedProduct.category).toBe(validProductData.category);
        expect(savedProduct.price.base).toBe(validProductData.price.base);
        expect(savedProduct.price.currency).toBe(validProductData.price.currency);
    });

    it("should not validate a product without required fields", async () => {
        const invalidProduct = new Product({
            name: "Invalid Product",
            // Missing required fields
        });

        await expect(invalidProduct.save()).rejects.toThrow();
    });

    // Test slug generation
    it("should generate a slug from the name", async () => {
        const product = new Product(validProductData);
        const savedProduct = await product.save();

        expect(savedProduct.slug).toBe("test-bounce-house");
    });

    it("should generate a unique slug when a duplicate exists", async () => {
        // Create first product
        const product1 = new Product(validProductData);
        await product1.save();

        // Create second product with same name
        const product2 = new Product({
            ...validProductData,
            description: "Another bounce house with the same name",
        });
        const savedProduct2 = await product2.save();

        // Slug should be different
        expect(savedProduct2.slug).not.toBe(product1.slug);
        expect(savedProduct2.slug).toContain("test-bounce-house-");
    });

    // Test static methods
    it("should find a product by slug", async () => {
        // Create a product
        const product = new Product(validProductData);
        await product.save();

        // Find by slug
        const foundProduct = await Product.findBySlug("test-bounce-house");

        expect(foundProduct).not.toBeNull();
        expect(foundProduct?.name).toBe(validProductData.name);
    });

    it("should find products by category", async () => {
        // Create products in different categories
        const product1 = new Product(validProductData);
        await product1.save();

        const product2 = new Product({
            ...validProductData,
            name: "Water Slide",
            category: "water-slide",
        });
        await product2.save();

        // Find by category
        const bounceHouses = await Product.findByCategory("bounce-house");
        const waterSlides = await Product.findByCategory("water-slide");

        expect(bounceHouses).toHaveLength(1);
        expect(bounceHouses[0].name).toBe("Test Bounce House");

        expect(waterSlides).toHaveLength(1);
        expect(waterSlides[0].name).toBe("Water Slide");
    });

    it("should search products by text", async () => {
        // Create products with different text
        const product1 = new Product(validProductData);
        await product1.save();

        const product2 = new Product({
            ...validProductData,
            name: "Water Slide",
            description: "A fun water slide for hot days",
            category: "water-slide",
        });
        await product2.save();

        // Search by text
        const waterResults = await Product.searchProducts("water");
        const bounceResults = await Product.searchProducts("bounce");

        expect(waterResults).toHaveLength(1);
        expect(waterResults[0].name).toBe("Water Slide");

        expect(bounceResults).toHaveLength(1);
        expect(bounceResults[0].name).toBe("Test Bounce House");
    });
});
