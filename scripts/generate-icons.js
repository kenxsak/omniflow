/**
 * PWA Icon Generator Script
 * 
 * This script generates all required PWA icons from the SVG source.
 * 
 * Prerequisites:
 * npm install sharp
 * 
 * Usage:
 * node scripts/generate-icons.js
 * 
 * Or use an online tool like:
 * - https://realfavicongenerator.net/
 * - https://www.pwabuilder.com/imageGenerator
 * 
 * Upload the SVG from public/icons/icon.svg and download the generated icons.
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '../public/icons');
const SVG_PATH = path.join(ICONS_DIR, 'icon.svg');
const MASKABLE_SVG_PATH = path.join(ICONS_DIR, 'maskable-icon.svg');

// Icon sizes needed for PWA
const ICON_SIZES = [16, 32, 72, 96, 128, 144, 152, 167, 180, 192, 384, 512];
const MASKABLE_SIZES = [192, 512];

async function generateIcons() {
  console.log('🎨 Generating PWA icons...\n');

  // Ensure icons directory exists
  if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
  }

  // Check if SVG exists
  if (!fs.existsSync(SVG_PATH)) {
    console.error('❌ SVG file not found at:', SVG_PATH);
    console.log('\nPlease create the SVG icon first.');
    process.exit(1);
  }

  const svgBuffer = fs.readFileSync(SVG_PATH);

  // Generate regular icons
  for (const size of ICON_SIZES) {
    const outputPath = path.join(ICONS_DIR, `icon-${size}x${size}.png`);
    
    try {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated: icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`❌ Failed to generate icon-${size}x${size}.png:`, error.message);
    }
  }

  // Generate Apple Touch Icon (180x180)
  try {
    await sharp(svgBuffer)
      .resize(180, 180)
      .png()
      .toFile(path.join(ICONS_DIR, 'apple-touch-icon.png'));
    
    console.log('✅ Generated: apple-touch-icon.png');
  } catch (error) {
    console.error('❌ Failed to generate apple-touch-icon.png:', error.message);
  }

  // Generate maskable icons (for Android adaptive icons)
  if (fs.existsSync(MASKABLE_SVG_PATH)) {
    const maskableSvgBuffer = fs.readFileSync(MASKABLE_SVG_PATH);
    
    for (const size of MASKABLE_SIZES) {
      const outputPath = path.join(ICONS_DIR, `maskable-icon-${size}x${size}.png`);
      
      try {
        await sharp(maskableSvgBuffer)
          .resize(size, size)
          .png()
          .toFile(outputPath);
        
        console.log(`✅ Generated: maskable-icon-${size}x${size}.png`);
      } catch (error) {
        console.error(`❌ Failed to generate maskable-icon-${size}x${size}.png:`, error.message);
      }
    }
  }

  // Generate favicon.ico (multi-size)
  try {
    await sharp(svgBuffer)
      .resize(32, 32)
      .toFormat('png')
      .toFile(path.join(ICONS_DIR, 'favicon.png'));
    
    console.log('✅ Generated: favicon.png (use online converter for .ico)');
  } catch (error) {
    console.error('❌ Failed to generate favicon:', error.message);
  }

  console.log('\n🎉 Icon generation complete!');
  console.log('\nNote: For favicon.ico, use an online converter like https://favicon.io/');
}

generateIcons().catch(console.error);
