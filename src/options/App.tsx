import React, { useEffect, useState } from 'react'
import { readState, writeState } from '../shared/storage'

export default function App(): JSX.Element {
  const [token, setToken] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null)
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null)
  const [folderStructure, setFolderStructure] = useState<'platform' | 'difficulty' | 'flat'>('platform')
  const [historyCount, setHistoryCount] = useState(0)

  useEffect(() => {
    loadState()
  }, [])

  const loadState = async () => {
    const state = await readState()
    if (state) {
      setToken(state.gitHubToken)
      setUsername(state.gitHubUsername)
      setSelectedRepo(state.selectedRepo)
      setSelectedBranch(state.selectedBranch)
      setFolderStructure(state.folderStructure ?? 'platform')
      setHistoryCount(state.pushHistory?.length ?? 0)
    }
  }

  const handleDisconnect = async () => {
    await writeState({
      gitHubToken: null,
      gitHubUsername: null,
      selectedRepo: null,
      selectedBranch: null,
      pendingSubmission: null,
    })
    setToken(null)
    setUsername(null)
    setSelectedRepo(null)
    setSelectedBranch(null)
  }

  const handleFolderStructureChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as 'platform' | 'difficulty' | 'flat'
    setFolderStructure(value)
    await writeState({ folderStructure: value })
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-150 p-8 shadow-sm">
        
        {/* Header */}
        <div className="border-b border-slate-100 pb-6 mb-8 flex items-center gap-3">
          <img
            src="/icons/logo.png"
            alt="AutoCommit Logo"
            className="h-10 w-10 rounded-xl shadow-sm border border-slate-100 object-cover"
          />
          <div>
            <h1 className="text-xl font-bold text-slate-800">AutoCommit Settings</h1>
            <p className="text-sm text-slate-500 mt-1">Configure your competitive programming syncing pipeline</p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* GitHub Status */}
          <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-100">
            <h2 className="text-sm font-bold text-slate-800 mb-3">GitHub Integration</h2>
            {token ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Connected account</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">@{username}</p>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100 hover:border-rose-300 transition-all"
                >
                  Disconnect GitHub
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Not connected. Open the extension popup in your browser toolbar to connect your GitHub account.
              </p>
            )}
          </div>

          {/* Repo & Path Options */}
          {token && (
            <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-100 space-y-4">
              <h2 className="text-sm font-bold text-slate-800">Sync Settings</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 font-medium">Target Repository</p>
                  <p className="text-xs font-bold text-slate-700 mt-1">{selectedRepo || 'None selected'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Target Branch</p>
                  <p className="text-xs font-bold text-slate-700 mt-1">{selectedBranch || 'None selected'}</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600">Repository Folder Structure</label>
                <select
                  value={folderStructure}
                  onChange={handleFolderStructureChange}
                  className="w-full sm:w-64 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-brand transition-all"
                >
                  <option value="platform">Platform name first (e.g. leetcode/TwoSum.py)</option>
                  <option value="difficulty">Problem difficulty first (e.g. Easy/TwoSum.py)</option>
                  <option value="flat">Flat folder (e.g. TwoSum.py)</option>
                </select>
                <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
                  Select the path format used when saving code files to your repository.
                </p>
              </div>
            </div>
          )}

          {/* Storage & Local Data Details */}
          <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-100 space-y-3">
            <h2 className="text-sm font-bold text-slate-800">Local Data Details</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              AutoCommit stores all access credentials and history locally in your browser's extension database. No code or metadata is sent to any external server other than GitHub's API.
            </p>
            <div className="border-t border-slate-100 pt-3 flex justify-between text-xs text-slate-600">
              <span>Local push records tracked:</span>
              <span className="font-bold text-slate-800">{historyCount} records</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 mt-8 pt-6 text-center">
          <p className="text-xs text-slate-400">AutoCommit Extension v1.0.0 — Licensed under MIT</p>
        </div>
      </div>
    </div>
  )
}
