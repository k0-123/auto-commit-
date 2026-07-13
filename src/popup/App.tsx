import React, { useEffect, useState } from 'react'
import { readState, writeState } from '../shared/storage'
import { fetchUserProfile, fetchUserRepos, fetchRepoBranches, getFileSha, pushFileToGitHub } from '../shared/github-api'
import { LANGUAGE_EXTENSIONS } from '../shared/constants'
import type { Submission, PushRecord } from '../shared/types'

export default function App(): JSX.Element {
  // Config & State
  const [token, setToken] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [repos, setRepos] = useState<Array<{ fullName: string }>>([])
  const [branches, setBranches] = useState<string[]>([])
  
  const [selectedRepo, setSelectedRepo] = useState<string>('')
  const [selectedBranch, setSelectedBranch] = useState<string>('main')
  const [folderStructure, setFolderStructure] = useState<'platform' | 'difficulty' | 'flat'>('platform')
  
  const [pendingSubmission, setPendingSubmission] = useState<Submission | null>(null)
  const [pushHistory, setPushHistory] = useState<readonly PushRecord[]>([])

  // Tracker & Competitive States
  const [solvedLeetcode, setSolvedLeetcode] = useState(0)
  const [solvedCodeforces, setSolvedCodeforces] = useState(0)
  const [baseLeetcode, setBaseLeetcode] = useState(0)
  const [baseCodeforces, setBaseCodeforces] = useState(0)
  const [dailyGoal, setDailyGoal] = useState(3)
  const [dailyStreak, setDailyStreak] = useState(0)
  const [solvedToday, setSolvedToday] = useState(0)
  const [lastActiveDay, setLastActiveDay] = useState('')
  const [activeTab, setActiveTab] = useState<'sync' | 'tracker'>('sync')

  // Stats Settings Input States
  const [showStatsSettings, setShowStatsSettings] = useState(false)
  const [leetcodeBaseInput, setLeetcodeBaseInput] = useState('0')
  const [codeforcesBaseInput, setCodeforcesBaseInput] = useState('0')
  const [goalInput, setGoalInput] = useState('3')

  const handleSaveStatsSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    const lBase = Math.max(0, parseInt(leetcodeBaseInput) || 0)
    const cBase = Math.max(0, parseInt(codeforcesBaseInput) || 0)
    const dGoal = Math.max(1, parseInt(goalInput) || 3)

    setBaseLeetcode(lBase)
    setBaseCodeforces(cBase)
    setDailyGoal(dGoal)
    setShowStatsSettings(false)

    await writeState({
      baseLeetcode: lBase,
      baseCodeforces: cBase,
      dailyGoal: dGoal,
    })
    setSuccessMessage('Grind stats updated successfully!')
  }

  // UI States
  const [patInput, setPatInput] = useState('')
  const [commitMessage, setCommitMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showManualForm, setShowManualForm] = useState(false)
  const [isCodeExpanded, setIsCodeExpanded] = useState(false)

  // Manual Form States
  const [manualTitle, setManualTitle] = useState('')
  const [manualUrl, setManualUrl] = useState('')
  const [manualCode, setManualCode] = useState('')
  const [manualLang, setManualLang] = useState('python3')
  const [manualPlatform, setManualPlatform] = useState<'leetcode' | 'codeforces'>('leetcode')
  const [manualDifficulty, setManualDifficulty] = useState('Easy')

  // Load state on mount
  useEffect(() => {
    loadStorageState()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadStorageState = async () => {
    try {
      const state = await readState()
      if (state) {
        setToken(state.gitHubToken)
        setUsername(state.gitHubUsername)
        setPushHistory(state.pushHistory ?? [])
        setPendingSubmission(state.pendingSubmission)
        setFolderStructure(state.folderStructure ?? 'platform')
        
        if (state.selectedRepo) {
          setSelectedRepo(state.selectedRepo)
        }
        if (state.selectedBranch) {
          setSelectedBranch(state.selectedBranch)
        }

        if (state.pendingSubmission) {
          setCommitMessage(`feat: solve ${state.pendingSubmission.problemTitle} (${state.pendingSubmission.platform})`)
        }

        // Streak Calculation
        const todayStr = new Date().toLocaleDateString('sv')
        let currentStreak = state.dailyStreak ?? 0
        let currentSolvedToday = state.solvedToday ?? 0

        if (state.lastActiveDay && state.lastActiveDay !== todayStr) {
          const lastActive = new Date(state.lastActiveDay)
          const today = new Date(todayStr)
          const diffTime = Math.abs(today.getTime() - lastActive.getTime())
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          
          if (diffDays > 1) {
            currentStreak = 0 // Streak broken
          }
          currentSolvedToday = 0 // Reset daily solved count for new day
          
          await writeState({
            dailyStreak: currentStreak,
            solvedToday: currentSolvedToday,
            lastActiveDay: todayStr
          })
        }

        setSolvedLeetcode(state.solvedCountLeetcode ?? 0)
        setSolvedCodeforces(state.solvedCountCodeforces ?? 0)
        setBaseLeetcode(state.baseLeetcode ?? 0)
        setBaseCodeforces(state.baseCodeforces ?? 0)
        setDailyGoal(state.dailyGoal ?? 3)
        setDailyStreak(currentStreak)
        setSolvedToday(currentSolvedToday)
        setLastActiveDay(state.lastActiveDay || todayStr)

        setLeetcodeBaseInput(String(state.baseLeetcode ?? 0))
        setCodeforcesBaseInput(String(state.baseCodeforces ?? 0))
        setGoalInput(String(state.dailyGoal ?? 3))

        if (state.gitHubToken) {
          loadGitHubDetails(state.gitHubToken, state.selectedRepo)
        }
      }
    } catch (e) {
      setErrorMessage('Failed to load storage state')
    }
  }

  const loadGitHubDetails = async (ghToken: string, currentRepo: string | null) => {
    setIsLoading(true)
    try {
      const profile = await fetchUserProfile(ghToken)
      setUsername(profile.username)
      setAvatarUrl(profile.avatarUrl)

      const repoList = await fetchUserRepos(ghToken)
      setRepos(repoList)

      if (currentRepo) {
        const branchList = await fetchRepoBranches(ghToken, currentRepo)
        setBranches(branchList)
      }
    } catch (e) {
      setErrorMessage('GitHub token is invalid or expired. Please reconnect.')
      setToken(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnectGitHub = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patInput.trim()) return

    setIsLoading(true)
    setErrorMessage(null)
    try {
      const profile = await fetchUserProfile(patInput)
      const repoList = await fetchUserRepos(patInput)
      
      setToken(patInput)
      setUsername(profile.username)
      setAvatarUrl(profile.avatarUrl)
      setRepos(repoList)

      await writeState({
        gitHubToken: patInput,
        gitHubUsername: profile.username,
      })
      setSuccessMessage('Successfully connected to GitHub!')
    } catch (e) {
      setErrorMessage('Connection failed. Verify your Personal Access Token (PAT).')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRepoChange = async (repoName: string) => {
    setSelectedRepo(repoName)
    if (!token) return

    setIsLoading(true)
    try {
      const branchList = await fetchRepoBranches(token, repoName)
      setBranches(branchList)
      const defaultBranch = branchList.includes('main') ? 'main' : branchList[0] || 'master'
      setSelectedBranch(defaultBranch)
      
      await writeState({
        selectedRepo: repoName,
        selectedBranch: defaultBranch,
      })
    } catch (e) {
      setErrorMessage('Failed to load branches for the selected repository.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBranchChange = async (branchName: string) => {
    setSelectedBranch(branchName)
    await writeState({ selectedBranch: branchName })
  }

  const handleFolderStructureChange = async (structure: 'platform' | 'difficulty' | 'flat') => {
    setFolderStructure(structure)
    await writeState({ folderStructure: structure })
  }

  const handleDisconnect = async () => {
    setIsLoading(true)
    try {
      await writeState({
        gitHubToken: null,
        gitHubUsername: null,
        selectedRepo: null,
        selectedBranch: null,
        pendingSubmission: null,
        solvedCountLeetcode: 0,
        solvedCountCodeforces: 0,
        baseLeetcode: 0,
        baseCodeforces: 0,
        dailyGoal: 3,
        dailyStreak: 0,
        lastActiveDay: '',
        solvedToday: 0,
      })
      setToken(null)
      setUsername(null)
      setAvatarUrl(null)
      setSelectedRepo('')
      setSelectedBranch('main')
      setPendingSubmission(null)
      setSolvedLeetcode(0)
      setSolvedCodeforces(0)
      setBaseLeetcode(0)
      setBaseCodeforces(0)
      setDailyGoal(3)
      setDailyStreak(0)
      setSolvedToday(0)
      setLastActiveDay('')
      setSuccessMessage('Disconnected from GitHub')
    } catch {
      setErrorMessage('Failed to disconnect cleanly')
    } finally {
      setIsLoading(false)
    }
  }

  const getPushPath = (sub: Submission): string => {
    const ext = LANGUAGE_EXTENSIONS[sub.language] || 'txt'
    const fileName = `${sub.problemTitle.replace(/\s+/g, '')}.${ext}`
    
    if (folderStructure === 'platform') {
      return `${sub.platform}/${fileName}`
    } else if (folderStructure === 'difficulty') {
      const formattedDiff = sub.difficulty.replace(/\s+/g, '')
      return `${formattedDiff}/${fileName}`
    }
    return fileName
  }

  const handlePush = async () => {
    if (!token || !selectedRepo || !selectedBranch || !pendingSubmission) return

    setIsLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    const path = getPushPath(pendingSubmission)
    try {
      // 1. Check for existing file SHA for safe conflict handling (FR-10 / FR-11)
      const sha = await getFileSha(token, selectedRepo, selectedBranch, path)

      // 2. Push file to GitHub
      const fileHeader = `/*\n * Problem: ${pendingSubmission.problemTitle}\n * Difficulty: ${pendingSubmission.difficulty}\n * Link: ${pendingSubmission.problemUrl}\n * Platform: ${pendingSubmission.platform.toUpperCase()}\n */\n\n`
      const completeCode = fileHeader + pendingSubmission.code

      const commitSha = await pushFileToGitHub(
        token,
        selectedRepo,
        selectedBranch,
        path,
        completeCode,
        commitMessage,
        sha
      )

      // 3. Save to History
      const newRecord: PushRecord = {
        id: pendingSubmission.id,
        problemTitle: pendingSubmission.problemTitle,
        platform: pendingSubmission.platform,
        repo: selectedRepo,
        path,
        commitSha,
        timestamp: Date.now(),
      }

      const updatedHistory = [newRecord, ...pushHistory].slice(0, 10)
      setPushHistory(updatedHistory)

      // Calculate solved counts, streaks, etc.
      const isLeetcode = pendingSubmission.platform === 'leetcode'
      const newSolvedLeetcode = isLeetcode ? solvedLeetcode + 1 : solvedLeetcode
      const newSolvedCodeforces = !isLeetcode ? solvedCodeforces + 1 : solvedCodeforces

      const todayStr = new Date().toLocaleDateString('sv')
      let newSolvedToday = solvedToday + 1
      let newStreak = dailyStreak

      if (lastActiveDay !== todayStr) {
        newSolvedToday = 1
        if (lastActiveDay) {
          const lastActive = new Date(lastActiveDay)
          const today = new Date(todayStr)
          const diffTime = Math.abs(today.getTime() - lastActive.getTime())
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          
          if (diffDays === 1) {
            newStreak += 1 // Increment streak
          } else {
            newStreak = 1 // Reset streak
          }
        } else {
          newStreak = 1
        }
      } else {
        if (solvedToday === 0) {
          newStreak = dailyStreak === 0 ? 1 : dailyStreak
        }
      }

      setSolvedLeetcode(newSolvedLeetcode)
      setSolvedCodeforces(newSolvedCodeforces)
      setSolvedToday(newSolvedToday)
      setDailyStreak(newStreak)
      setLastActiveDay(todayStr)

      await writeState({
        pushHistory: updatedHistory,
        pendingSubmission: null,
        solvedCountLeetcode: newSolvedLeetcode,
        solvedCountCodeforces: newSolvedCodeforces,
        solvedToday: newSolvedToday,
        dailyStreak: newStreak,
        lastActiveDay: todayStr,
      })

      // 4. Reset badge alerts in background script
      chrome.runtime.sendMessage({ type: 'CLEAR_PENDING' })
      setPendingSubmission(null)
      setSuccessMessage(`Successfully pushed to ${selectedRepo}!`)
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Push failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    chrome.runtime.sendMessage({ type: 'CLEAR_PENDING' })
    setPendingSubmission(null)
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualTitle.trim() || !manualCode.trim()) return

    const sub: Submission = {
      id: `manual_${Date.now()}`,
      problemTitle: manualTitle.trim(),
      problemSlug: manualTitle.toLowerCase().replace(/\s+/g, '-'),
      problemUrl: manualUrl.trim() || 'https://github.com',
      difficulty: manualDifficulty,
      language: manualLang,
      code: manualCode,
      platform: manualPlatform,
      timestamp: Date.now(),
    }

    setPendingSubmission(sub)
    setCommitMessage(`feat: solve ${sub.problemTitle} (${sub.platform})`)
    setShowManualForm(false)
    
    // Clear manual inputs
    setManualTitle('')
    setManualUrl('')
    setManualCode('')
  }

  // Helper colors for difficulty pills
  const getDifficultyColor = (diff: string): string => {
    const d = diff.toLowerCase()
    if (d.includes('easy') || d === '800' || d === '900') return 'bg-emerald-50 text-emerald-700 border-emerald-250'
    if (d.includes('medium') || parseInt(d) < 1500) return 'bg-amber-50 text-amber-700 border-amber-250'
    return 'bg-rose-50 text-rose-700 border-rose-250'
  }

  // Milestones & Calculations
  const userLeetcodeTotal = solvedLeetcode + baseLeetcode
  const userCodeforcesTotal = solvedCodeforces + baseCodeforces
  const totalSolved = userLeetcodeTotal + userCodeforcesTotal

  // Peer Comparison Level & Next Milestone
  let levelName = 'Newbie Solver'
  let nextMilestoneName = 'Casual Solver'
  let nextMilestoneSolved = 50
  let levelColor = 'text-slate-600'
  let levelBg = 'bg-slate-50 border-slate-200'

  if (totalSolved >= 1000) {
    levelName = 'God Level / Grandmaster'
    nextMilestoneName = 'Absolute Peak'
    nextMilestoneSolved = 2000
    levelColor = 'text-rose-600'
    levelBg = 'bg-rose-50 border-rose-200'
  } else if (totalSolved >= 500) {
    levelName = 'Advanced Doer (FAANG Ready)'
    nextMilestoneName = 'Grandmaster'
    nextMilestoneSolved = 1000
    levelColor = 'text-amber-600'
    levelBg = 'bg-amber-50 border-amber-200'
  } else if (totalSolved >= 200) {
    levelName = 'Good Grinder (Junior Eng)'
    nextMilestoneName = 'Advanced Doer'
    nextMilestoneSolved = 500
    levelColor = 'text-indigo-600'
    levelBg = 'bg-indigo-50 border-indigo-200'
  } else if (totalSolved >= 50) {
    levelName = 'Casual Solver'
    nextMilestoneName = 'Good Grinder'
    nextMilestoneSolved = 200
    levelColor = 'text-emerald-600'
    levelBg = 'bg-emerald-50 border-emerald-250'
  }

  // Calculate percentage to next milestone
  const prevMilestoneSolved = totalSolved >= 1000 ? 1000 : (totalSolved >= 500 ? 500 : (totalSolved >= 200 ? 200 : (totalSolved >= 50 ? 50 : 0)))
  const milestoneRange = nextMilestoneSolved - prevMilestoneSolved
  const milestoneProgress = totalSolved - prevMilestoneSolved
  const progressPercentage = Math.min(100, Math.max(0, (milestoneProgress / milestoneRange) * 100))

  return (
    <main className="flex h-[580px] w-[420px] flex-col bg-slate-50 text-slate-800 antialiased font-sans">
      {/* Header Bar */}
      <header className="shrink-0 bg-white border-b border-slate-100 px-5 py-3.5 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
        <div className="flex items-center gap-2.5">
          <img
            src="/icons/logo.png"
            alt="AutoCommit Logo"
            className="h-9 w-9 rounded-xl shadow-sm border border-slate-100 object-cover"
          />
          <div className="flex flex-col">
            <h1 className="text-sm font-bold text-slate-800 leading-none">AutoCommit</h1>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5">Competitive Programming → GitHub</span>
          </div>
        </div>

        {token && username && (
          <div className="flex items-center gap-2.5">
            {avatarUrl && (
              <img
                src={avatarUrl}
                alt={username}
                className="h-6 w-6 rounded-full border border-slate-200"
              />
            )}
            <button
              onClick={handleDisconnect}
              className="text-[10px] font-bold text-slate-400 hover:text-rose-600 transition-colors uppercase tracking-wider"
            >
              Disconnect
            </button>
          </div>
        )}
      </header>

      {/* Tab Switcher */}
      {token && (
        <div className="shrink-0 bg-white border-b border-slate-100 flex px-4">
          <button
            onClick={() => setActiveTab('sync')}
            className={`flex-1 text-center pb-2 pt-2.5 text-xs font-bold tracking-wide transition-all border-b-2 ${
              activeTab === 'sync'
                ? 'border-brand text-brand font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-500'
            }`}
          >
            Workspace
          </button>
          <button
            onClick={() => setActiveTab('tracker')}
            className={`flex-1 text-center pb-2 pt-2.5 text-xs font-bold tracking-wide transition-all border-b-2 ${
              activeTab === 'tracker'
                ? 'border-brand text-brand font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-500'
            }`}
          >
            Grind Arena
          </button>
        </div>
      )}

      {/* Main Panel */}
      <section className="flex-1 min-h-0 flex flex-col p-4 gap-4 overflow-y-auto">
        {errorMessage && (
          <div className="shrink-0 rounded-xl bg-rose-50 border border-rose-200/50 p-3 text-center text-xs text-rose-600 font-medium">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="shrink-0 rounded-xl bg-emerald-50 border border-emerald-250/50 p-3 text-center text-xs text-emerald-700 font-medium">
            {successMessage}
          </div>
        )}

        {/* 1. Connect GitHub View */}
        {!token && (
          <div className="flex flex-col gap-4 bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800">Connect your GitHub Portfolio</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              CodePush connects to your GitHub profile to securely commit accepted solutions to your repositories.
            </p>
            <form onSubmit={handleConnectGitHub} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Personal Access Token (PAT)
                </label>
                <input
                  type="password"
                  value={patInput}
                  onChange={(e) => setPatInput(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxx"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-brand py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-dark transition-all disabled:opacity-50"
              >
                {isLoading ? 'Connecting...' : 'Connect to GitHub'}
              </button>
            </form>
            <div className="text-[11px] text-slate-400 text-center leading-relaxed">
              Don't have a token?{' '}
              <a
                href="https://github.com/settings/tokens/new?scopes=repo"
                target="_blank"
                rel="noreferrer"
                className="text-brand hover:underline font-semibold"
              >
                Create a classic PAT with 'repo' scope
              </a>
            </div>
          </div>
        )}

        {/* 2. Repository Configuration View */}
        {token && !selectedRepo && (
          <div className="flex flex-col gap-4 bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800">Select Target Repository</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Select which repository you would like CodePush to save your competitive programming submissions in.
            </p>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Choose Repository
                </label>
                <select
                  value={selectedRepo}
                  onChange={(e) => handleRepoChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-brand transition-all"
                >
                  <option value="">-- Select a repository --</option>
                  {repos.map((repo) => (
                    <option key={repo.fullName} value={repo.fullName}>
                      {repo.fullName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* 3. Main views (Workspace / Tracker) */}
        {token && selectedRepo && (
          <>
            {activeTab === 'sync' ? (
              <>
                {/* Folder settings panel */}
                <div className="bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Location</span>
                      <span className="text-xs font-bold text-slate-700 mt-0.5 truncate" title={selectedRepo}>
                        {selectedRepo}
                      </span>
                    </div>
                    
                    {/* Branch selector */}
                    <select
                      value={selectedBranch}
                      onChange={(e) => handleBranchChange(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 outline-none shrink-0 min-w-[90px]"
                    >
                      {branches.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Folder structure selection */}
                  <div className="border-t border-slate-50 pt-2.5 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Folder Format</span>
                    <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/50 shrink-0">
                      {(['platform', 'difficulty', 'flat'] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleFolderStructureChange(s)}
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold capitalize transition-all ${
                            folderStructure === s
                              ? 'bg-white text-slate-800 shadow-sm'
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Pending submission module */}
                {pendingSubmission ? (
                  <div className="bg-white border border-slate-150/70 rounded-xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.02)] flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-start justify-between gap-2 border-b border-slate-50 pb-3">
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-[10px] font-bold text-brand uppercase tracking-wider flex items-center gap-1">
                          <span>🎉</span> Detected Solution
                        </span>
                        <a
                          href={pendingSubmission.problemUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-bold text-slate-800 hover:text-brand hover:underline break-words"
                        >
                          {pendingSubmission.problemTitle}
                        </a>
                        
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[10px] text-slate-400 capitalize font-bold">
                            {pendingSubmission.platform}
                          </span>
                          <span className="text-slate-300 text-[10px]">•</span>
                          <span className="text-[10px] text-slate-400 capitalize font-bold">
                            {pendingSubmission.language}
                          </span>
                          <span className="text-slate-300 text-[10px]">•</span>
                          <span className={`rounded px-1.5 py-0.2 text-[9px] font-bold border ${getDifficultyColor(pendingSubmission.difficulty)}`}>
                            {pendingSubmission.difficulty}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Code Previewer */}
                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsCodeExpanded(!isCodeExpanded)}
                        className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-colors"
                      >
                        <span>Solution Code</span>
                        <span>{isCodeExpanded ? 'Collapse ▲' : 'Expand ▼'}</span>
                      </button>
                      <pre className={`w-full rounded-lg bg-slate-900 p-3 font-mono text-[11px] text-slate-200 overflow-x-auto border border-slate-950 ${
                        isCodeExpanded ? 'max-h-[220px]' : 'max-h-[80px]'
                      } transition-all duration-200`}>
                        <code>{pendingSubmission.code}</code>
                      </pre>
                    </div>

                    {/* Commit message input */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Commit Message
                      </label>
                      <input
                        type="text"
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                        placeholder="Commit message"
                        className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all"
                      />
                      <div className="text-[9px] text-slate-400 mt-0.5">
                        Target Path: <code className="font-mono">{getPushPath(pendingSubmission)}</code>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-1 border-t border-slate-50">
                      <button
                        type="button"
                        onClick={handleSkip}
                        className="flex-1 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all"
                      >
                        Discard
                      </button>
                      <button
                        type="button"
                        onClick={handlePush}
                        disabled={isLoading}
                        className="flex-1 rounded-lg bg-brand py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-dark transition-all disabled:opacity-50"
                      >
                        {isLoading ? 'Pushing...' : 'Push to GitHub'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* All Caught Up Empty State */
                  <div className="bg-white border border-slate-100 rounded-xl p-6 text-center shadow-sm flex flex-col items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-brand text-lg">
                      🍵
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-700">All caught up!</h3>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-[240px] leading-relaxed">
                        Submit code on LeetCode or Codeforces to trigger automatic push alerts, or paste code manually.
                      </p>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => setShowManualForm(!showManualForm)}
                      className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all mt-1"
                    >
                      {showManualForm ? 'Hide Manual Form' : 'Manual Paste Push'}
                    </button>
                  </div>
                )}

                {/* Manual Form Entry Panel */}
                {showManualForm && !pendingSubmission && (
                  <form
                    onSubmit={handleManualSubmit}
                    className="bg-white border border-slate-150 rounded-xl p-4 shadow-sm flex flex-col gap-3 animate-in fade-in duration-200"
                  >
                    <h3 className="text-xs font-bold text-slate-800">Manual Push</h3>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Title</label>
                        <input
                          type="text"
                          value={manualTitle}
                          onChange={(e) => setManualTitle(e.target.value)}
                          placeholder="e.g. Two Sum"
                          className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs outline-none focus:border-brand"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Difficulty</label>
                        <input
                          type="text"
                          value={manualDifficulty}
                          onChange={(e) => setManualDifficulty(e.target.value)}
                          placeholder="e.g. Medium or 1200"
                          className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs outline-none focus:border-brand"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Problem Link (Optional)</label>
                      <input
                        type="url"
                        value={manualUrl}
                        onChange={(e) => setManualUrl(e.target.value)}
                        placeholder="https://leetcode.com/problems/..."
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs outline-none focus:border-brand"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Platform</label>
                        <select
                          value={manualPlatform}
                          onChange={(e) => setManualPlatform(e.target.value as 'leetcode' | 'codeforces')}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none"
                        >
                          <option value="leetcode">LeetCode</option>
                          <option value="codeforces">Codeforces</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Language</label>
                        <select
                          value={manualLang}
                          onChange={(e) => setManualLang(e.target.value)}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none"
                        >
                          {Object.keys(LANGUAGE_EXTENSIONS).map((lang) => (
                            <option key={lang} value={lang}>
                              {lang}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Code Content</label>
                      <textarea
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        placeholder="Paste solution code here..."
                        rows={4}
                        className="rounded-lg border border-slate-200 p-2.5 text-xs font-mono outline-none focus:border-brand resize-none"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full rounded-lg bg-brand py-2 text-xs font-semibold text-white hover:bg-brand-dark transition-all"
                    >
                      Load Solution Preview
                    </button>
                  </form>
                )}

                {/* Push History logs */}
                {pushHistory.length > 0 && (
                  <div className="flex flex-col gap-2 bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recent Pushes</span>
                    <div className="flex flex-col gap-2 mt-1 division-y division-slate-50">
                      {pushHistory.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-xs py-1">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-700">{item.problemTitle}</span>
                            <span className="text-[9px] text-slate-400 mt-0.5">
                              {item.platform.toUpperCase()} → {item.path}
                            </span>
                          </div>
                          <a
                            href={`https://github.com/${item.repo}/commit/${item.commitSha}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-bold text-brand hover:underline shrink-0 ml-4"
                          >
                            {item.commitSha.slice(0, 7)}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Tracker view (Grind Arena) */
              <div className="flex flex-col gap-4 animate-in fade-in duration-300">
                
                {/* Daily Streak Banner */}
                <div className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 text-white rounded-2xl p-4 shadow-md flex items-center justify-between border border-indigo-400/20">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-200">Daily Streak</span>
                    <span className="text-xl font-black mt-1 flex items-center gap-1.5">
                      <span>🔥</span> {dailyStreak} Day{dailyStreak === 1 ? '' : 's'}
                    </span>
                    <span className="text-[10px] text-indigo-100 mt-1 font-medium leading-tight">
                      {solvedToday >= dailyGoal 
                        ? 'Daily target complete! You are a beast.'
                        : `Solve ${dailyGoal - solvedToday} more to keep your streak.`}
                    </span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2 flex flex-col items-center justify-center min-w-[70px]">
                    <span className="text-[8px] font-bold uppercase tracking-widest text-indigo-100">Progress</span>
                    <span className="text-base font-extrabold mt-0.5">{solvedToday}/{dailyGoal}</span>
                    <span className="text-[8px] font-medium text-indigo-200 mt-0.5">Today</span>
                  </div>
                </div>

                {/* Solved Stats Board */}
                <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm grid grid-cols-2 gap-4">
                  <div className="flex flex-col border-r border-slate-100 pr-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                      LeetCode Solved
                    </div>
                    <div className="text-lg font-black text-slate-800 mt-1.5 leading-none">
                      {userLeetcodeTotal}
                    </div>
                    <span className="text-[9px] text-slate-400 font-medium mt-1">
                      ({solvedLeetcode} synced + {baseLeetcode} base)
                    </span>
                  </div>
                  <div className="flex flex-col pl-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span className="h-2 w-2 rounded-full bg-teal-500"></span>
                      Codeforces Solved
                    </div>
                    <div className="text-lg font-black text-slate-800 mt-1.5 leading-none">
                      {userCodeforcesTotal}
                    </div>
                    <span className="text-[9px] text-slate-400 font-medium mt-1">
                      ({solvedCodeforces} synced + {baseCodeforces} base)
                    </span>
                  </div>
                </div>

                {/* Milestone Progress Bar */}
                <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Milestone Arena</span>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border ${levelBg} ${levelColor}`}>
                      {levelName}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>Milestone Progress</span>
                      <span className="text-brand text-xs font-extrabold">{totalSolved} / {nextMilestoneSolved} solved</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                      <div 
                        className="bg-brand h-full rounded-full transition-all duration-500" 
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-400 font-bold mt-0.5">
                      <span>Current: {prevMilestoneSolved}</span>
                      <span>Next Level: {nextMilestoneSolved} ({nextMilestoneName})</span>
                    </div>
                  </div>

                  {/* Benchmark comparison list */}
                  <div className="border-t border-slate-100 pt-3 mt-1 flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">LeetCode Benchmark Comparison</span>
                    <div className="flex flex-col gap-2">
                      {[
                        { name: 'Elite Doer (Top 1% Solver)', count: 1000, desc: 'God level logic builder' },
                        { name: 'Advanced Doer (FAANG Ready)', count: 500, desc: 'Advanced mock & system designer' },
                        { name: 'Good Grinder (Typical Intern)', count: 200, desc: 'Proficient code practitioner' },
                        { name: 'Casual Solver (Average)', count: 50, desc: 'Standard beginner solver' }
                      ].map((peer) => {
                        const isUserAbove = totalSolved >= peer.count
                        return (
                          <div key={peer.name} className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                            isUserAbove 
                              ? 'bg-emerald-50/40 border-emerald-100/50 text-emerald-800' 
                              : 'bg-slate-50/50 border-slate-100 text-slate-500'
                          }`}>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold truncate">{peer.name}</span>
                              <span className="text-[9px] text-slate-400 truncate font-medium mt-0.5">{peer.desc}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 ml-3">
                              <span className="text-xs font-black">{peer.count}+</span>
                              {isUserAbove ? (
                                <span className="text-emerald-600 font-extrabold text-[10px]">✓ Beats</span>
                              ) : (
                                <span className="text-slate-400 font-bold text-[9px]">{peer.count - totalSolved} left</span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Adjust Stats Panel */}
                <div className="bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowStatsSettings(!showStatsSettings)}
                    className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-colors"
                  >
                    <span>Adjust Base Stats & Target</span>
                    <span>{showStatsSettings ? 'Hide Settings ▲' : 'Edit Settings ▼'}</span>
                  </button>

                  {showStatsSettings && (
                    <form onSubmit={handleSaveStatsSettings} className="flex flex-col gap-3 border-t border-slate-100 pt-3 mt-1 animate-in fade-in duration-200">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">LeetCode Base Solved</label>
                          <input
                            type="number"
                            min="0"
                            value={leetcodeBaseInput}
                            onChange={(e) => setLeetcodeBaseInput(e.target.value)}
                            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-brand"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Codeforces Base Solved</label>
                          <input
                            type="number"
                            min="0"
                            value={codeforcesBaseInput}
                            onChange={(e) => setCodeforcesBaseInput(e.target.value)}
                            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-brand"
                          />
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Daily Target (Problems)</label>
                        <input
                          type="number"
                          min="1"
                          value={goalInput}
                          onChange={(e) => setGoalInput(e.target.value)}
                          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-brand w-full"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full rounded-lg bg-brand py-2 text-xs font-semibold text-white hover:bg-brand-dark transition-all"
                      >
                        Save Changes
                      </button>
                    </form>
                  )}
                </div>

              </div>
            )}
          </>
        )}
      </section>
    </main>
  )
}
