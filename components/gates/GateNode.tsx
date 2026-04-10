'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { GateNodeData, GateType } from '@/lib/types'
import { getGateInputCount, isNegated } from '@/lib/logic-engine'
import { useCircuitStore } from '@/store/useCircuitStore'
import { cn } from '@/lib/utils'
import { XIcon } from 'lucide-react'

const gateShapes: Record<GateType, (props: { width: number; height: number; negated: boolean }) => JSX.Element> = {
  AND: ({ width, height, negated }) => (
    <g>
      <path d={`M 0 0 L ${width * 0.5} 0 A ${width * 0.5} ${height * 0.5} 0 0 1 ${width * 0.5} ${height} L 0 ${height} Z`} className="fill-secondary stroke-border" strokeWidth={2} />
      {negated && <circle cx={width + 6} cy={height / 2} r={6} className="fill-background stroke-border" strokeWidth={2} />}
    </g>
  ),
  OR: ({ width, height, negated }) => (
    <g>
      <path d={`M 0 0 Q ${width * 0.25} ${height * 0.5} 0 ${height} Q ${width * 0.5} ${height} ${width} ${height * 0.5} Q ${width * 0.5} 0 0 0`} className="fill-secondary stroke-border" strokeWidth={2} />
      {negated && <circle cx={width + 6} cy={height / 2} r={6} className="fill-background stroke-border" strokeWidth={2} />}
    </g>
  ),
  NOT: ({ width, height }) => (
    <g>
      <path d={`M 0 0 L ${width - 12} ${height * 0.5} L 0 ${height} Z`} className="fill-secondary stroke-border" strokeWidth={2} />
      <circle cx={width - 6} cy={height / 2} r={6} className="fill-background stroke-border" strokeWidth={2} />
    </g>
  ),
  NAND: (props) => gateShapes.AND({ ...props, negated: true }),
  NOR: (props) => gateShapes.OR({ ...props, negated: true }),
  XOR: ({ width, height }) => (
    <g>
      <path d={`M 8 0 Q ${width * 0.25 + 8} ${height * 0.5} 8 ${height} Q ${width * 0.5 + 8} ${height} ${width} ${height * 0.5} Q ${width * 0.5 + 8} 0 8 0`} className="fill-secondary stroke-border" strokeWidth={2} />
      <path d={`M 0 0 Q ${width * 0.25} ${height * 0.5} 0 ${height}`} className="fill-none stroke-border" strokeWidth={2} />
    </g>
  ),
  INPUT: () => null,
  OUTPUT: () => null,
}

function GateNode({ id, data, selected }: NodeProps<GateNodeData>) {
  const { gateType, label, value } = data
  const updateNodeValue = useCircuitStore((s) => s.updateNodeValue)
  const removeNode = useCircuitStore((s) => s.removeNode)
  const inputCount = getGateInputCount(gateType)
  const negated = isNegated(gateType)

  const isSimulating = useCircuitStore((s) => s.isSimulating)

  const isInput = gateType === 'INPUT'
  const isOutput = gateType === 'OUTPUT'
  const isIONode = isInput || isOutput

  const baseWidth = isIONode ? 48 : 64
  const height = isIONode ? 48 : 48
  // For negated gates and NOT, the SVG is wider due to the bubble
  const hasNegBubble = negated || gateType === 'NOT'
  const totalWidth = isIONode ? baseWidth : baseWidth + (hasNegBubble ? 14 : 0)

  const handleClick = () => {
    if (isInput) updateNodeValue(id, !value)
  }

  const handleDelete = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation()
    e.preventDefault()
    removeNode(id)
  }

  return (
    <div
      className={cn(
        'relative flex items-center justify-center group',
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg'
      )}
      style={{ width: totalWidth, height }}
    >
      {/* Delete button - mobile only, not during simulation */}
      {selected && !isSimulating && (
        <button
          onClick={handleDelete}
          onTouchEnd={handleDelete}
          className="absolute -top-3 -right-3 z-10 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md touch-manipulation lg:hidden"
          aria-label="Eliminar"
        >
          <XIcon className="w-3 h-3" />
        </button>
      )}

      {/* Input handles */}
      {inputCount === 1 && (
        <Handle
          key="input-0"
          type="target"
          position={Position.Left}
          id="input-0"
          style={{
            top: '50%',
            left: -5,
            width: 12, height: 12,
            background: value ? 'var(--chart-2)' : 'var(--muted)',
            border: '2px solid var(--border)',
            borderRadius: '50%',
          }}
        />
      )}
      {inputCount === 2 && (
        <>
          <Handle
            key="input-0"
            type="target"
            position={Position.Left}
            id="input-0"
            style={{
              top: '30%',
              left: -5,
              width: 12, height: 12,
              background: value ? 'var(--chart-2)' : 'var(--muted)',
              border: '2px solid var(--border)',
              borderRadius: '50%',
            }}
          />
          <Handle
            key="input-1"
            type="target"
            position={Position.Left}
            id="input-1"
            style={{
              top: '70%',
              left: -5,
              width: 12, height: 12,
              background: value ? 'var(--chart-2)' : 'var(--muted)',
              border: '2px solid var(--border)',
              borderRadius: '50%',
            }}
          />
        </>
      )}

      {/* Output handle - positioned at the right edge of the total width */}
      {gateType !== 'OUTPUT' && (
        <Handle
          type="source"
          position={Position.Right}
          id="output"
          style={{
            top: '50%',
            right: -5,
            width: 12, height: 12,
            background: value ? 'var(--chart-2)' : 'var(--muted)',
            border: '2px solid var(--border)',
            borderRadius: '50%',
          }}
        />
      )}

      {/* IO Node style */}
      {isIONode ? (
        <div
          onClick={handleClick}
          className={cn(
            'flex items-center justify-center rounded-lg border-2 transition-all font-mono text-sm font-semibold touch-manipulation',
            isInput && 'cursor-pointer hover:scale-105',
            value ? 'bg-chart-2 border-chart-2 text-background' : 'bg-secondary border-border text-foreground'
          )}
          style={{ width: baseWidth, height }}
        >
          <span>{value ? '1' : '0'}</span>
        </div>
      ) : (
        <svg
          width={totalWidth}
          height={height}
          className="overflow-visible"
          style={{ display: 'block' }}
        >
          {gateShapes[gateType]({ width: baseWidth, height, negated })}
          <text
            x={baseWidth / 2}
            y={height / 2}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-foreground font-mono text-xs font-semibold"
          >
            {gateType === 'XOR' ? '=1' : gateType === 'NOT' ? '1' : gateType === 'NAND' ? '&' : gateType === 'NOR' ? '>1' : gateType === 'AND' ? '&' : '>1'}
          </text>
        </svg>
      )}

      {/* Label */}
      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-muted-foreground whitespace-nowrap">
        {label}
      </div>

      {/* Active indicator */}
      {value && !isIONode && (
        <div className="absolute -right-1 -top-1 w-2 h-2 rounded-full bg-chart-2 animate-pulse" />
      )}
    </div>
  )
}

export default memo(GateNode)
