// Test script to validate redirect fixes
const testUrls = [
  // Test trailing slash redirects
  "https://www.satxbounce.com/products/",
  "https://www.satxbounce.com/blogs/",
  "https://www.satxbounce.com/faq/",
  "https://www.satxbounce.com/about/",

  // Test non-www to www redirects
  "https://satxbounce.com/products",
  "https://satxbounce.com/about",
  "https://satxbounce.com/login",

  // Test party-packages accessibility
  "https://www.satxbounce.com/party-packages",

  // Test query parameter handling
  "https://www.satxbounce.com/blogs?category=Seasonal%20Events",
  "https://www.satxbounce.com/blogs?tag=perfect%20weather",
];

console.log("URLs to test for redirect fixes:");
testUrls.forEach((url, index) => {
  console.log(`${index + 1}. ${url}`);
});

console.log("\nExpected behavior:");
console.log(
  "- Trailing slash URLs should redirect to non-trailing slash versions",
);
console.log("- Non-www URLs should redirect to www versions");
console.log("- party-packages should be accessible to search bots");
console.log(
  "- Blog URLs with query params should have canonical URLs pointing to /blogs",
);
