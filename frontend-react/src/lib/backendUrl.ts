export function getBackendBaseUrl() {
  // Local dev: Use relative paths so Vite proxy works. 
  // Production (Vercel): Use origin because backend is served on the same domain.
  const { hostname, origin } = window.location

  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname.startsWith('127.')
  ) {
    return '' 
  }

  return origin
}

export function resolveBackendUrl(path: string) {
  if (!path) return path

  // DRF Serializers return absolute URLs (e.g. http://localhost:8000/media/...)
  // We strip the domain and keep only the relative path so Vite proxy handles it correctly!
  try {
    const parsed = new URL(path)
    if (parsed.pathname.startsWith('/media/')) {
      return parsed.pathname
    }
  } catch (e) {
    // Not a valid absolute URL, continue
  }

  if (path.startsWith('http://') || path.startsWith('https://')) return path

  // En local, on peut aussi forcer le passage par le proxy plutôt que l'accès direct
  if (path.startsWith('/media/')) return path

  const base = getBackendBaseUrl()
  
  if (path.startsWith('/')) return `${base}${path}`
  return `${base}/${path}`
}

