'use client'

import { type DragEvent } from 'react'
import type { GateType } from '@/lib/types'
import { useCircuitStore } from '@/store/useCircuitStore'
import { cn } from '@/lib/utils'

interface GateItem {
  type: GateType
  label: string
  description: string
}

const gates: GateItem[] = [
  { type: 'INPUT', label: 'Input', description: 'Switch input (0/1)' },
  { type: 'OUTPUT', label: 'Output', description: 'LED output' },
  { type: 'AND', label: 'AND', description: 'All inputs = 1' },
  { type: 'OR', label: 'OR', description: 'Any input = 1' },
  { type: 'NOT', label: 'NOT', description: 'Inverts input' },
  { type: 'NAND', label: 'NAND', description: 'NOT AND' },
  { type: 'NOR', label: 'NOR', description: 'NOT OR' },
  { type: 'XOR', label: 'XOR', description: 'Inputs differ' },
]

function GateIcon({ type }: { type: GateType }) {
  const size = 28
  switch (type) {
    case 'INPUT':
      return (
        <div className="w-7 h-7 rounded border-2 border-border bg-secondary flex items-center justify-center font-mono text-[10px] font-bold">
          IN
        </div>
      )
    case 'OUTPUT':
      return (
        <div className="w-7 h-7 rounded-full border-2 border-border bg-secondary flex items-center justify-center font-mono text-[10px] font-bold">
          Y
        </div>
      )
    case 'AND':
    case 'NAND':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" className="overflow-visible shrink-0">
          <path d="M 4 4 L 16 4 A 12 12 0 0 1 16 28 L 4 28 Z" className="fill-secondary stroke-border" strokeWidth={2} />
          {type === 'NAND' && <circle cx={28} cy={16} r={3} className="fill-background stroke-border" strokeWidth={2} />}
        </svg>
      )
    case 'OR':
    case 'NOR':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" className="overflow-visible shrink-0">
          <path d="M 4 4 Q 10 16 4 28 Q 16 28 28 16 Q 16 4 4 4" className="fill-secondary stroke-border" strokeWidth={2} />
          {type === 'NOR' && <circle cx={28} cy={16} r={3} className="fill-background stroke-border" strokeWidth={2} />}
        </svg>
      )
    case 'NOT':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" className="overflow-visible shrink-0">
          <path d="M 4 4 L 24 16 L 4 28 Z" className="fill-secondary stroke-border" strokeWidth={2} />
          <circle cx={27} cy={16} r={3} className="fill-background stroke-border" strokeWidth={2} />
        </svg>
      )
    case 'XOR':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" className="overflow-visible shrink-0">
          <path d="M 8 4 Q 14 16 8 28 Q 20 28 28 16 Q 20 4 8 4" className="fill-secondary stroke-border" strokeWidth={2} />
          <path d="M 4 4 Q 10 16 4 28" className="fill-none stroke-border" strokeWidth={2} />
        </svg>
      )
    default:
      return null
  }
}

interface ComponentSidebarProps {
  onSelect?: () => void
}

export default function ComponentSidebar({ onSelect }: ComponentSidebarProps) {
  const addNode = useCircuitStore((s) => s.addNode)
  const isSimulating = useCircuitStore((s) => s.isSimulating)
  let didDrag = false

  const onDragStart = (event: DragEvent, gateType: GateType) => {
    didDrag = true
    event.dataTransfer.setData('application/reactflow', gateType)
    event.dataTransfer.effectAllowed = 'move'
  }

  const handleTap = (gateType: GateType) => {
    if (didDrag) { didDrag = false; return }
    if (isSimulating) return
    const x = 200 + Math.random() * 200
    const y = 150 + Math.random() * 200
    addNode(gateType, { x, y })
    onSelect?.()
  }

  return (
    <div className="flex flex-col gap-0.5 p-2 sm:p-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 hidden lg:block">
        Components
      </h3>
      {gates.map((gate) => (
        <div
          key={gate.type}
          draggable
          onDragStart={(e) => onDragStart(e, gate.type)}
          onClick={() => handleTap(gate.type)}
          className={cn(
            'flex items-center gap-2.5 p-2 rounded-lg cursor-grab',
            'bg-card hover:bg-accent transition-colors',
            'border border-transparent hover:border-border',
            'active:cursor-grabbing active:scale-[0.97]',
            'touch-manipulation'
          )}
        >
          <GateIcon type={gate.type} />
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-foreground">{gate.label}</span>
            <span className="text-[10px] text-muted-foreground truncate">{gate.description}</span>
          </div>
        </div>
      ))}
      <p className="text-[10px] text-muted-foreground mt-2 lg:hidden">
        Tap to add · Drag on desktop
      </p>
    </div>
  )
}
