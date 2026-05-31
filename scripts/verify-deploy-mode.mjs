import fs from 'node:fs'

const netlifyPath = 'netlify.toml'
const content = fs.readFileSync(netlifyPath, 'utf8')

const modeMatch = content.match(/VITE_DEPLOY_MODE\s*=\s*"([^"]+)"/)
if (!modeMatch) {
  console.error('[deploy-mode-guard] FAIL: netlify.toml is missing build.environment VITE_DEPLOY_MODE')
  process.exit(1)
}

const mode = String(modeMatch[1] || '').trim().toLowerCase()
const allowed = new Set(['production', 'staging', 'development'])
if (!allowed.has(mode)) {
  console.error(`[deploy-mode-guard] FAIL: VITE_DEPLOY_MODE must be one of production|staging|development (found: ${modeMatch[1]})`)
  process.exit(1)
}

console.log(`[deploy-mode-guard] PASS: VITE_DEPLOY_MODE=${mode}`)
