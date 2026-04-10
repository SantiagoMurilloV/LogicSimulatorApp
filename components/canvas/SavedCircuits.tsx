'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useCircuitStore } from '@/store/useCircuitStore'
import { SaveIcon, FolderOpenIcon, Trash2Icon, PlusIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SavedCircuits() {
  const user = useAuthStore((s) => s.user)
  const saveCircuit = useAuthStore((s) => s.saveCircuit)
  const updateCircuit = useAuthStore((s) => s.updateCircuit)
  const deleteCircuit = useAuthStore((s) => s.deleteCircuit)
  const setActiveCircuit = useAuthStore((s) => s.setActiveCircuit)

  const nodes = useCircuitStore((s) => s.nodes)
  const edges = useCircuitStore((s) => s.edges)
  const equation = useCircuitStore((s) => s.equation)
  const loadCircuit = useCircuitStore((s) => s.loadCircuit)
  const clearCircuit = useCircuitStore((s) => s.clearCircuit)

  const [saveName, setSaveName] = useState('')
  const [showSave, setShowSave] = useState(false)

  if (!user) return null

  const circuits = [...user.circuits].sort((a, b) => b.updatedAt - a.updatedAt)
  const activeId = user.activeCircuitId

  const handleSave = () => {
    if (!saveName.trim()) return
    if (activeId) {
      updateCircuit(activeId, { name: saveName.trim(), nodes, edges, equation })
    } else {
      saveCircuit({ name: saveName.trim(), nodes, edges, equation })
    }
    setSaveName('')
    setShowSave(false)
  }

  const handleQuickSave = () => {
    if (activeId) {
      updateCircuit(activeId, { nodes, edges, equation })
    } else {
      setShowSave(true)
    }
  }

  const handleLoad = (id: string) => {
    const circuit = user.circuits.find((c) => c.id === id)
    if (!circuit) return
    setActiveCircuit(id)
    loadCircuit(circuit.nodes, circuit.edges, circuit.equation)
  }

  const handleNew = () => {
    setActiveCircuit(null)
    clearCircuit()
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteCircuit(id)
    if (activeId === id) {
      setActiveCircuit(null)
      clearCircuit()
    }
  }

  const formatDate = (ts: number) => {
    const d = new Date(ts)
    return `${d.getDate()}/${d.getMonth() + 1} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Mis Circuitos
        </h3>
        <div className="flex gap-1">
          <button
            onClick={handleNew}
            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground transition-colors"
            title="Nuevo circuito"
          >
            <PlusIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleQuickSave}
            disabled={nodes.length === 0}
            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground transition-colors disabled:opacity-30"
            title="Guardar"
          >
            <SaveIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showSave && (
        <div className="flex gap-1.5">
          <input
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="Nombre del circuito"
            autoFocus
            className="flex-1 h-7 px-2 text-xs rounded border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            onClick={handleSave}
            disabled={!saveName.trim()}
            className="px-2 h-7 text-xs rounded bg-primary text-primary-foreground disabled:opacity-30"
          >
            OK
          </button>
        </div>
      )}

      {circuits.length === 0 ? (
        <p className="text-[10px] text-muted-foreground py-2">No hay circuitos guardados</p>
      ) : (
        <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto">
          {circuits.map((c) => (
            <div
              key={c.id}
              onClick={() => handleLoad(c.id)}
              className={cn(
                'flex items-center gap-2 p-1.5 rounded-md cursor-pointer transition-colors text-xs group',
                activeId === c.id ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50 text-foreground'
              )}
            >
              <FolderOpenIcon className="w-3 h-3 shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium">{c.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {c.equation || 'Sin ecuación'} · {formatDate(c.updatedAt)}
                </p>
              </div>
              <button
                onClick={(e) => handleDelete(c.id, e)}
                className="p-1 rounded opacity-0 group-hover:opacity-100 max-lg:opacity-100 hover:bg-destructive/20 hover:text-destructive transition-all shrink-0"
                title="Eliminar"
              >
                <Trash2Icon className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
