export const EXTENSION_NAME = 'AutoCommit' as const

export const STORAGE_KEY = 'codepush_extension_state' as const

export const STATE_VERSION = 1 as const

export const DEFAULT_POPUP_SIZE = {
  width: 420,
  height: 580,
} as const

export const LANGUAGE_EXTENSIONS: Record<string, string> = {
  python: 'py',
  python3: 'py',
  cpp: 'cpp',
  c: 'c',
  java: 'java',
  javascript: 'js',
  typescript: 'ts',
  rust: 'rs',
  go: 'go',
  kotlin: 'kt',
  swift: 'swift',
  ruby: 'rb',
  scala: 'scala',
  csharp: 'cs',
  php: 'php',
} as const
