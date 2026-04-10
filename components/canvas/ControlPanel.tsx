'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useCircuitStore } from '@/store/useCircuitStore'
import { useAuthStore } from '@/store/useAuthStore'
import { cn } from '@/lib/utils'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PlayIcon, SquareIcon } from 'lucide-react'
import SavedCircuits from './SavedCircuits'

export default function ControlPanel() {
  const equation = useCircuitStore((s) => s.equation)
  const setEquation = useCircuitStore((s) => s.setEquation)
  const generateFromEquation = useCircuitStore((s) => s.generateFromEquation)
  const clearCircuit = useCircuitStore((s) => s.clearCircuit)
  const error = useCircuitStore((s) => s.error)
  const appState = useCircuitStore((s) => s.appState)
  const truthTable = useCircuitStore((s) => s.truthTable)
  const nodes = useCircuitStore((s) => s.nodes)
  const isSimulating = useCircuitStore((s) => s.isSimulating)
  const startSimulation = useCircuitStore((s) => s.startSimulation)
  const stopSimulation = useCircuitStore((s) => s.stopSimulation)

  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const [tab, setTab] = useState<'equation' | 'table'>('equation')
  const [ttVars, setTtVars] = useState(2)
  const [ttOutputs, setTtOutputs] = useState<boolean[]>([])
  const [ttInited, setTtInited] = useState(false)

  const handleGenerate = () => generateFromEquation()

  const handleClear = () => {
    clearCircuit()
    setTtInited(false)
  }

  const initTruthTable = () => {
    setTtOutputs(new Array(Math.pow(2, ttVars)).fill(false))
    setTtInited(true)
  }

  const toggleTtOutput = (idx: number) => {
    setTtOutputs((prev) => prev.map((v, i) => (i === idx ? !v : v)))
  }

  const generateFromTruthTable = () => {
    const varNames = Array.from({ length: ttVars }, (_, i) => String.fromCharCode(65 + i))
    const minterms: string[] = []

    ttOutputs.forEach((output, rowIdx) => {
      if (!output) return
      const terms = varNames.map((v, vi) => {
        const bit = (rowIdx >> (ttVars - 1 - vi)) & 1
        return bit ? v : `${v}'`
      })
      // Single term doesn't need parens, multiple terms in a product do when there's a sum
      minterms.push(terms.length > 1 ? terms.join(' · ') : terms[0])
    })

    if (minterms.length === 0) return
    // Wrap each product term in parens when there are multiple sums
    const eq = minterms.length > 1
      ? minterms.map((m) => m.includes(' · ') ? `(${m})` : m).join(' + ')
      : minterms[0]
    setEquation(eq)
    setTab('equation')
    setTimeout(() => useCircuitStore.getState().generateFromEquation(), 50)
  }

  const hasCircuit = nodes.length > 0

  return (
    <div className="flex flex-col gap-3 p-3 sm:p-4 h-full overflow-auto">
      {/* User info */}
      {user && (
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{user.name}</p>
            <p className="text-[10px] text-muted-foreground">{user.phone}</p>
          </div>
          <button onClick={logout} className="text-[10px] text-muted-foreground hover:text-destructive transition-colors shrink-0">
            Salir
          </button>
        </div>
      )}

      {/* Simulation control */}
      {hasCircuit && (
        <div className="flex gap-2">
          {!isSimulating ? (
            <Button onClick={startSimulation} size="sm" className="flex-1 gap-1.5">
              <PlayIcon className="w-3.5 h-3.5" /> Simular
            </Button>
          ) : (
            <Button onClick={stopSimulation} size="sm" variant="destructive" className="flex-1 gap-1.5">
              <SquareIcon className="w-3.5 h-3.5" /> Detener
            </Button>
          )}
        </div>
      )}

      {isSimulating && (
        <p className="text-[10px] text-chart-2 font-medium">
          ▶ Simulación activa — Haz clic en las entradas para cambiar valores
        </p>
      )}

      {/* Saved circuits */}
      {!isSimulating && <SavedCircuits />}

      {/* Tab switcher */}
      {!isSimulating && (
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setTab('equation')}
            className={cn('flex-1 py-1.5 text-xs font-medium transition-colors', tab === 'equation' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground')}
          >
            Ecuación
          </button>
          <button
            onClick={() => setTab('table')}
            className={cn('flex-1 py-1.5 text-xs font-medium transition-colors', tab === 'table' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground')}
          >
            Tabla de Verdad
          </button>
        </div>
      )}

      {!isSimulating && tab === 'equation' && (
        <>
          <div className="flex flex-col gap-2">
            <Textarea
              value={equation}
              onChange={(e) => setEquation(e.target.value)}
              placeholder="A · B + C'  ó  A AND B OR NOT C"
              className="font-mono text-sm min-h-[60px] resize-none bg-secondary border-border"
            />
            <p className="text-[10px] text-muted-foreground">
              NOT = <span className="font-mono">'</span> · AND = <span className="font-mono">·</span> o <span className="font-mono">*</span> · OR = <span className="font-mono">+</span>
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertDescription className="text-xs">{error.message}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
            <Button onClick={handleGenerate} className="w-full" size="sm" disabled={!equation.trim()}>
              Generar Circuito
            </Button>
            <Button onClick={handleClear} variant="ghost" className="w-full text-muted-foreground hover:text-destructive" size="sm">
              Limpiar Todo
            </Button>
          </div>
        </>
      )}

      {!isSimulating && tab === 'table' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Variables:</label>
            <select
              value={ttVars}
              onChange={(e) => { setTtVars(Number(e.target.value)); setTtInited(false) }}
              className="h-7 px-2 text-xs rounded border border-border bg-secondary text-foreground"
            >
              {[2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n} ({String.fromCharCode(65)}–{String.fromCharCode(64 + n)})</option>
              ))}
            </select>
            {!ttInited && (
              <Button size="sm" variant="secondary" onClick={initTruthTable} className="h-7 text-xs">
                Crear
              </Button>
            )}
          </div>

          {ttInited && (
            <>
              <div className="border border-border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary hover:bg-secondary">
                      {Array.from({ length: ttVars }, (_, i) => (
                        <TableHead key={i} className="text-center font-mono text-xs py-1.5 h-auto px-2">
                          {String.fromCharCode(65 + i)}
                        </TableHead>
                      ))}
                      <TableHead className="text-center font-mono text-xs py-1.5 h-auto px-2 border-l border-border">Y</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ttOutputs.map((output, rowIdx) => (
                      <TableRow key={rowIdx} className="hover:bg-accent/50">
                        {Array.from({ length: ttVars }, (_, vi) => (
                          <TableCell key={vi} className="text-center font-mono text-xs py-1 px-2">
                            {(rowIdx >> (ttVars - 1 - vi)) & 1}
                          </TableCell>
                        ))}
                        <TableCell className="text-center border-l border-border p-0">
                          <button
                            onClick={() => toggleTtOutput(rowIdx)}
                            className={cn(
                              'w-full py-1 font-mono text-xs font-semibold transition-colors',
                              output ? 'text-chart-2 bg-chart-2/10' : 'text-muted-foreground'
                            )}
                          >
                            {output ? '1' : '0'}
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Button onClick={generateFromTruthTable} size="sm" disabled={!ttOutputs.some(Boolean)}>
                Generar desde Tabla
              </Button>
            </>
          )}
        </div>
      )}

      {/* Auto truth table display */}
      {truthTable && truthTable.variables.length > 0 && (tab === 'equation' || isSimulating) && (
        <div className="flex flex-col gap-2 mt-1">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Tabla de Verdad
          </h3>
          {equation && (
            <p className="font-mono text-xs text-foreground bg-secondary rounded px-2 py-1.5 break-all">
              Y = {equation}
            </p>
          )}
          <div className="border border-border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  {truthTable.variables.map((v) => (
                    <TableHead key={v} className="text-center font-mono text-xs py-1.5 h-auto px-2">{v}</TableHead>
                  ))}
                  <TableHead className="text-center font-mono text-xs py-1.5 h-auto px-2 border-l border-border">Y</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {truthTable.rows.map((row, i) => (
                  <TableRow key={i} className="hover:bg-accent/50">
                    {truthTable.variables.map((v) => (
                      <TableCell key={v} className="text-center font-mono text-xs py-1 px-2">
                        {row.inputs[v] ? '1' : '0'}
                      </TableCell>
                    ))}
                    <TableCell className={cn(
                      'text-center font-mono text-xs py-1 px-2 border-l border-border font-semibold',
                      row.output ? 'text-chart-2' : 'text-muted-foreground'
                    )}>
                      {row.output ? '1' : '0'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Status */}
      <div className="mt-auto pt-3 border-t border-border">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <div className={cn(
            'w-2 h-2 rounded-full',
            appState === 'empty' && 'bg-muted',
            appState === 'editing' && 'bg-yellow-500',
            appState === 'simulating' && 'bg-chart-2',
            appState === 'error' && 'bg-destructive'
          )} />
          <span>{isSimulating ? 'Simulando' : appState === 'empty' ? 'Vacío' : appState === 'editing' ? 'Editando' : appState === 'error' ? 'Error' : 'Listo'}</span>
          {nodes.length > 0 && <span>· {nodes.length} nodos</span>}
        </div>
      </div>
    </div>
  )
}
