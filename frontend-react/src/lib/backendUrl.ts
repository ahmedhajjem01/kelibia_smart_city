export function getBackendBaseUrl() {
  // Local dev uses Django on 127.0.0.1:8000; Vercel uses same origin for the Python backend.
  const { hostname, origin } = window.location

  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname.startsWith('127.')
  ) {
    return 'http://127.0.0.1:8000'
  }

  return origin
}

export function resolveBackendUrl(path: string) {
  if (!path) return path
  if (path.startsWith('http://') || path.startsWith('https://')) return path

  const base = getBackendBaseUrl()

  if (path.startsWith('/')) return `${base}${path}`
  return `${base}/${path}`
}

