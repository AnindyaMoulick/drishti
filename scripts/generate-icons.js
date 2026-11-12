const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 1. App Icon SVG (Squircle with gradient for PWA, Apple touch, mobile icons, standard icon)
const appIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366F1"/>
      <stop offset="100%" stop-color="#4338CA"/>
    </linearGradient>
    <linearGradient id="innerGlow" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.25"/>
      <stop offset="60%" stop-color="#FFFFFF" stop-opacity="0"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#1E1B4B" flood-opacity="0.35"/>
    </filter>
  </defs>
  
  <!-- Base Squircle -->
  <rect width="512" height="512" rx="115" fill="url(#bgGrad)"/>
  <rect width="512" height="512" rx="115" fill="url(#innerGlow)"/>
  
  <!-- Drishti Eye (from Home Page) with subtle soft shadow -->
  <g filter="url(#shadow)">
    <g transform="translate(256, 256) scale(14.5) translate(-12, -12)">
      <!-- Eye outline -->
      <path 
        d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5z" 
        stroke="#FFFFFF" 
        stroke-width="2" 
        stroke-linecap="round" 
        stroke-linejoin="round" 
        fill="none"
      />
      <!-- Eye pupil / iris -->
      <circle cx="12" cy="12" r="3.5" fill="#FFFFFF"/>
    </g>
  </g>
</svg>`;

// 2. Favicon SVG (Scalable SVG icon for browser tabs, works on light & dark browser toolbars)
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
  <defs>
    <linearGradient id="favBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366F1"/>
      <stop offset="100%" stop-color="#4F46E5"/>
    </linearGradient>
  </defs>
  <rect width="48" height="48" rx="12" fill="url(#favBg)"/>
  <g transform="translate(24, 24) scale(1.35) translate(-12, -12)">
    <path 
      d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5z" 
      stroke="#FFFFFF" 
      stroke-width="2" 
      stroke-linecap="round" 
      stroke-linejoin="round" 
      fill="none"
    />
    <circle cx="12" cy="12" r="3.5" fill="#FFFFFF"/>
  </g>
</svg>`;

// Helper function to build a valid Windows .ico file from an array of PNG buffers
function createIco(pngBuffers) {
  // ICO header: 6 bytes
  // 0-1: Reserved (0)
  // 2-3: Type (1 = ICO)
  // 4-5: Count of images
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngBuffers.length, 4);

  // Directory entries: 16 bytes each
  const dirEntrySize = 16;
  const dirEntries = [];
  let offset = 6 + (dirEntrySize * pngBuffers.length);

  for (const item of pngBuffers) {
    const entry = Buffer.alloc(dirEntrySize);
    // Width (0-255, 0 = 256)
    entry.writeUInt8(item.width >= 256 ? 0 : item.width, 0);
    // Height
    entry.writeUInt8(item.height >= 256 ? 0 : item.height, 1);
    // Color palette (0 = no palette)
    entry.writeUInt8(0, 2);
    // Reserved
    entry.writeUInt8(0, 3);
    // Color planes (1)
    entry.writeUInt16LE(1, 4);
    // Bits per pixel (32)
    entry.writeUInt16LE(32, 6);
    // Size of image data in bytes
    entry.writeUInt32LE(item.buffer.length, 8);
    // Offset from beginning of file
    entry.writeUInt32LE(offset, 12);

    dirEntries.push(entry);
    offset += item.buffer.length;
  }

  return Buffer.concat([
    header,
    ...dirEntries,
    ...pngBuffers.map(b => b.buffer)
  ]);
}

async function generate() {
  const rootDir = path.resolve(__dirname, '..');
  const publicDir = path.join(rootDir, 'public');
  const appDir = path.join(rootDir, 'src', 'app');

  // Save SVGs
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), appIconSvg);
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvg);
  fs.writeFileSync(path.join(appDir, 'icon.svg'), appIconSvg);
  console.log('✓ Wrote icon.svg and favicon.svg');

  // Generate PNGs at different resolutions
  const sizes = [
    { name: 'icon-16.png', size: 16, target: publicDir },
    { name: 'icon-32.png', size: 32, target: publicDir },
    { name: 'icon-48.png', size: 48, target: publicDir },
    { name: 'apple-touch-icon.png', size: 180, target: publicDir },
    { name: 'icon-192.png', size: 192, target: publicDir },
    { name: 'icon-512.png', size: 512, target: publicDir },
  ];

  const icoPngs = [];

  for (const s of sizes) {
    const buf = await sharp(Buffer.from(appIconSvg))
      .resize(s.size, s.size)
      .png({ compressionLevel: 9 })
      .toBuffer();

    fs.writeFileSync(path.join(s.target, s.name), buf);
    console.log(`✓ Generated ${s.name} (${s.size}x${s.size})`);

    if ([16, 32, 48].includes(s.size)) {
      icoPngs.push({ width: s.size, height: s.size, buffer: buf });
    }
  }

  // Also write apple-touch-icon in src/app for Next.js metadata convention
  const appleIconBuf = await sharp(Buffer.from(appIconSvg))
    .resize(180, 180)
    .png({ compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(appDir, 'apple-icon.png'), appleIconBuf);
  console.log('✓ Generated src/app/apple-icon.png (180x180)');

  // Build multi-size favicon.ico (16, 32, 48)
  const icoBuffer = createIco(icoPngs);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  fs.writeFileSync(path.join(appDir, 'favicon.ico'), icoBuffer);
  console.log('✓ Generated multi-size favicon.ico for public/ and src/app/');

  console.log('All icons generated successfully!');
}

generate().catch(err => {
  console.error('Generation failed:', err);
  process.exit(1);
});
