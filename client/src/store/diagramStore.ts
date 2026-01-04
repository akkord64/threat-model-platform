import { create } from 'zustand';
import {
    applyNodeChanges,
    applyEdgeChanges,
    type Edge,            // <--- FIXED
    type Node,            // <--- FIXED
    type OnNodesChange,   // <--- FIXED
    type OnEdgesChange,   // <--- FIXED
    type NodeChange       // <--- FIXED
} from '@xyflow/react';

export type OTMNodeData = {
    label: string;
    description?: string;
    otmType?: string;
    tags?: string[];
    risk?: {
        confidentiality: number;
        integrity: number;
        availability: number;
    };
    attributes?: Record<string, any>;
};

export type AppNode = Node<OTMNodeData>;

type DiagramState = {
    nodes: AppNode[];
    edges: Edge[];
    selectedNodeId: string | null;

    onNodesChange: OnNodesChange<AppNode>;
    onEdgesChange: OnEdgesChange;
    setSelectedNode: (id: string | null) => void;
    updateNodeData: (id: string, newData: Partial<OTMNodeData>) => void;
};

export const useDiagramStore = create<DiagramState>((set, get) => ({
    nodes: [
        {
            id: 'tz-1',
            type: 'otmTrustZone',
            position: { x: 100, y: 100 },
            data: { label: 'Public Internet', risk: { confidentiality: 10, integrity: 10, availability: 10 } },
            style: { width: 400, height: 300 },
        },
        {
            id: 'c-1',
            type: 'otmComponent',
            position: { x: 50, y: 50 },
            data: { label: 'Web Load Balancer', otmType: 'reverse-proxy', tags: ['nginx'] },
            parentNode: 'tz-1',
            extent: 'parent',
        },
    ],
    edges: [],
    selectedNodeId: null,

    onNodesChange: (changes: NodeChange<AppNode>[]) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes) as AppNode[],
        });
    },
    onEdgesChange: (changes) => {
        set({
            edges: applyEdgeChanges(changes, get().edges),
        });
    },

    setSelectedNode: (id) => {
        set({ selectedNodeId: id });
    },

    updateNodeData: (id, newData) => {
        set((state) => ({
            nodes: state.nodes.map((node) =>
                node.id === id
                    ? { ...node, data: { ...node.data, ...newData } }
                    : node
            ),
        }));
    },
}));
