const fs = require('fs')

const statsPath = 'src/pages/AgentStatsPage.tsx'
const dashPath = 'src/pages/AgentDashboardPage.tsx'

const statsCode = fs.readFileSync(statsPath, 'utf8')
let dashCode = fs.readFileSync(dashPath, 'utf8')

// 1. Extract CSS from StatsPage
const cssMatch = statsCode.match(/\/\* ML stats \*\/[\s\S]*?(?=\@media\()/)
if (cssMatch && !dashCode.includes('/* ML stats */')) {
  dashCode = dashCode.replace('/* reclassify box */', cssMatch[0] + '\n/* reclassify box */')
}

// 2. Extract the JSX block from StatsPage
const jsxMatch = statsCode.match(/(\{!mlLoading && mlStats && \([\s\S]*?\)\})/)
if (jsxMatch && !dashCode.includes('!mlLoading && mlStats &&')) {
  // Extract mlLoading spinner code too
  const spinnerJsxMatch = statsCode.match(/(\{mlLoading && \([\s\S]*?\)\})/)
  const errorJsxMatch = statsCode.match(/(\{!mlLoading && mlError && \([\s\S]*?\)\})/)
  
  const totalJsx = `
          ) : activeTab === 'stats' ? (
            <div className="animate__animated animate__fadeIn">
              ${spinnerJsxMatch ? spinnerJsxMatch[0] : ''}
              ${errorJsxMatch ? errorJsxMatch[0] : ''}
              ${jsxMatch[0]}
            </div>
`

  // Insert before ) : null} in Dashboard
  dashCode = dashCode.replace(/(\n\s*)(\)\s*:\s*null\})/g, `$1${totalJsx}$1$2`)
}

fs.writeFileSync(dashPath, dashCode)
console.log('Merge complete')
