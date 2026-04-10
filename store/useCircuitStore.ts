import { create } from 'zustand'
import type { Node, Edge } from '@xyflow/react'
import type { AppState, CircuitError, GateNodeData, GateType } from '@/lib/types'
import { evaluateGate } from '@/lib/logic-engine'
import { parseEquation, extractVariables, evaluateAST } from '@/lib/equation-parser'
import { generateCircuitFromAST, extractEquationFromCircuit } from '@/lib/circuit-generator'

interface TruthTableData {
  variables: string[]
  rows: { inputs: Record<string, boolean>; output: boolean }[]
}

interface CircuitStore {
  nodes: Node<GateNodeData>[]
  edges: Edge[]
  appState: AppState
  error: CircuitError | null
  equation: string
  truthTable: TruthTableData | null
  selectedNodeId: string | null
  isDragging: boolean
  isSimulating: boolean

  setNodes: (nodes: Node<GateNodeData>[]) => void
  setEdges: (edges: Edge[]) => void
  addNode: (type: GateType, position: { x: number; y: number }) => void
  removeNode: (id: string) => void
  updateNodeValue: (id: string, value: boolean) => void
  setEquation: (equation: string) => void
  generateFromEquation: () => void
  extractEquation: () => void
  simulate: () => void
  clearCircuit: () => void
  setSelectedNode: (id: string | null) => void
  setIsDragging: (isDragging: boolean) => void
  setError: (error: CircuitError | null) => void
  loadCircuit: (nodes: Node<GateNodeData>[], edges: Edge[], equation: string) => void
  autoSync: () => void
  startSimulation: () => void
  stopSimulation: () => void
}

let nodeIdCounter = 0
let inputLetterCounter = 0

function computeTruthTable(equation: string): TruthTableData | null {
  const { ast, error } = parseEquation(equation)
  if (error || !ast) return null
  const variables = extractVariables(ast)
  if (variables.length === 0 || variables.length > 8) return null
  const rows: TruthTableData['rows'] = []
  const n = Math.pow(2, variables.length)
  for (let i = 0; i < n; i++) {
    const inputs: Record<string, boolean> = {}
    variables.forEach((v, idx) => {
      inputs[v] = Boolean((i >> (variables.length - 1 - idx)) & 1)
    })
    rows.push({ inputs, output: evaluateAST(ast, inputs) })
  }
  return { variables, rows }
}

export const useCircuitStore = create<CircuitStore>((set, get) => ({
  nodes: [],
  edges: [],
  appState: 'empty',
  error: null,
  equation: '',
  truthTable: null,
  selectedNodeId: null,
  isDragging: false,
  isSimulating: false,

  setNodes: (nodes) => {
    if (get().isSimulating) return // Block edits during simulation
    set({ nodes, appState: nodes.length > 0 ? 'editing' : 'empty' })
    setTimeout(() => get().autoSync(), 0)
  },

  setEdges: (edges) => {
    if (get().isSimulating) return
    set({ edges })
    setTimeout(() => get().autoSync(), 0)
  },

  addNode: (type, position) => {
    if (get().isSimulating) return
    const id = `node-${++nodeIdCounter}`
    let label: string
    if (type === 'INPUT') {
      // Find next available letter based on existing inputs
      const existingLabels = new Set(
        get().nodes.filter((n) => n.data.gateType === 'INPUT').map((n) => n.data.label)
      )
      let letterIdx = 0
      while (existingLabels.has(String.fromCharCode(65 + letterIdx))) {
        letterIdx++
      }
      label = String.fromCharCode(65 + letterIdx)
    } else if (type === 'OUTPUT') {
      label = 'Y'
    } else {
      label = type
    }
    const newNode: Node<GateNodeData> = {
      id, type: 'gateNode', position,
      data: { gateType: type, label, value: false },
    }
    set((state) => ({ nodes: [...state.nodes, newNode], appState: 'editing' }))
  },

  removeNode: (id) => {
    if (get().isSimulating) return
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      edges: state.edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
    }))
    setTimeout(() => get().autoSync(), 0)
  },

  updateNodeValue: (id, value) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, value } } : node
      ),
    }))
    if (get().isSimulating) get().simulate()
  },

  setEquation: (equation) => set({ equation, error: null }),

  generateFromEquation: () => {
    const { equation } = get()
    const { ast, error } = parseEquation(equation)
    if (error) { set({ error, appState: 'error' }); return }
    if (!ast) { set({ error: { type: 'syntax', message: 'Ecuación inválida' }, appState: 'error' }); return }

    const { nodes, edges } = generateCircuitFromAST(ast)
    const inputCount = nodes.filter((n) => n.data.gateType === 'INPUT').length
    inputLetterCounter = inputCount
    nodeIdCounter = nodes.length + 1

    const truthTable = computeTruthTable(equation)
    set({ nodes, edges, appState: 'editing', error: null, truthTable, isSimulating: false })
  },

  extractEquation: () => {
    const { nodes, edges } = get()
    const { equation, error } = extractEquationFromCircuit(nodes, edges)
    if (error) { set({ error: { type: 'connection', message: error }, appState: 'error' }); return }
    const truthTable = computeTruthTable(equation)
    set({ equation, error: null, truthTable })
  },

  autoSync: () => {
    const { nodes, edges, isSimulating } = get()
    if (isSimulating) return
    if (nodes.length === 0) { set({ truthTable: null }); return }
    const outputNodes = nodes.filter((n) => n.data.gateType === 'OUTPUT')
    if (outputNodes.length === 0) return
    const hasConnectedOutput = outputNodes.some((o) => edges.some((e) => e.target === o.id))
    if (!hasConnectedOutput) return
    const { equation: extracted, error } = extractEquationFromCircuit(nodes, edges)
    if (!error && extracted && !extracted.includes('?')) {
      const truthTable = computeTruthTable(extracted)
      set({ equation: extracted, truthTable })
    }
  },

  startSimulation: () => {
    set({ isSimulating: true })
    get().simulate()
  },

  stopSimulation: () => {
    // Stop animation on edges
    const { edges } = get()
    set({
      isSimulating: false,
      appState: 'editing',
      edges: edges.map((e) => ({ ...e, animated: false })),
    })
  },

  simulate: () => {
    const { nodes, edges } = get()
    if (nodes.length === 0) { set({ appState: 'empty' }); return }

    const incomingEdges = new Map<string, string[]>()
    const nodeMap = new Map(nodes.map((n) => [n.id, n]))

    edges.forEach((edge) => {
      if (!incomingEdges.has(edge.target)) incomingEdges.set(edge.target, [])
      const inputs = incomingEdges.get(edge.target)!
      const handleIndex = parseInt(edge.targetHandle?.split('-')[1] ?? '0', 10)
      inputs[handleIndex] = edge.source
    })

    const visited = new Set<string>()
    const order: string[] = []
    function visit(nodeId: string) {
      if (visited.has(nodeId)) return
      visited.add(nodeId)
      ;(incomingEdges.get(nodeId) ?? []).forEach((src) => { if (src) visit(src) })
      order.push(nodeId)
    }
    nodes.forEach((n) => visit(n.id))

    const values = new Map<string, boolean>()
    order.forEach((nodeId) => {
      const node = nodeMap.get(nodeId)
      if (!node) return
      if (node.data.gateType === 'INPUT') { values.set(nodeId, node.data.value); return }
      const inputIds = incomingEdges.get(nodeId) ?? []
      values.set(nodeId, evaluateGate(node.data.gateType, inputIds.map((id) => values.get(id) ?? false)))
    })

    set({
      nodes: nodes.map((n) => ({ ...n, data: { ...n.data, value: values.get(n.id) ?? false } })),
      edges: edges.map((e) => ({ ...e, animated: values.get(e.source) ?? false })),
      appState: 'simulating',
      error: null,
    })
  },

  clearCircuit: () => {
    inputLetterCounter = 0
    nodeIdCounter = 0
    set({ nodes: [], edges: [], appState: 'empty', error: null, equation: '', truthTable: null, selectedNodeId: null, isSimulating: false })
  },

  setSelectedNode: (id) => set({ selectedNodeId: id }),
  setIsDragging: (isDragging) => set({ isDragging }),
  setError: (error) => set({ error, appState: error ? 'error' : 'editing' }),

  loadCircuit: (nodes, edges, equation) => {
    const maxId = nodes.reduce((max, n) => {
      const num = parseInt(n.id.replace(/\D/g, ''), 10)
      return isNaN(num) ? max : Math.max(max, num)
    }, 0)
    nodeIdCounter = maxId
    inputLetterCounter = nodes.filter((n) => n.data.gateType === 'INPUT').length
    const truthTable = equation ? computeTruthTable(equation) : null
    set({ nodes, edges, equation, truthTable, appState: nodes.length > 0 ? 'editing' : 'empty', error: null, isSimulating: false })
  },
}))

export function generateTruthTable(equation: string) {
  const result = computeTruthTable(equation)
  if (!result) return { variables: [] as string[], rows: [] as TruthTableData['rows'], error: 'Ecuación inválida' }
  return { ...result, error: null }
}
