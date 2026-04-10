'use client'

import { useState, useEffect } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import CircuitCanvas from '@/components/canvas/CircuitCanvas'
import ComponentSidebar from '@/components/canvas/ComponentSidebar'
import ControlPanel from '@/components/canvas/ControlPanel'
import LoginScreen from '@/components/auth/LoginScreen'
import { useAuthStore } from '@/store/useAuthStore'
import { CircuitBoardIcon, PanelLeftIcon, PanelRightIcon, XIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

function SimulatorLayout() {
  const [leftOpen, setLeftOpen] = useState(false)
  const [rightOpen, setRightOpen] = useState(false)

  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-[100dvh] bg-background overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-3 sm:px-4 h-11 sm:h-12 border-b border-border bg-card shrink-0 z-30">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setLeftOpen(!leftOpen); setRightOpen(false) }}
              className="lg:hidden p-1.5 rounded-md hover:bg-accent text-muted-foreground"
              aria-label="Componentes"
            >
              <PanelLeftIcon className="w-5 h-5" />
            </button>
            <CircuitBoardIcon className="w-5 h-5 text-primary" />
            <h1 className="font-semibold text-foreground text-sm sm:text-base truncate">
              LogiFlow
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Arrastra componentes para construir circuitos
            </span>
            <button
              onClick={() => { setRightOpen(!rightOpen); setLeftOpen(false) }}
              className="lg:hidden p-1.5 rounded-md hover:bg-accent text-muted-foreground"
              aria-label="Controles"
            >
              <PanelRightIcon className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden relative">
          {(leftOpen || rightOpen) && (
            <div
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              onClick={() => { setLeftOpen(false); setRightOpen(false) }}
            />
          )}

          {/* Left sidebar */}
          <aside className={cn(
            'hidden lg:flex lg:w-52 xl:w-56 border-r border-border bg-card shrink-0 overflow-y-auto',
            leftOpen && 'flex fixed inset-y-11 left-0 w-64 z-40 shadow-2xl'
          )}>
            <div className="flex flex-col w-full">
              <div className="flex items-center justify-between p-2 border-b border-border lg:hidden">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Componentes</span>
                <button onClick={() => setLeftOpen(false)} className="p-1 rounded hover:bg-accent" aria-label="Cerrar">
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
              <ComponentSidebar onSelect={() => setLeftOpen(false)} />
            </div>
          </aside>

          {/* Canvas */}
          <main className="flex-1 relative" style={{ minHeight: 0 }}>
            <CircuitCanvas />
          </main>

          {/* Right sidebar */}
          <aside className={cn(
            'hidden lg:flex lg:w-64 xl:w-72 border-l border-border bg-card shrink-0 overflow-hidden',
            rightOpen && 'flex fixed inset-y-11 right-0 w-[85vw] sm:w-80 z-40 shadow-2xl'
          )}>
            <div className="flex flex-col w-full">
              <div className="flex items-center justify-between p-2 border-b border-border lg:hidden">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Controles</span>
                <button onClick={() => setRightOpen(false)} className="p-1 rounded hover:bg-accent" aria-label="Cerrar">
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
              <ControlPanel />
            </div>
          </aside>
        </div>
      </div>
    </ReactFlowProvider>
  )
}

export default function Home() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return null
  if (!isLoggedIn) return <LoginScreen />
  return <SimulatorLayout />
}
