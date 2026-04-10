import type { Node, Edge } from '@xyflow/react'

// Gate types supported by the simulator
export type GateType = 'AND' | 'OR' | 'NOT' | 'NAND' | 'NOR' | 'XOR' | 'INPUT' | 'OUTPUT'

// Node data structure for React Flow
export interface GateNodeData {
  gateType: GateType
  label: string
  value: boolean
  inputValues?: boolean[]
}

// Connection between nodes
export interface CircuitConnection {
  id: string
  source: string
  sourceHandle: string
  target: string
  targetHandle: string
}

// Circuit node for internal representation
export interface CircuitNode {
  id: string
  type: GateType
  label: string
  inputs: string[]
  output?: string
  value: boolean
}

// AST node types for equation parsing
export type ASTNodeType = 'AND' | 'OR' | 'NOT' | 'VAR'

export interface ASTNode {
  type: ASTNodeType
  value?: string
  left?: ASTNode
  right?: ASTNode
  operand?: ASTNode
}

// Truth table row
export interface TruthTableRow {
  inputs: Record<string, boolean>
  output: boolean
}

// Application states
export type AppState = 'empty' | 'editing' | 'simulating' | 'error'

// Error types
export interface CircuitError {
  type: 'syntax' | 'connection' | 'evaluation'
  message: string
  nodeId?: string
}

// Saved circuit
export interface SavedCircuit {
  id: string
  name: string
  equation: string
  nodes: Node<GateNodeData>[]
  edges: Edge[]
  createdAt: number
  updatedAt: number
}

// User session
export interface UserSession {
  name: string
  phone: string
  circuits: SavedCircuit[]
  activeCircuitId: string | null
}
