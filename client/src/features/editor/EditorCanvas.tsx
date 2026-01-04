import { ReactFlow, Background, Controls, SelectionMode, type NodeTypes, type Node } from '@xyflow/react'; // <--- FIXED
import '@xyflow/react/dist/style.css';

import { useDiagramStore } from '../../store/diagramStore';
import TrustZoneNode from './nodes/TrustZoneNode';
import ComponentNode from './nodes/ComponentNode';
import PropertiesPanel from './PropertiesPanel';

const nodeTypes: NodeTypes = {
    otmTrustZone: TrustZoneNode,
    otmComponent: ComponentNode,
};

export default function EditorCanvas() {
    const { nodes, edges, onNodesChange, onEdgesChange, setSelectedNode } = useDiagramStore();

    const onNodeClick = (_: React.MouseEvent, node: Node) => {
        setSelectedNode(node.id);
    };

    const onPaneClick = () => {
        setSelectedNode(null);
    };

    return (
        <div className="h-screen w-full flex flex-row bg-slate-100">
            <div className="flex-grow h-full relative">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeClick={onNodeClick}
                    onPaneClick={onPaneClick}
                    nodeTypes={nodeTypes}
                    selectionMode={SelectionMode.Partial}
                    fitView
                >
                    <Background gap={20} size={1} color="#e2e8f0" />
                    <Controls className="bg-white shadow-md border-slate-200" />
                </ReactFlow>
            </div>
            <PropertiesPanel />
        </div>
    );
}
