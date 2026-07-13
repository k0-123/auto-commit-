import { setupLeetCodeObserver } from './adapters/leetcode-adapter'
import { setupCodeforcesObserver } from './adapters/codeforces-adapter'
import type { Submission } from '../shared/types'

console.log('[AutoCommit] Content script initialized')

function injectToast(message: string): void {
  // Check if toast already exists
  if (document.getElementById('autocommit-toast')) return

  const toast = document.createElement('div')
  toast.id = 'autocommit-toast'
  toast.style.position = 'fixed'
  toast.style.bottom = '24px'
  toast.style.right = '24px'
  toast.style.backgroundColor = '#10b981' // Green theme for commit success!
  toast.style.color = '#ffffff'
  toast.style.padding = '12px 18px'
  toast.style.borderRadius = '12px'
  toast.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
  toast.style.fontFamily = 'system-ui, -apple-system, sans-serif'
  toast.style.fontSize = '13px'
  toast.style.fontWeight = '600'
  toast.style.zIndex = '999999'
  toast.style.display = 'flex'
  toast.style.alignItems = 'center'
  toast.style.gap = '10px'
  toast.style.transition = 'all 0.3s ease'
  toast.style.opacity = '0'
  toast.style.transform = 'translateY(20px)'

  const icon = document.createElement('div')
  icon.textContent = '🚀'
  icon.style.fontSize = '16px'

  const text = document.createElement('div')
  text.textContent = message

  const closeBtn = document.createElement('button')
  closeBtn.textContent = '✕'
  closeBtn.style.background = 'none'
  closeBtn.style.border = 'none'
  closeBtn.style.color = '#ffffff'
  closeBtn.style.cursor = 'pointer'
  closeBtn.style.fontWeight = 'bold'
  closeBtn.style.fontSize = '12px'
  closeBtn.style.opacity = '0.7'
  closeBtn.onclick = () => {
    toast.style.opacity = '0'
    toast.style.transform = 'translateY(20px)'
    setTimeout(() => toast.remove(), 300)
  }

  toast.appendChild(icon)
  toast.appendChild(text)
  toast.appendChild(closeBtn)
  document.body.appendChild(toast)

  // Animate in
  setTimeout(() => {
    toast.style.opacity = '1'
    toast.style.transform = 'translateY(0)'
  }, 100)

  // Auto-dismiss after 6 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.opacity = '0'
      toast.style.transform = 'translateY(20px)'
      setTimeout(() => toast.remove(), 300)
    }
  }, 6000)
}

function handleParsedSubmission(submission: Submission): void {
  console.log('[AutoCommit] Detected accepted solution:', submission.problemTitle)
  
  // Notify background script
  chrome.runtime.sendMessage({
    type: 'NEW_SUBMISSION',
    payload: submission,
  })

  // Show user notification toast on the page
  injectToast(`AutoCommit: Solution detected! Open popup to push.`)
}

// Route to correct observer based on page hostname
const hostname = window.location.hostname

if (hostname.includes('leetcode.com')) {
  setupLeetCodeObserver(handleParsedSubmission)
} else if (hostname.includes('codeforces.com')) {
  setupCodeforcesObserver(handleParsedSubmission)
}
