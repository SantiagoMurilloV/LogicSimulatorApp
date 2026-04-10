import type { Node, Edge } from '@xyflow/react'
import type { ASTNode, GateNodeData, GateType } from './types'

interface GenerationResult {
  nodes: Node<GateNodeData>[]
  edges: Edge[]
}

let nodeCounter = 0
function resetCounter() { nodeCounter = 0 }
function nextId(prefix: string) { return `${prefix}-${nodeCounter++}` }

export function generateCircuitFromAST(ast: ASTNode, inputValues: Record<string, boolean> = {}): GenerationResult {
  resetCounter()
  const nodes: Node<GateNodeData>[] = []
  const edges: Edge[] = []
  const inputNodes = new Map<string, string>()

  const H_GAP = 200
  const V_GAP = 90
  const START_X = 80
  const START_Y = 250

  function getDepth(n: ASTNode): number {
    if (n.type === 'VAR') return 0
    if (n.type === 'NOT') return 1 + getDepth(n.operand!)
    return 1 + Math.max(getDepth(n.left!), getDepth(n.right!))
  }

  const totalDepth = getDepth(ast)
  let ySlot = 0

  function getOrCreateInput(varName: string): string {
    if (inputNodes.has(varName)) return inputNodes.get(varName)!
    const id = nextId('input')
    nodes.push({
      id, type: 'gateNode',
      position: { x: START_X, y: START_Y + ySlot * V_GAP },
      data: { gateType: 'INPUT', label: varName, value: inputValues[varName] ?? false },
    })
    inputNodes.set(varName, id)
    ySlot++
    return id
  }

  function generate(node: ASTNode, depth: number): string {
    const x = START_X + (totalDepth - depth + 1) * H_GAP

    if (node.type === 'VAR') {
      return getOrCreateInput(node.value!)
    }

    if (node.type === 'NOT') {
      const srcId = generate(node.operand!, depth - 1)
      const srcNode = nodes.find((n) => n.id === srcId)
      const id = nextId('not')
      nodes.push({
        id, type: 'gateNode',
        position: { x, y: srcNode?.position.y ?? START_Y },
        data: { gateType: 'NOT', label: 'NOT', value: false },
      })
      edges.push({ id: `e-${srcId}-${id}`, source: srcId, sourceHandle: 'output', target: id, targetHandle: 'input-0', animated: false })
      return id
    }

    // Binary: AND, OR
    const leftId = generate(node.left!, depth - 1)
    const rightId = generate(node.right!, depth - 1)
    const leftNode = nodes.find((n) => n.id === leftId)
    const rightNode = nodes.find((n) => n.id === rightId)
    const ly = leftNode?.position.y ?? START_Y
    const ry = rightNode?.position.y ?? START_Y
    const midY = (ly + ry) / 2

    const id = nextId(node.type.toLowerCase())
    nodes.push({
      id, type: 'gateNode',
      position: { x, y: midY },
      data: { gateType: node.type as GateType, label: node.type, value: false },
    })
    edges.push(
      { id: `e-${leftId}-${id}-0`, source: leftId, sourceHandle: 'output', target: id, targetHandle: 'input-0', animated: false },
      { id: `e-${rightId}-${id}-1`, source: rightId, sourceHandle: 'output', target: id, targetHandle: 'input-1', animated: false },
    )
    return id
  }

  const outSrcId = generate(ast, totalDepth)
  const outSrcNode = nodes.find((n) => n.id === outSrcId)

  const outputId = nextId('output')
  nodes.push({
    id: outputId, type: 'gateNode',
    position: { x: START_X + (totalDepth + 2) * H_GAP, y: outSrcNode?.position.y ?? START_Y },
    data: { gateType: 'OUTPUT', label: 'Y', value: false },
  })
  edges.push({ id: `e-${outSrcId}-${outputId}`, source: outSrcId, sourceHandle: 'output', target: outputId, targetHandle: 'input-0', animated: false })

  // Redistribute inputs evenly
  const inputList = Array.from(inputNodes.values())
  if (inputList.length > 1) {
    const totalH = (inputList.length - 1) * V_GAP
    const startY = START_Y - totalH / 2
    inputList.forEach((nid, i) => {
      const n = nodes.find((nd) => nd.id === nid)
      if (n) n.position.y = startY + i * V_GAP
    })
  }

  return { nodes, edges }
}

// Extract equation from circuit in canonical notation
export function extractEquationFromCircuit(
  nodes: Node<GateNodeData>[],
  edges: Edge[]
): { equation: string; error: string | null } {
  const outputNodes = nodes.filter((n) => n.data.gateType === 'OUTPUT')
  if (outputNodes.length === 0) return { equation: '', error: 'No hay nodo de salida' }

  const incoming = new Map<string, { sourceId: string; handleIndex: number }[]>()
  edges.forEach((e) => {
    const idx = parseInt(e.targetHandle?.split('-')[1] ?? '0', 10)
    if (!incoming.has(e.target)) incoming.set(e.target, [])
    incoming.get(e.target)!.push({ sourceId: e.source, handleIndex: idx })
  })

  const nodeMap = new Map(nodes.map((n) => [n.id, n]))

  // Returns [equation, type] where type is the gate type of the root expression
  function build(nodeId: string, path: Set<string>): [string, string] {
    // Only prevent cycles, not revisits (same input can feed multiple gates)
    if (path.has(nodeId)) return ['?', '?']
    path.add(nodeId)

    const node = nodeMap.get(nodeId)
    if (!node) { path.delete(nodeId); return ['?', '?'] }
    const { gateType, label } = node.data

    if (gateType === 'INPUT') { path.delete(nodeId); return [label, 'VAR'] }

    if (gateType === 'OUTPUT') {
      const ins = incoming.get(nodeId) ?? []
      const result = ins.length > 0 ? build(ins[0].sourceId, path) : ['?', '?'] as [string, string]
      path.delete(nodeId)
      return result
    }

    const ins = (incoming.get(nodeId) ?? []).sort((a, b) => a.handleIndex - b.handleIndex)

    if (gateType === 'NOT') {
      if (ins.length === 0) { path.delete(nodeId); return ["?'", 'NOT'] }
      const [operand, opType] = build(ins[0].sourceId, path)
      path.delete(nodeId)
      if (opType === 'VAR') return [`${operand}'`, 'NOT']
      return [`(${operand})'`, 'NOT']
    }

    if (gateType === 'NAND') {
      if (ins.length < 2) { path.delete(nodeId); return ['?', 'NAND'] }
      const [l] = build(ins[0].sourceId, path)
      const [r] = build(ins[1].sourceId, path)
      path.delete(nodeId)
      return [`(${l} · ${r})'`, 'NOT']
    }

    if (gateType === 'NOR') {
      if (ins.length < 2) { path.delete(nodeId); return ['?', 'NOR'] }
      const [l] = build(ins[0].sourceId, path)
      const [r] = build(ins[1].sourceId, path)
      path.delete(nodeId)
      return [`(${l} + ${r})'`, 'NOT']
    }

    if (gateType === 'XOR') {
      if (ins.length < 2) { path.delete(nodeId); return ['?', 'XOR'] }
      const [l] = build(ins[0].sourceId, path)
      const [r] = build(ins[1].sourceId, path)
      path.delete(nodeId)
      return [`${l} ⊕ ${r}`, 'XOR']
    }

    if (ins.length < 2) { path.delete(nodeId); return ['?', gateType] }
    const [l, lType] = build(ins[0].sourceId, path)
    const [r, rType] = build(ins[1].sourceId, path)
    path.delete(nodeId)

    if (gateType === 'AND') {
      const ls = lType === 'OR' || lType === 'XOR' ? `(${l})` : l
      const rs = rType === 'OR' || rType === 'XOR' ? `(${r})` : r
      return [`${ls} · ${rs}`, 'AND']
    }

    if (gateType === 'OR') {
      return [`${l} + ${r}`, 'OR']
    }

    return ['?', '?']
  }

  const [equation] = build(outputNodes[0].id, new Set<string>())
  return { equation, error: null }
}
