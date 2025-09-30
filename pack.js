#!/usr/bin/env bun
import { $ } from "bun";
import { existsSync, mkdirSync, rmSync } from "fs";
import { join } from "path";

const outputDir = "dist";
const outputFile = "x-follower-remover.zip";

// Files and directories to include in the package
const filesToInclude = [
  "manifest.json",
  "popup.html",
  "popup.js",
  "content.js",
  "favicon_io"
];

console.log("🎁 Packing Chrome Extension...\n");

// Clean up previous build
if (existsSync(outputDir)) {
  console.log("🧹 Cleaning previous build...");
  rmSync(outputDir, { recursive: true });
}

// Create dist directory
mkdirSync(outputDir, { recursive: true });

// Create the zip file
console.log("📦 Creating package...");

try {
  // Use zip command to create the archive, excluding system files
  const filesString = filesToInclude.join(" ");
  await $`zip -r ${join(outputDir, outputFile)} ${filesToInclude} -x '*.DS_Store' '__MACOSX/*'`.quiet();
  
  console.log(`\n✅ Successfully created: ${outputDir}/${outputFile}`);
  console.log("📤 Ready to upload to Chrome Web Store!\n");
  
  // Show package contents
  console.log("📋 Package contents:");
  await $`unzip -l ${join(outputDir, outputFile)}`;
  
} catch (error) {
  console.error("❌ Error creating package:", error.message);
  process.exit(1);
}
