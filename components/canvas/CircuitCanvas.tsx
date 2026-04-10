'use client'

import { useCallback, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
  type NodeChange,
  type EdgeChange,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCircuitStore } from '@/store/useCircuitStore'
import GateNode from '@/components/gates/GateNode'
import type { GateNodeData, GateType } from '@/lib/types'

const nodeTypes: NodeTypes = { gateNode: GateNode }

export default function CircuitCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition } = useReactFlow()

  const nodes = useCircuitStore((s) => s.nodes)
  const edges = useCircuitStore((s) => s.edges)
  const setNodes = useCircuitStore((s) => s.setNodes)
  const setEdges = useCircuitStore((s) => s.setEdges)
  const addNode = useCircuitStore((s) => s.addNode)
  const setSelectedNode = useCircuitStore((s) => s.setSelectedNode)
  const setIsDragging = useCircuitStore((s) => s.setIsDragging)
  const isSimulating = useCircuitStore((s) => s.isSimulating)

  const onNodesChange = useCallback(
    (changes: NodeChange<Node<GateNodeData>>[]) => {
      if (isSimulating) {
        const selectOnly = changes.filter((c) => c.type === 'select')
        if (selectOnly.length === 0) return
        selectOnly.forEach((c) => {
          if ('id' in c) setSelectedNode(c.selected ? c.id : null)
        })
        return
      }
      changes.forEach((c) => {
        if (c.type === 'select' && 'id' in c) setSelectedNode(c.selected ? c.id : null)
      })
      setNodes(applyNodeChanges(changes, nodes) as Node<GateNodeData>[])
    },
    [nodes, setNodes, setSelectedNode, isSimulating]
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) => {
      if (isSimulating) return
      setEdges(applyEdgeChanges(changes, edges))
    },
    [edges, setEdges, isSimulating]
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      if (isSimulating) return
      const newEdge: Edge = {
        id: `e-${connection.source}-${connection.target}-${connection.sourceHandle}-${connection.targetHandle}`,
        source: connection.source!,
        sourceHandle: connection.sourceHandle,
        target: connection.target!,
        targetHandle: connection.targetHandle,
        animated: false,
      }
      setEdges(addEdge(newEdge, edges))
    },
    [edges, setEdges, isSimulating]
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    if (isSimulating) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [isSimulating])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      if (isSimulating) return
      event.preventDefault()
      const type = event.dataTransfer.getData('application/reactflow') as GateType
      if (!type) return
      addNode(type, screenToFlowPosition({ x: event.clientX, y: event.clientY }))
    },
    [screenToFlowPosition, addNode, isSimulating]
  )

  return (
    <div ref={reactFlowWrapper} style={{ width: '100%', height: '100%' }}>
      <ReactFlow<Node<GateNodeData>, Edge>
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onNodeDragStart={() => !isSimulating && setIsDragging(true)}
        onNodeDragStop={() => setIsDragging(false)}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        deleteKeyCode={isSimulating ? [] : ['Backspace', 'Delete']}
        nodesDraggable={!isSimulating}
        nodesConnectable={!isSimulating}
        elementsSelectable={true}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { stroke: 'var(--border)', strokeWidth: 2 },
        }}
        proOptions={{ hideAttribution: true }}
        panOnScroll
        zoomOnPinch
        minZoom={0.3}
        maxZoom={3}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="var(--muted-foreground)" className="opacity-30" />
        <Controls className="bg-card border border-border rounded-lg overflow-hidden" showInteractive={false} />
        <MiniMap
          className="bg-card border border-border rounded-lg overflow-hidden hidden sm:block"
          nodeColor={(node) => {
            const data = node.data as GateNodeData
            return data.value ? 'var(--chart-2)' : 'var(--muted)'
          }}
          maskColor="rgba(0, 0, 0, 0.8)"
        />
      </ReactFlow>
    </div>
  )
}
