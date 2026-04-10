import type { GateType } from './types'

// Evaluate a single gate based on its type and inputs
export function evaluateGate(gateType: GateType, inputs: boolean[]): boolean {
  switch (gateType) {
    case 'AND':
      return inputs.length >= 2 && inputs.every(Boolean)
    case 'OR':
      return inputs.length >= 2 && inputs.some(Boolean)
    case 'NOT':
      return inputs.length >= 1 && !inputs[0]
    case 'NAND':
      return inputs.length >= 2 && !inputs.every(Boolean)
    case 'NOR':
      return inputs.length >= 2 && !inputs.some(Boolean)
    case 'XOR':
      return inputs.length >= 2 && inputs.filter(Boolean).length % 2 === 1
    case 'INPUT':
      return inputs[0] ?? false
    case 'OUTPUT':
      return inputs[0] ?? false
    default:
      return false
  }
}

// Get the number of inputs a gate type expects
export function getGateInputCount(gateType: GateType): number {
  switch (gateType) {
    case 'NOT':
      return 1
    case 'INPUT':
      return 0
    case 'OUTPUT':
      return 1
    default:
      return 2
  }
}

// Get gate symbol for display
export function getGateSymbol(gateType: GateType): string {
  switch (gateType) {
    case 'AND':
      return '&'
    case 'OR':
      return '>1'
    case 'NOT':
      return '1'
    case 'NAND':
      return '&'
    case 'NOR':
      return '>1'
    case 'XOR':
      return '=1'
    case 'INPUT':
      return 'IN'
    case 'OUTPUT':
      return 'OUT'
    default:
      return '?'
  }
}

// Check if a gate type is negated (has bubble output)
export function isNegated(gateType: GateType): boolean {
  return gateType === 'NOT' || gateType === 'NAND' || gateType === 'NOR'
}
