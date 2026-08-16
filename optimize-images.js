/**
 * Image Optimization Script
 * Converts images to WebP and AVIF, generates responsive <picture> elements
 * Run: node optimize-images.js
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const IMAGES_DIR = path.join(__dirname, 'Images');
const OUTPUT_DIR = path.join(__dirname, 'Images', 'optimized');

const CONFIG = {
    widths: [400, 800, 1200], // Responsive widths
    quality: {
        webp: 80,
        avif: 50,
        jpeg: 85
    },
    formats: ['webp', 'avif']
};

async function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

async function optimizeImage(inputPath, filename) {
    const ext = path.extname(filename).toLowerCase();
    const baseName = path.basename(filename, ext);
    
    // Skip already optimized files
    if (baseName.includes('@')) return;
    
    console.log(`Optimizing: ${filename}`);
    
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    const results = {
        original: { width: metadata.width, height: metadata.height, format: metadata.format },
        variants: {}
    };
    
    // Generate WebP and AVIF at multiple widths
    for (const format of CONFIG.formats) {
        results.variants[format] = [];
        
        for (const width of CONFIG.widths) {
            if (width >= metadata.width) continue; // Don't upscale
            
            const outputName = `${baseName}@${width}w.${format}`;
            const outputPath = path.join(OUTPUT_DIR, outputName);
            
            await image
                .clone()
                .resize({ width, withoutEnlargement: true })
                [format]({ quality: CONFIG.quality[format] })
                .toFile(outputPath);
            
            const stats = fs.statSync(outputPath);
            results.variants[format].push({
                width,
                filename: outputName,
                size: stats.size,
                url: `Images/optimized/${outputName}`
            });
            
            console.log(`  ${format} ${width}w: ${(stats.size / 1024).toFixed(1)} KB`);
        }
    }
    
    // Also create optimized original format at full size
    const origFormat = metadata.format === 'png' ? 'png' : 'jpeg';
    const origOutputName = `${baseName}@original.${origFormat}`;
    const origOutputPath = path.join(OUTPUT_DIR, origOutputName);
    
    await image
        .clone()
        [origFormat]({ quality: CONFIG.quality.jpeg, progressive: true })
        .toFile(origOutputPath);
    
    const origStats = fs.statSync(origOutputPath);
    results.original.optimizedSize = origStats.size;
    results.original.optimizedUrl = `Images/optimized/${origOutputName}`;
    
    console.log(`  ${origFormat} original: ${(origStats.size / 1024).toFixed(1)} KB`);
    
    return results;
}

async function generatePictureElements(optimizedData) {
    // Generate a mapping file for use in templates
    const mapping = {};
    
    for (const [filename, data] of Object.entries(optimizedData)) {
        const baseName = path.basename(filename, path.extname(filename));
        mapping[filename] = data;
    }
    
    fs.writeFileSync(
        path.join(__dirname, 'site-data', 'image-map.json'),
        JSON.stringify(mapping, null, 2)
    );
    
    console.log('Generated: site-data/image-map.json');
}

function createPictureElement(originalSrc, alt, optimizedData) {
    const filename = path.basename(originalSrc);
    const data = optimizedData[filename];
    
    if (!data) {
        // Fallback
        return `<img src="${originalSrc}" alt="${alt}" loading="lazy">`;
    }
    
    const webpSources = data.variants.webp?.map(v => `${v.url} ${v.width}w`).join(', ') || '';
    const avifSources = data.variants.avif?.map(v => `${v.url} ${v.width}w`).join(', ') || '';
    const fallbackSrc = data.original.optimizedUrl || originalSrc;
    
    let html = '<picture>';
    
    if (avifSources) {
        html += `<source type="image/avif" srcset="${avifSources}" sizes="(max-width: 1200px) 100vw, 1200px">`;
    }
    if (webpSources) {
        html += `<source type="image/webp" srcset="${webpSources}" sizes="(max-width: 1200px) 100vw, 1200px">`;
    }
    
    html += `<img src="${fallbackSrc}" alt="${alt}" loading="lazy" width="${data.original.width}" height="${data.original.height}">`;
    html += '</picture>';
    
    return html;
}

async function main() {
    await ensureDir(OUTPUT_DIR);
    await ensureDir(path.join(__dirname, 'site-data'));
    
    const files = fs.readdirSync(IMAGES_DIR)
        .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
        .filter(f => !f.includes('@')); // Skip already optimized
    
    console.log(`Found ${files.length} images to optimize\n`);
    
    const optimizedData = {};
    
    for (const file of files) {
        const inputPath = path.join(IMAGES_DIR, file);
        try {
            const result = await optimizeImage(inputPath, file);
            optimizedData[file] = result;
        } catch (err) {
            console.error(`Failed to optimize ${file}:`, err.message);
        }
    }
    
    await generatePictureElements(optimizedData);
    
    console.log('\n✅ Image optimization complete!');
    console.log(`Output directory: ${OUTPUT_DIR}`);
    console.log('Use createPictureElement() in your templates to generate responsive <picture> tags.');
}

main().catch(console.error);