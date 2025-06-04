#!/usr/bin/env node

/**
 * Bundle Analysis Script
 * Analyzes the build output and provides performance insights
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, "../dist/assets");
const TARGET_SIZES = {
  mainBundle: 500 * 1024, // 500KB
  initialLoad: 200 * 1024, // 200KB
  lazyChunk: 100 * 1024, // 100KB per route
  vendorBundle: 300 * 1024, // 300KB
};

function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function analyzeBundle() {
  console.log("🚀 Bundle Analysis Report\n");

  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ Build directory not found. Run "npm run build" first.');
    process.exit(1);
  }

  const files = fs.readdirSync(DIST_DIR);
  const jsFiles = files.filter(
    (file) => file.endsWith(".js") && !file.includes("legacy"),
  );

  let totalSize = 0;
  let chunks = [];

  jsFiles.forEach((file) => {
    const filePath = path.join(DIST_DIR, file);
    const stats = fs.statSync(filePath);
    const size = stats.size;
    totalSize += size;

    chunks.push({
      name: file,
      size: size,
      formatted: formatBytes(size),
    });
  });

  // Sort by size (largest first)
  chunks.sort((a, b) => b.size - a.size);

  console.log("📊 Chunk Analysis:");
  console.log("==================");

  chunks.forEach((chunk, index) => {
    const status = chunk.size > TARGET_SIZES.lazyChunk ? "⚠️" : "✅";
    console.log(`${status} ${chunk.name}: ${chunk.formatted}`);
  });

  console.log("\n📈 Performance Metrics:");
  console.log("========================");

  const mainChunk = chunks.find((c) => c.name.includes("index-")) || chunks[0];
  const vendorChunks = chunks.filter((c) => c.name.includes("vendor"));
  const featureChunks = chunks.filter(
    (c) => !c.name.includes("vendor") && !c.name.includes("index"),
  );

  console.log(`📦 Total Bundle Size: ${formatBytes(totalSize)}`);
  console.log(
    `🎯 Main Chunk: ${mainChunk ? mainChunk.formatted : "Not found"}`,
  );
  console.log(
    `📚 Vendor Chunks: ${vendorChunks.length} chunks, ${formatBytes(vendorChunks.reduce((sum, c) => sum + c.size, 0))}`,
  );
  console.log(
    `🔧 Feature Chunks: ${featureChunks.length} chunks, ${formatBytes(featureChunks.reduce((sum, c) => sum + c.size, 0))}`,
  );

  console.log("\n🎯 Performance Targets:");
  console.log("========================");

  const mainSize = mainChunk ? mainChunk.size : 0;
  const mainStatus =
    mainSize < TARGET_SIZES.mainBundle ? "✅ PASSED" : "❌ FAILED";
  console.log(`Main Bundle < 500KB: ${mainStatus} (${formatBytes(mainSize)})`);

  const oversizedChunks = featureChunks.filter(
    (c) => c.size > TARGET_SIZES.lazyChunk,
  );
  const chunkStatus = oversizedChunks.length === 0 ? "✅ PASSED" : "❌ FAILED";
  console.log(
    `Lazy Chunks < 100KB: ${chunkStatus} (${oversizedChunks.length} oversized)`,
  );

  if (oversizedChunks.length > 0) {
    console.log("\n⚠️  Oversized Chunks:");
    oversizedChunks.forEach((chunk) => {
      console.log(`   - ${chunk.name}: ${chunk.formatted}`);
    });
  }

  console.log("\n💡 Recommendations:");
  console.log("====================");

  if (mainSize > TARGET_SIZES.mainBundle) {
    console.log("• Consider moving more code to lazy-loaded chunks");
  }

  if (oversizedChunks.length > 0) {
    console.log("• Split large feature chunks into smaller modules");
  }

  const largestVendor = vendorChunks.reduce(
    (largest, chunk) => (chunk.size > largest.size ? chunk : largest),
    { size: 0 },
  );

  if (largestVendor.size > 1024 * 1024) {
    // 1MB
    console.log(
      `• Consider splitting large vendor chunk: ${largestVendor.name}`,
    );
  }

  console.log("• Use dynamic imports for rarely used features");
  console.log("• Consider tree-shaking unused dependencies");

  console.log("\n🎉 Analysis Complete!");

  // Exit with error code if targets not met
  const targetsMet =
    mainSize < TARGET_SIZES.mainBundle && oversizedChunks.length === 0;
  process.exit(targetsMet ? 0 : 1);
}

// Run the analysis if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  analyzeBundle();
}

export { analyzeBundle };
