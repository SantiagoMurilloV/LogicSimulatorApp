'use client'

import { useEffect, useState, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWARegister() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstall, setShowInstall] = useState(false)
  const [showUpdate, setShowUpdate] = useState(false)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
                setShowUpdate(true)
              }
            })
          }
        })
      })
    }

    // Capture install prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
      setShowInstall(true)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // Hide install button if already installed
    window.addEventListener('appinstalled', () => {
      setShowInstall(false)
      setInstallPrompt(null)
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = useCallback(async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') {
      setShowInstall(false)
    }
    setInstallPrompt(null)
  }, [installPrompt])

  const handleUpdate = useCallback(() => {
    window.location.reload()
  }, [])

  return (
    <>
      {/* Install banner */}
      {showInstall && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 bg-card border border-border rounded-xl p-3 shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Install App</p>
            <p className="text-xs text-muted-foreground">Use offline as a PWA</p>
          </div>
          <button
            onClick={handleInstall}
            className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Install
          </button>
          <button
            onClick={() => setShowInstall(false)}
            className="shrink-0 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Update banner */}
      {showUpdate && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 bg-card border border-border rounded-xl p-3 shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Update available</p>
            <p className="text-xs text-muted-foreground">Reload to get the latest version</p>
          </div>
          <button
            onClick={handleUpdate}
            className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Reload
          </button>
        </div>
      )}
    </>
  )
}
