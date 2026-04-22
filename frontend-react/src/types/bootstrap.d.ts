export {}

type BootstrapModalInstance = {
  show: () => void
  hide: () => void
}

type BootstrapModal = {
  getOrCreateInstance: (element: Element) => BootstrapModalInstance
  getInstance?: (element: Element) => BootstrapModalInstance | null
}

declare global {
  interface Window {
    bootstrap?: {
      Modal?: BootstrapModal
    }
  }
}

