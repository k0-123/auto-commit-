import { STORAGE_KEY, STATE_VERSION } from './constants'
import type { CodePushState } from './types'
import type { StateStorage } from 'zustand/middleware'

const memory = new Map<string, string>()

const hasChromeStorage = (): boolean =>
  typeof chrome !== 'undefined' && Boolean(chrome.storage?.local)

const getLocal = (): chrome.storage.LocalStorageArea => chrome.storage.local

export const readState = (): Promise<CodePushState | null> => {
  const storage = getLocal()
  return new Promise<CodePushState | null>((resolve, reject) => {
    storage.get(STORAGE_KEY, (items) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError)
        return
      }
      const value = items[STORAGE_KEY] as CodePushState | undefined
      resolve(value ?? null)
    })
  })
}

export const writeState = (
  state: Partial<CodePushState>,
): Promise<CodePushState> => {
  const storage = getLocal()
  return new Promise<CodePushState>((resolve, reject) => {
    storage.get(STORAGE_KEY, (items) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError)
        return
      }
      const previous = (items[STORAGE_KEY] as CodePushState) ?? {
        version: STATE_VERSION,
        gitHubToken: null,
        gitHubUsername: null,
        selectedRepo: null,
        selectedBranch: null,
        folderStructure: 'platform',
        pendingSubmission: null,
        pushHistory: [],
      }
      const next: CodePushState = { ...previous, ...state, version: STATE_VERSION }
      storage.set({ [STORAGE_KEY]: next }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
          return
        }
        resolve(next)
      })
    })
  })
}

export const clearState = (): Promise<void> => {
  const storage = getLocal()
  return new Promise<void>((resolve, reject) => {
    storage.remove(STORAGE_KEY, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError)
        return
      }
      resolve()
    })
  })
}

export const chromeStateStorage: StateStorage = {
  getItem: (name) => {
    if (hasChromeStorage()) {
      return new Promise<string | null>((resolve) => {
        getLocal().get(name, (items) => {
          resolve((items[name] as string) ?? null)
        })
      })
    }
    return memory.get(name) ?? null
  },
  setItem: (name, value) => {
    if (hasChromeStorage()) {
      return new Promise<void>((resolve) => {
        getLocal().set({ [name]: value }, () => resolve())
      })
    }
    memory.set(name, value)
    return undefined
  },
  removeItem: (name) => {
    if (hasChromeStorage()) {
      return new Promise<void>((resolve) => {
        getLocal().remove(name, () => resolve())
      })
    }
    memory.delete(name)
    return undefined
  },
}
