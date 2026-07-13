export interface GitHubUserProfile {
  username: string
  avatarUrl: string
}

export interface GitHubRepo {
  fullName: string
  description: string | null
}

const getHeaders = (token: string) => ({
  Accept: 'application/vnd.github.v3+json',
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
})

export async function fetchUserProfile(token: string): Promise<GitHubUserProfile> {
  const res = await fetch('https://api.github.com/user', {
    headers: getHeaders(token),
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch GitHub profile: ${res.statusText}`)
  }

  const data = await res.json() as { login: string; avatar_url: string }
  return {
    username: data.login,
    avatarUrl: data.avatar_url,
  }
}

export async function fetchUserRepos(token: string): Promise<GitHubRepo[]> {
  const res = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
    headers: getHeaders(token),
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch repositories: ${res.statusText}`)
  }

  const data = await res.json() as Array<{ full_name: string; description: string | null }>
  return data.map((r) => ({
    fullName: r.full_name,
    description: r.description,
  }))
}

export async function fetchRepoBranches(token: string, repo: string): Promise<string[]> {
  const res = await fetch(`https://api.github.com/repos/${repo}/branches`, {
    headers: getHeaders(token),
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch branches: ${res.statusText}`)
  }

  const data = await res.json() as Array<{ name: string }>
  return data.map((b) => b.name)
}

export async function getFileSha(
  token: string,
  repo: string,
  branch: string,
  path: string,
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`,
      {
        headers: getHeaders(token),
      },
    )

    if (res.status === 404) {
      return null
    }

    if (!res.ok) {
      throw new Error(`Failed to fetch file details: ${res.statusText}`)
    }

    const data = await res.json() as { sha: string }
    return data.sha
  } catch {
    return null
  }
}

/**
 * Encodes a string to Base64 safely handling Unicode/UTF-8 characters.
 */
function safeBtoa(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
}

export async function pushFileToGitHub(
  token: string,
  repo: string,
  branch: string,
  path: string,
  content: string,
  commitMessage: string,
  sha: string | null,
): Promise<string> {
  const body: Record<string, unknown> = {
    message: commitMessage,
    content: safeBtoa(content),
    branch,
  }

  if (sha) {
    body.sha = sha
  }

  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errorDetails = await res.text()
    throw new Error(`Failed to push file to GitHub: ${res.statusText}. Details: ${errorDetails}`)
  }

  const data = await res.json() as { commit: { sha: string } }
  return data.commit.sha
}
