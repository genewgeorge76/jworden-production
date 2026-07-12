const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Brand Replacement
    content = content.replace(/J\. Worden & Sons Paving LLC/g, 'Blue Ridge Estate Paving');
    content = content.replace(/J\. WORDEN & SONS <span>PAVING<\/span>/g, 'BLUE RIDGE <span style="color:var(--powerhouse-red)">ESTATE PAVING</span>');
    content = content.replace(/J\. Worden Paving/g, 'Blue Ridge Estate Paving');
    
    // Geo Replacement
    content = content.replace(/CHESTER, VA/g, 'ROANOKE, VA');
    content = content.replace(/Chester, Richmond, and Chesterfield County, VA/g, 'Roanoke, Charlottesville, and the Virginia Highlands');
    
    // Layout-specific footers
    content = content.replace(/Richmond VA \(Local\)/g, 'Roanoke VA (Local)');
    
    fs.writeFileSync(filePath, content, 'utf8');
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== '.next') {
                processDirectory(fullPath);
            }
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css') || fullPath.endsWith('.md')) {
            replaceInFile(fullPath);
        }
    }
}

// Global CSS variable swap (Red to Estate Gold)
const cssPath = path.join(__dirname, 'src', 'app', 'globals.css');
if (fs.existsSync(cssPath)) {
    let cssContent = fs.readFileSync(cssPath, 'utf8');
    cssContent = cssContent.replace(/--powerhouse-red: #d32f2f;/g, '--powerhouse-red: #fbbf24;');
    cssContent = cssContent.replace(/--carbon-black: #111111;/g, '--carbon-black: #0f172a;');
    fs.writeFileSync(cssPath, cssContent, 'utf8');
}

processDirectory(path.join(__dirname, 'src'));
processDirectory(path.join(__dirname, 'content'));

console.log("Rebranding script executed successfully.");
