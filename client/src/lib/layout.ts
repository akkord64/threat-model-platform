import dagre from 'dagre';
import { Position, type Node, type Edge } from '@xyflow/react';
import { type AppNode } from '../store/diagramStore';

export const getLayoutedElements = (nodes: AppNode[], edges: Edge[], direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph({ compound: true });
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
        if (node.type === 'otmTrustZone') {
            // It's a container. We don't set specific width/height, 
            // but we provide padding so child nodes aren't flush against the border.
            // paddingTop covers the header area.
            dagreGraph.setNode(node.id, { 
                label: node.data.label,
                paddingLeft: 40,
                paddingRight: 40,
                paddingTop: 60, 
                paddingBottom: 40
            });
        } else {
            // Leaf nodes (Components)
            // Use measured dimensions if available, else default
            const width = node.measured?.width || (node.style?.width as number) || 180;
            const height = node.measured?.height || (node.style?.height as number) || 80;
            dagreGraph.setNode(node.id, { width, height });
        }
    });

    // Set parent relationships
    nodes.forEach((node) => {
        if (node.parentNode) {
            dagreGraph.setParent(node.id, node.parentNode);
        }
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        const isHorizontal = direction === 'LR';

        // Dagre returns the center point (x, y) and dimensions (width, height)
        // We need to convert to Top-Left for React Flow.
        const width = nodeWithPosition.width;
        const height = nodeWithPosition.height;
        
        const absX = nodeWithPosition.x - width / 2;
        const absY = nodeWithPosition.y - height / 2;

        let posX = absX;
        let posY = absY;

        // If the node has a parent, React Flow expects coordinates relative to the parent.
        if (node.parentNode) {
            const parentWithPosition = dagreGraph.node(node.parentNode);
            
            // Safety check: Parent might not be in the graph if data is inconsistent
            if (parentWithPosition) {
                const parentAbsX = parentWithPosition.x - parentWithPosition.width / 2;
                const parentAbsY = parentWithPosition.y - parentWithPosition.height / 2;
                
                posX = absX - parentAbsX;
                posY = absY - parentAbsY;
            } else {
                console.warn(`Parent node ${node.parentNode} not found in layout graph for child ${node.id}`);
            }
        }

        return {
            ...node,
            targetPosition: isHorizontal ? Position.Left : Position.Top,
            sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
            position: {
                x: posX,
                y: posY,
            },
            style: {
                ...node.style,
                // Update dimensions, especially important for Trust Zones (compound nodes)
                width,
                height,
            },
        };
    });

    return { nodes: layoutedNodes, edges };
};
