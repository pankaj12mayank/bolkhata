import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const langPath = path.join(__dirname, 'src', 'context', 'LangContext.jsx')
let content = fs.readFileSync(langPath, 'utf8')

// Remove single-line comments
content = content.replace(/\/\/.*/g, '')
// Remove multi-line comments
content = content.replace(/\/\*[\s\S]*?\*\//g, '')

function extractDict(varName) {
  const startRegex = new RegExp(`const\\s+${varName}\\s*=\\s*\\{`)
  const match = startRegex.exec(content)
  if (!match) return null
  const startIndex = match.index + match[0].length - 1
  let braceCount = 0
  let endIndex = -1
  for (let i = startIndex; i < content.length; i++) {
    if (content[i] === '{') braceCount++
    else if (content[i] === '}') {
      braceCount--
      if (braceCount === 0) {
        endIndex = i
        break
      }
    }
  }
  if (endIndex === -1) return null
  const dictStr = content.slice(startIndex, endIndex + 1)
  
  const keys = new Set()
  // Match key: "value", or 'key': "value" at the start of a line/property
  const keyRegex = /(?:^|[\s,{])([a-zA-Z0-9_]+)\s*:\s*["'`]/g
  let m
  while ((m = keyRegex.exec(dictStr)) !== null) {
    keys.add(m[1])
  }
  return keys
}

const hiKeys = extractDict('hi')
const enKeys = extractDict('en')

if (!hiKeys || !enKeys) {
  console.error('❌ Could not extract language dictionaries hi/en from LangContext.jsx')
  process.exit(1)
}

console.log(`Found ${hiKeys.size} keys in 'hi' dictionary.`)
console.log(`Found ${enKeys.size} keys in 'en' dictionary.`)

const missingInEn = [...hiKeys].filter(k => !enKeys.has(k)).sort()
const missingInHi = [...enKeys].filter(k => !hiKeys.has(k)).sort()

let hasError = false
if (missingInEn.length > 0) {
  console.error(`❌ Keys present in 'hi' but missing in 'en' (${missingInEn.length}):`, missingInEn)
  hasError = true
}
if (missingInHi.length > 0) {
  console.error(`❌ Keys present in 'en' but missing in 'hi' (${missingInHi.length}):`, missingInHi)
  hasError = true
}

if (!hasError) {
  console.log('✅ 100% Language key parity confirmed between Hindi (hi) and English (en)!')
  process.exit(0)
} else {
  process.exit(1)
}
