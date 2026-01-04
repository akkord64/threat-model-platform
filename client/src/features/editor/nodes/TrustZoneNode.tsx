import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react'; // <--- FIXED
import { ShieldAlert } from 'lucide-react';
import clsx from 'clsx';
import { type OTMNodeData } from '../../../store/diagramStore'; // <--- FIXED

const TrustZoneNode = memo(({ data, selected }: NodeProps<OTMNodeData>) => {
    // Default to 0 if risk is undefined
    const risk = data.risk || { confidentiality: 0, integrity: 0, availability: 0 };
    const avgRisk = Math.round((risk.confidentiality + risk.integrity + risk.availability) / 3);

    return (
        <div
            className={clsx(
                'h-full w-full rounded-md border-2 border-dashed bg-slate-50/50 p-4 transition-colors',
                selected ? 'border-blue-500 shadow-lg' : 'border-slate-300 hover:border-slate-400'
            )}
        >
            <Handle type="target" position={Position.Top} className="!bg-slate-400" />

            <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                   <ShieldAlert className="text-slate-500" size={20}/>
                   <span className="font-bold text-slate-700">{data.label}</span>
                </div>
                <div className={clsx("text-xs font-mono px-2 py-0.5 rounded",
                     avgRisk > 70 ? "bg-red-100 text-red-800" : "bg-slate-200 text-slate-600"
                )}>
                    Risk: {avgRisk}
                </div>
            </div>

            <div className="text-xs text-slate-400 italic">Trust Zone Boundary</div>

            <Handle type="source" position={Position.Bottom} className="!bg-slate-400" />
        </div>
    );
});

export default TrustZoneNode;
