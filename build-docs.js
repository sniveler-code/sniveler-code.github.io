const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const hljs = require('highlight.js');

// Configure marked with highlight.js
marked.setOptions({
    highlight: function(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
    },
    gfm: true,
    breaks: true
});

const DOCS_DIR = path.join(__dirname, 'documentation');
const TEMPLATE_PATH = path.join(__dirname, 'docs_template.html');
const BASE_URL = 'https://sniveler-code.github.io';

if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error("docs_template.html not found!");
    process.exit(1);
}

const templateStr = fs.readFileSync(TEMPLATE_PATH, 'utf-8');

function slugify(text) {
    return text.toString().toLowerCase().trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
}

// Generate JSON-LD for SoftwareApplication
function generateJsonLd(project, projectTitle, projectDescription) {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": projectTitle,
        "description": projectDescription,
        "applicationCategory": "DeveloperApplication",
        "operatingSystem": "Unity (Windows, macOS, Linux)",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
            "availability": "https://schema.org/InStock",
            "url": `${BASE_URL}/docs_${project}.html`
        },
        "author": {
            "@type": "Organization",
            "name": "Sniveler Code",
            "url": "https://sniveler-code.github.io"
        },
        "publisher": {
            "@type": "Organization",
            "name": "Sniveler Code"
        },
        "url": `${BASE_URL}/docs_${project}.html`,
        "image": `${BASE_URL}/Images/sniveler_logo.png`
    };
    return JSON.stringify(jsonLd, null, 2);
}

// Generate project description from first paragraph of first markdown file
function extractDescription(projectDir, filesToProcess) {
    if (!filesToProcess.length) return '';
    const firstFile = path.join(projectDir, filesToProcess[0].file);
    if (!fs.existsSync(firstFile)) return '';
    const content = fs.readFileSync(firstFile, 'utf-8');
    // Find first paragraph after heading
    const lines = content.split('\n');
    let inParagraph = false;
    let paragraph = '';
    for (const line of lines) {
        if (line.startsWith('#')) {
            if (inParagraph) break;
            continue;
        }
        if (line.trim() && !line.startsWith('![') && !line.startsWith('{')) {
            paragraph = line.trim();
            break;
        }
    }
    return paragraph.replace(/[#*`\[\]]/g, '').substring(0, 160);
}

// Ensure documentation directory exists
if (!fs.existsSync(DOCS_DIR)) {
    console.error("Documentation directory not found!");
    process.exit(1);
}

const projects = fs.readdirSync(DOCS_DIR).filter(file => fs.statSync(path.join(DOCS_DIR, file)).isDirectory());
const sitemapUrls = [`${BASE_URL}/`, `${BASE_URL}/index.html`];

projects.forEach(project => {
    const projectDir = path.join(DOCS_DIR, project);
    const summaryPath = path.join(projectDir, 'SUMMARY.md');
    
    if (!fs.existsSync(summaryPath)) {
        console.warn(`No SUMMARY.md found for project ${project}, skipping...`);
        return;
    }

    console.log(`Processing project: ${project}`);
    
    const summaryLines = fs.readFileSync(summaryPath, 'utf-8').split('\n');
    
    let sidebarHTML = '<ul>';
    let fullMarkdown = '';
    
    // Mapping from filename to anchor slug
    const fileToSlug = {};

    // First pass: find all files and create slugs
    const filesToProcess = [];
    summaryLines.forEach(line => {
        const match = line.match(/\*\s+\[(.*?)\]\((.*?)\)/);
        if (match) {
            const title = match[1];
            const file = match[2];
            const cleanTitle = title.replace(/[^\w\s]/g, '').trim(); // Remove emojis for slug
            const slug = slugify(cleanTitle) || slugify(file.replace('.md', ''));
            fileToSlug[file] = slug;
            filesToProcess.push({ title, file, slug });
        }
    });

    // Build Sidebar and Concatenate Markdown
    filesToProcess.forEach(({title, file, slug}) => {
        sidebarHTML += `<li><a href="#${slug}">${title}</a></li>`;
        
        const filePath = path.join(projectDir, file);
        if (fs.existsSync(filePath)) {
            let content = fs.readFileSync(filePath, 'utf-8');
            
            // Fix images
            content = content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
                if (!src.startsWith('http') && !src.startsWith('/')) {
                    const dir = file.includes('/') ? file.substring(0, file.lastIndexOf('/') + 1) : '';
                    return `![${alt}](documentation/${project}/${dir}${src})`;
                }
                return match;
            });
            
            content = content.replace(/<img\s+[^>]*src="([^"]+)"[^>]*>/gi, (match, src) => {
                if (!src.startsWith('http') && !src.startsWith('/')) {
                    const dir = file.includes('/') ? file.substring(0, file.lastIndexOf('/') + 1) : '';
                    const newSrc = `documentation/${project}/${dir}${src}`;
                    return match.replace(src, newSrc);
                }
                return match;
            });

            // Fix internal markdown links
            content = content.replace(/\[([^\]]+)\]\(([^)]+\.md)\)/g, (match, linkText, src) => {
                if (!src.startsWith('http')) {
                    const targetFile = src.startsWith('./') ? src.substring(2) : src;
                    const targetSlug = fileToSlug[targetFile];
                    if (targetSlug) {
                        return `[${linkText}](#${targetSlug})`;
                    }
                }
                return match;
            });

            // Fix Gitbook YouTube embeds - use youtube-nocookie.com
            content = content.replace(/{%\s*embed\s+url="([^"]+)"\s*%}/g, (match, url) => {
                let videoId = '';
                if (url.includes('youtu.be/')) {
                    videoId = url.split('youtu.be/')[1].split('?')[0];
                } else if (url.includes('youtube.com/watch')) {
                    try {
                        const urlObj = new URL(url);
                        videoId = urlObj.searchParams.get('v');
                    } catch(e) {}
                }
                
                if (videoId) {
                    return `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; margin: 1.5rem 0; border-radius: 8px; border: 1px solid var(--border); box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
                                <iframe src="https://www.youtube-nocookie.com/embed/${videoId}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" allowfullscreen></iframe>
                            </div>`;
                }
                return `<a href="${url}" target="_blank" style="color: var(--accent);">${url}</a>`;
            });

            // Strip GitBook internal hints/macros if any (like {% hint ... %})
            content = content.replace(/{%\s*hint[^%]*%}([\s\S]*?){%\s*endhint\s*%}/g, (match, p1) => {
                return `> ${p1.trim().replace(/\n/g, '\n> ')}`;
            });

            // Add anchor point and append content
            fullMarkdown += `\n<div id="${slug}"></div>\n\n` + content + `\n\n---\n`;
        } else {
            console.warn(`File not found: ${filePath}`);
        }
    });

    sidebarHTML += '</ul>';

    const renderedHTML = marked.parse(fullMarkdown);
    
    // Capitalize project title
    const projectTitle = project.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const projectSlug = project.toLowerCase();
    const projectDescription = extractDescription(projectDir, filesToProcess) || 
        `Documentation for ${projectTitle} - High-performance Unity DOTS/ECS tooling by Sniveler Code.`;
    const jsonLd = generateJsonLd(project, projectTitle, projectDescription);

    const finalHTML = templateStr
        .replace(/\{\{PROJECT_TITLE\}\}/g, projectTitle)
        .replace(/\{\{PROJECT_DESCRIPTION\}\}/g, projectDescription.replace(/\"/g, '"'))
        .replace(/\{\{PROJECT_SLUG\}\}/g, projectSlug)
        .replace('{{SIDEBAR_CONTENT}}', sidebarHTML)
        .replace('{{MAIN_CONTENT}}', renderedHTML)
        .replace('{{JSON_LD}}', jsonLd);

    const outPath = path.join(__dirname, `docs_${project}.html`);
    fs.writeFileSync(outPath, finalHTML);
    console.log(`Generated: ${outPath}`);

    // Add to sitemap
    sitemapUrls.push(`${BASE_URL}/docs_${project}.html`);
});

// Generate sitemap.xml
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(url => `  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>${url === BASE_URL + '/' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>`;

fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), sitemap);
console.log('Generated: sitemap.xml');

// Generate robots.txt
const robots = `User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
`;
fs.writeFileSync(path.join(__dirname, 'robots.txt'), robots);
console.log('Generated: robots.txt');

console.log('Build complete.');

// Generate RSS feed for asset updates
const rssItems = projects.map(project => {
    const projectTitle = project.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const projectDir = path.join(DOCS_DIR, project);
    const summaryPath = path.join(projectDir, 'SUMMARY.md');
    
    let description = `Documentation for ${projectTitle}`;
    if (fs.existsSync(summaryPath)) {
        const summaryLines = fs.readFileSync(summaryPath, 'utf-8').split('\n');
        const firstLine = summaryLines.find(l => l.trim() && !l.startsWith('#'));
        if (firstLine) {
            const match = firstLine.match(/\*\[(.*?)\]\((.*?)\)/);
            if (match) description = match[1];
        }
    }
    
    return `  <item>
    <title>${projectTitle}</title>
    <link>${BASE_URL}/docs_${project}.html</link>
    <guid>${BASE_URL}/docs_${project}.html</guid>
    <description><![CDATA[${description}]]></description>
    <pubDate>${new Date().toUTCString()}</pubDate>
  </item>`;
}).join('\n');

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Sniveler Code — Documentation Updates</title>
    <link>${BASE_URL}/</link>
    <description>High-Performance Unity DOTS/ECS Architecture & Tooling Documentation</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml" />
${rssItems}
  </channel>
</rss>`;

fs.writeFileSync(path.join(__dirname, 'feed.xml'), rss);
console.log('Generated: feed.xml');