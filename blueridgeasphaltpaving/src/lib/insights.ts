import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'

const insightsDirectory = path.join(process.cwd(), 'content/insights')

export interface InsightData {
  slug: string
  title: string
  date: string
  description: string
  coverImage: string
  contentHtml?: string
}

export function getSortedInsightsData(): InsightData[] {
  if (!fs.existsSync(insightsDirectory)) {
    return []
  }

  // Get file names under /content/insights
  const fileNames = fs.readdirSync(insightsDirectory)
  const allInsightsData = fileNames.map((fileName) => {
    // Remove ".md" from file name to get slug
    const slug = fileName.replace(/\.md$/, '')

    // Read markdown file as string
    const fullPath = path.join(insightsDirectory, fileName)
    const fileContents = fs.readFileSync(fullPath, 'utf8')

    // Use gray-matter to parse the post metadata section
    const matterResult = matter(fileContents)

    // Combine the data with the slug
    return {
      slug,
      ...(matterResult.data as { title: string; date: string; description: string; coverImage: string }),
    }
  })

  // Sort posts by date
  return allInsightsData.sort((a, b) => {
    if (a.date < b.date) {
      return 1
    } else {
      return -1
    }
  })
}

export function getAllInsightSlugs() {
  if (!fs.existsSync(insightsDirectory)) {
    return []
  }
  const fileNames = fs.readdirSync(insightsDirectory)
  return fileNames.map((fileName) => {
    return {
      slug: fileName.replace(/\.md$/, ''),
    }
  })
}

export async function getInsightData(slug: string): Promise<InsightData> {
  const fullPath = path.join(insightsDirectory, `${slug}.md`)
  const fileContents = fs.readFileSync(fullPath, 'utf8')

  // Use gray-matter to parse the post metadata section
  const matterResult = matter(fileContents)

  // Use remark to convert markdown into HTML string
  const processedContent = await remark()
    .use(html)
    .process(matterResult.content)
  const contentHtml = processedContent.toString()

  // Combine the data with the id and contentHtml
  return {
    slug,
    contentHtml,
    ...(matterResult.data as { title: string; date: string; description: string; coverImage: string }),
  }
}
