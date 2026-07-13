import type { Submission } from '../../shared/types'

// Helper to sanitize title
function cleanTitle(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function parseLeetCodeSubmission(): Submission | null {
  const pathParts = window.location.pathname.split('/')
  
  // URL format: https://leetcode.com/problems/problem-slug/submissions/
  // or submission details: https://leetcode.com/problems/problem-slug/submissions/123456/
  const isProblemPage = pathParts[1] === 'problems'
  if (!isProblemPage) return null

  const problemSlug = pathParts[2]
  const problemTitle = cleanTitle(problemSlug)
  const problemUrl = `https://leetcode.com/problems/${problemSlug}/`

  // Extract difficulty
  let difficulty = 'Medium'
  const diffElement = document.querySelector(
    '.text-difficulty-easy, .text-difficulty-medium, .text-difficulty-hard, [class*="text-difficulty-"]'
  )
  if (diffElement?.textContent) {
    difficulty = diffElement.textContent.trim()
  } else {
    // Scan all divs for Difficulty text
    const textElements = Array.from(document.querySelectorAll('div, span'))
    const match = textElements.find(
      (el) =>
        el.textContent === 'Easy' || el.textContent === 'Medium' || el.textContent === 'Hard'
    )
    if (match?.textContent) {
      difficulty = match.textContent.trim()
    }
  }

  // Extract language
  let language = 'python3'
  const langSelector = document.querySelector(
    'button[id*="language"], div[class*="language-"]'
  )
  if (langSelector?.textContent) {
    language = langSelector.textContent.trim().toLowerCase()
  }

  // Extract Code content from CodeMirror 6 container
  const codeLines = Array.from(document.querySelectorAll('.cm-line'))
  if (codeLines.length === 0) {
    return null
  }
  
  const code = codeLines.map((line) => line.textContent ?? '').join('\n')

  return {
    id: `lc_${Date.now()}`,
    problemTitle,
    problemSlug,
    problemUrl,
    difficulty,
    language,
    code,
    platform: 'leetcode',
    timestamp: Date.now(),
  }
}

export function setupLeetCodeObserver(onSuccess: (sub: Submission) => void): () => void {
  let isChecking = false

  const observer = new MutationObserver(() => {
    if (isChecking) return

    // Search for "Accepted" or "Success" text indicating a successful submission
    const successElement = document.querySelector(
      '[data-e2e-locator="submission-result"], .text-success, .text-sd-success'
    )
    
    if (
      successElement?.textContent?.toLowerCase().includes('accepted') || 
      successElement?.textContent?.toLowerCase().includes('success')
    ) {
      isChecking = true
      
      // Delay slightly to ensure code editor content finishes loading/rendering
      setTimeout(() => {
        try {
          const submission = parseLeetCodeSubmission()
          if (submission && submission.code.trim().length > 0) {
            onSuccess(submission)
          }
        } catch (e) {
          console.error('[CodePush] LeetCode parsing failed', e)
        } finally {
          // Reset check guard after a delay to allow further attempts
          setTimeout(() => { isChecking = false }, 8000)
        }
      }, 1500)
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })

  return () => observer.disconnect()
}
