export function storeTokens(params: {
  access: string
  refresh: string
  username?: string
}) {
  localStorage.setItem('accessToken', params.access)
  localStorage.setItem('refreshToken', params.refresh)
  if (params.username) localStorage.setItem('username', params.username)
}

export function clearTokens() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('username')
}

export function getAccessToken() {
  return localStorage.getItem('accessToken')
}

