import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distDir = path.resolve(__dirname, '../dist')
const seoComponentPath = path.resolve(__dirname, '../src/components/SEO.jsx')

function walkHtmlFiles(dir, collector = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkHtmlFiles(fullPath, collector)
      continue
    }
    if (entry.isFile() && fullPath.endsWith('.html')) {
      collector.push(fullPath)
    }
  }
  return collector
}

if (!fs.existsSync(distDir)) {
  console.error('SEO readiness check failed: dist/ not found. Run npm run build first.')
  process.exit(1)
}

if (!fs.existsSync(seoComponentPath)) {
  console.error('SEO readiness check failed: src/components/SEO.jsx not found.')
  process.exit(1)
}

const htmlFiles = walkHtmlFiles(distDir)
if (htmlFiles.length === 0) {
  console.error('SEO readiness check failed: no HTML files found in dist/.')
  process.exit(1)
}

const failures = []

const seoComponent = fs.readFileSync(seoComponentPath, 'utf8')
if (!seoComponent.includes('meta[name="robots"]')) {
  failures.push('src/components/SEO.jsx: robots meta handling not found')
}
if (!seoComponent.includes('link[rel="canonical"]')) {
  failures.push('src/components/SEO.jsx: canonical link handling not found')
}
if (!seoComponent.includes('meta[name="description"]')) {
  failures.push('src/components/SEO.jsx: description meta handling not found')
}

for (const filePath of htmlFiles) {
  const content = fs.readFileSync(filePath, 'utf8')
  const relPath = path.relative(distDir, filePath).replace(/\\/g, '/')

  if (!/\<title\>[^<]{8,}\<\/title\>/i.test(content)) {
    failures.push(`${relPath}: missing or too-short <title>`)
  }
  if (!/\<meta(?=[^>]*\bname=["']description["'])(?=[^>]*\bcontent=(['"]).{20,}?\1)[^>]*>/is.test(content)) {
    failures.push(`${relPath}: missing or too-short meta description`)
  }
  if (!/\<link(?=[^>]*\brel=["']canonical["'])(?=[^>]*\bhref=["']https?:\/\/[^"']+["'])[^>]*>/i.test(content)) {
    failures.push(`${relPath}: missing canonical link`) 
  }
  if (!/\<meta(?=[^>]*\bname=["']robots["'])(?=[^>]*\bcontent=["'][^"']+["'])[^>]*>/i.test(content)) {
    failures.push(`${relPath}: missing robots meta`) 
  }
}

if (failures.length > 0) {
  console.error('SEO readiness guard failed:')
  for (const failure of failures.slice(0, 80)) {
    console.error(` - ${failure}`)
  }
  if (failures.length > 80) {
    console.error(` - ...and ${failures.length - 80} more`) 
  }
  process.exit(1)
}

console.log(`SEO readiness guard passed for ${htmlFiles.length} HTML files.`)
