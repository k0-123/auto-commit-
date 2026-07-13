import type { Submission } from '../../shared/types'

export function parseCodeforcesSubmission(): Submission | null {
  const url = window.location.href
  const isSubmissionPage = url.includes('/submission/')
  if (!isSubmissionPage) return null

  // Extract submission ID from URL
  const pathParts = window.location.pathname.split('/')
  const submissionId = pathParts[pathParts.length - 1]

  // Find Code content
  const codePre = document.querySelector('#program-source, .program-source, pre.prettyprint')
  if (!codePre) return null
  const code = codePre.textContent ?? ''

  // Find Problem Link & Title
  // Usually in Codeforces submission details, there is a header or table row with problem name
  // e.g. table cell with link to /contest/{id}/problem/{letter} or /problemset/problem/{id}/{letter}
  const problemLink = document.querySelector(
    'a[href*="/problem/"], a[href*="/problemset/problem/"]'
  ) as HTMLAnchorElement | null

  if (!problemLink) return null

  const problemTitle = problemLink.textContent?.trim() ?? 'Codeforces Problem'
  const problemUrl = problemLink.href
  const problemSlug = problemUrl.split('/').slice(-2).join('-') // e.g. "1234-A"

  // Find Language
  // Language is usually listed in the submission info table
  let language = 'cpp'
  const cells = Array.from(document.querySelectorAll('td'))
  const langIndex = cells.findIndex((cell) => cell.textContent?.includes('Lang:'))
  if (langIndex !== -1 && cells[langIndex + 1]) {
    language = cells[langIndex + 1].textContent?.trim().toLowerCase() ?? 'cpp'
  } else {
    // Fallback: search table headers or metadata
    const infoText = document.body.textContent ?? ''
    const match = infoText.match(/lang(?:uage)?:\s*([a-zA-Z0-9+#\s]+)/i)
    if (match?.[1]) {
      language = match[1].trim().toLowerCase()
    }
  }

  // Find difficulty (rating)
  // Rating tag looks like "*1400" or similar in the sidebar or problem tags
  let difficulty = '1000'
  const tags = Array.from(document.querySelectorAll('.tag-box'))
  const ratingTag = tags.find((t) => t.textContent?.trim().startsWith('*'))
  if (ratingTag?.textContent) {
    difficulty = ratingTag.textContent.trim().replace('*', '')
  }

  return {
    id: `cf_${submissionId}`,
    problemTitle,
    problemSlug,
    problemUrl,
    difficulty,
    language,
    code,
    platform: 'codeforces',
    timestamp: Date.now(),
  }
}

export function setupCodeforcesObserver(onSuccess: (sub: Submission) => void): () => void {
  // If we are already on a submission page, parse it immediately
  const submission = parseCodeforcesSubmission()
  if (submission && submission.code.trim().length > 0) {
    // Check if the verdict is "OK" or "Accepted"
    const verdict = document.body.textContent ?? ''
    if (verdict.includes('Accepted') || verdict.includes('Verdict: OK') || verdict.includes('OK')) {
      onSuccess(submission)
    }
  }

  // Monitor DOM for dynamic loaded submissions list
  const observer = new MutationObserver(() => {
    // Codeforces doesn't load submission popup dynamically unless clicking an ID
    // If the submission details popup is opened:
    const codePre = document.querySelector('.popup-code pre')
    if (codePre) {
      const submission = parseCodeforcesSubmission()
      if (submission) {
        onSuccess(submission)
      }
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })

  return () => observer.disconnect()
}
