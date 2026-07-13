import { readState, writeState } from '../shared/storage'
import type { Submission } from '../shared/types'

chrome.runtime.onInstalled.addListener((): void => {
  console.log('[AutoCommit] Extension installed and active')
  // Initialize badge styling
  chrome.action.setBadgeBackgroundColor({ color: '#4f46e5' })
})

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'NEW_SUBMISSION') {
    const submission = message.payload as Submission
    
    // Save to storage
    readState().then((state) => {
      const history = state?.pushHistory ?? []
      // Check if submission is already in history to deduplicate (FR-15)
      const isDuplicate = history.some((h) => h.id === submission.id)
      if (isDuplicate) {
        console.log('[AutoCommit] Submission is already pushed or processed', submission.id)
        return
      }

      writeState({ pendingSubmission: submission }).then(() => {
        // Set extension icon badge to notify user
        chrome.action.setBadgeText({ text: '1' })
        console.log('[AutoCommit] Saved pending submission:', submission.problemTitle)
      })
    }).catch((err) => {
      console.error('[AutoCommit] Failed to handle incoming submission:', err)
    })
  }

  if (message.type === 'CLEAR_PENDING') {
    writeState({ pendingSubmission: null }).then(() => {
      chrome.action.setBadgeText({ text: '' })
      console.log('[AutoCommit] Cleared pending submission')
    }).catch((err) => {
      console.error('[AutoCommit] Failed to clear pending state:', err)
    })
  }

  // Return true if async response is needed
  return false
})
