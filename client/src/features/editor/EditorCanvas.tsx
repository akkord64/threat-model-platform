import React, { useCallback, useRef } from 'react';
import { ReactFlow, Background, Controls, SelectionMode, type NodeTypes, type Node, ReactFlowProvider, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useDiagramStore } from '../../store/diagramStore';
import TrustZoneNode from './nodes/TrustZoneNode';
import ComponentNode from './nodes/ComponentNode';
import PropertiesPanel from './PropertiesPanel';
import TopBar from './TopBar';
import ThreatsPanel from './ThreatsPanel';
import StencilPanel from './StencilPanel';

const nodeTypes: NodeTypes = {
    otmTrustZone: TrustZoneNode,
    otmComponent: ComponentNode,
};

function EditorContent() {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setSelectedNode, loadDiagram, addNode } = useDiagramStore();
    const { screenToFlowPosition, getNodes, getEdges, setNodes, setEdges } = useReactFlow();

    const onNodeClick = (_: React.MouseEvent, node: Node) => {
        setSelectedNode(node.id);
    };

    const onPaneClick = () => {
        setSelectedNode(null);
    };

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
            const typeData = event.dataTransfer.getData('application/reactflow');

            // check if the dropped element is valid
            if (typeof typeData === 'undefined' || !typeData) {
                return;
            }

            const { type, data } = JSON.parse(typeData);
            
            // Check if we dropped strictly on a valid pane
            if(!reactFlowBounds) return;

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode: Node = {
                id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
                type,
                position,
                data: { ...data },
                // Set default styles for Trust Zones to be large enough
                style: type === 'otmTrustZone' ? { width: 400, height: 300 } : undefined
            };
            
            addNode(newNode);
        },
        [screenToFlowPosition, addNode],
    );

    return (
        <div className="h-screen w-full flex flex-col bg-slate-100">
            <TopBar />
            <div className="flex-grow flex flex-row h-full overflow-hidden relative">
                <StencilPanel />
                <div className="flex-grow h-full relative" ref={reactFlowWrapper}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={onNodeClick}
                        onPaneClick={onPaneClick}
                        nodeTypes={nodeTypes}
                        selectionMode={SelectionMode.Partial}
                        onDragOver={onDragOver}
                        onDrop={onDrop}
                        fitView
                    >
                        <Background gap={20} size={1} color="#e2e8f0" />
                        <Controls className="bg-white shadow-md border-slate-200" />
                    </ReactFlow>
                    <ThreatsPanel />
                </div>
                <PropertiesPanel />
            </div>
        </div>
    );
}

export default function EditorCanvas() {
    return (
        <ReactFlowProvider>
            <EditorContent />
        </ReactFlowProvider>
    );
}
