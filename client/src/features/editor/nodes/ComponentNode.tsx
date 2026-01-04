import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react'; // <--- FIXED
import { Database, Server, Globe, Box } from 'lucide-react';
import clsx from 'clsx';
import { type OTMNodeData } from '../../../store/diagramStore'; // <--- FIXED

const getIcon = (type?: string) => {
    switch (type) {
        case 'database': return <Database size={16} />;
        case 'web-server': return <Globe size={16} />;
        case 'microservice': return <Server size={16} />;
        default: return <Box size={16} />;
    }
}

const ComponentNode = memo(({ data, selected }: NodeProps<OTMNodeData>) => {
    return (
        <div
            className={clsx(
                'flex items-center gap-2 rounded-lg border bg-white px-4 py-2 shadow-sm transition-all w-[180px]',
                selected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'
            )}
        >
            <Handle type="target" position={Position.Left} className="!bg-slate-400" />

            <div className="text-slate-500">
                {getIcon(data.otmType)}
            </div>
            <div>
                <div className="font-semibold text-sm text-slate-800 truncate">{data.label}</div>
                <div className="text-xs text-slate-500 truncate">{data.otmType || 'Generic Component'}</div>
            </div>

            <Handle type="source" position={Position.Right} className="!bg-slate-400" />
        </div>
    );
});

export default ComponentNode;
