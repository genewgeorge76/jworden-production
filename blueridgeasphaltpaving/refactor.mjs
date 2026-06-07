import fs from 'fs'
import path from 'path'

const getFiles = (dir) => {
  const files = fs.readdirSync(dir)
  let allFiles = []
  for (const file of files) {
    const fullPath = path.join(dir, file)
    if (fs.statSync(fullPath).isDirectory()) {
      allFiles = allFiles.concat(getFiles(fullPath))
    } else if (fullPath.endsWith('page.tsx')) {
      allFiles.push(fullPath)
    }
  }
  return allFiles
}

const appDir = path.join(process.cwd(), 'src/app')
const files = getFiles(appDir)

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8')
  
  // Skip if already imported or if no form exists
  if (content.includes('AIEstimationForm') || !content.includes('<form style={{ display: \'flex\'')) {
    continue
  }

  // Find the location name from the placeholder
  const match = content.match(/placeholder="(.*?) Property Address"/)
  let location = 'Virginia'
  if (match && match[1]) {
    location = match[1]
  }

  // Regex to match the entire form block
  // We use a simple regex that captures <form ...> to </form>
  const formRegex = /<form style={{ display: 'flex'[\s\S]*?<\/form>/g
  content = content.replace(formRegex, `<AIEstimationForm location="${location}" />`)

  // Add the import statement near the top
  const importStatement = "import AIEstimationForm from '@/components/AIEstimationForm'\n"
  
  // Insert import after the last import statement or at the top
  if (content.includes('import VisualProofGallery')) {
    content = content.replace("import VisualProofGallery from '@/components/VisualProofGallery'", "import VisualProofGallery from '@/components/VisualProofGallery'\nimport AIEstimationForm from '@/components/AIEstimationForm'")
  } else if (content.includes("import type { Metadata }")) {
    content = content.replace("import type { Metadata } from 'next'", "import type { Metadata } from 'next'\nimport AIEstimationForm from '@/components/AIEstimationForm'")
  } else {
    content = importStatement + content
  }

  fs.writeFileSync(file, content, 'utf8')
  console.log(`Updated ${file}`)
}

console.log('Refactor complete.')
