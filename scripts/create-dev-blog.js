// Development script to create a blog post with authentication
import fetch from "node-fetch";
import jwt from "jsonwebtoken";

// Create a development token
const createDevToken = () => {
  // This is for development purposes only
  const devUser = {
    id: "6382a44a44b6735842231ed2", // Use a valid user ID from your database
    email: "dev@example.com",
    role: "admin",
  };

  return jwt.sign(devUser, process.env.JWT_SECRET || "dev-secret", {
    expiresIn: "1d",
  });
};

async function createBlog() {
  try {
    // Generate a development token
    const token = createDevToken();

    const response = await fetch("http://localhost:3000/api/v1/blogs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: "Development Blog Post",
        introduction: "This is a sample introduction created for development.",
        body: "This is the main content of the blog post created for development purposes.",
        conclusion: "This is the conclusion of the development blog post.",
        status: "published",
        categories: ["development", "test"],
        tags: ["sample", "dev"],
      }),
    });

    const data = await response.json();
    console.log("Response:", data);
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the function
createBlog();
