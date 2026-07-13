export type Platform = 'leetcode' | 'codeforces'

export interface Submission {
  readonly id: string
  readonly problemTitle: string
  readonly problemSlug: string
  readonly problemUrl: string
  readonly difficulty: string
  readonly language: string
  readonly code: string
  readonly platform: Platform
  readonly timestamp: number
}

export interface PushRecord {
  readonly id: string
  readonly problemTitle: string
  readonly platform: Platform
  readonly repo: string
  readonly path: string
  readonly commitSha: string
  readonly timestamp: number
}

export interface ChromeMessage<TPayload = unknown> {
  readonly type: string
  readonly payload?: TPayload
}

export interface CodePushState {
  readonly version: number
  readonly gitHubToken: string | null
  readonly gitHubUsername: string | null
  readonly selectedRepo: string | null
  readonly selectedBranch: string | null
  readonly folderStructure: 'platform' | 'difficulty' | 'flat'
  readonly pendingSubmission: Submission | null
  readonly pushHistory: readonly PushRecord[]
}
