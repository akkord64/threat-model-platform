import { DragEvent } from 'react';
import { Database, Server, Globe, Box, Shield, Cloud, Smartphone, Monitor } from 'lucide-react';
import { type OTMNodeData } from '../../store/diagramStore';
import { useAdminStore, type ComponentTemplate } from '../../store/adminStore';

type StencilItem = {
    label: string;
    type: 'otmComponent' | 'otmTrustZone';
    otmType?: string; // For components
    icon: React.ReactNode;
    defaultData: Partial<OTMNodeData>;
};

const DEFAULT_STENCILS: StencilItem[] = [
    {
        label: 'Trust Zone',
        type: 'otmTrustZone',
        icon: <Shield size={20} />,
        defaultData: { label: 'New Trust Zone', risk: { confidentiality: 50, integrity: 50, availability: 50 } }
    }
];

const getIconByName = (name: string) => {
    switch (name.toLowerCase()) {
        case 'database': return <Database size={20} />;
        case 'server': return <Server size={20} />;
        case 'globe': return <Globe size={20} />;
        case 'cloud': return <Cloud size={20} />;
        case 'smartphone': return <Smartphone size={20} />;
        case 'monitor': return <Monitor size={20} />;
        case 'shield': return <Shield size={20} />;
        default: return <Box size={20} />;
    }
};

export default function StencilPanel() {
    const { componentTemplates } = useAdminStore();

    const onDragStart = (event: DragEvent, item: StencilItem) => {
        event.dataTransfer.setData('application/reactflow', JSON.stringify({
            type: item.type,
            data: item.defaultData
        }));
        event.dataTransfer.effectAllowed = 'move';
    };

    // Merge default stencils (Trust Zone) with dynamic templates
    const items: StencilItem[] = [
        ...DEFAULT_STENCILS,
        ...componentTemplates.map(t => ({
            label: t.label,
            type: t.type,
            otmType: t.otmType,
            icon: getIconByName(t.icon),
            defaultData: t.defaultData
        }))
    ];

    // If no dynamic templates, fallback to some hardcoded defaults for MVP experience
    const finalItems = items.length > 1 ? items : [
        ...items,
        { label: 'Web Server', type: 'otmComponent', otmType: 'web-server', icon: <Globe size={20}/>, defaultData: { label: 'Web Server', otmType: 'web-server' } },
        { label: 'Database', type: 'otmComponent', otmType: 'database', icon: <Database size={20}/>, defaultData: { label: 'Database', otmType: 'database' } },
        { label: 'Cloud Storage', type: 'otmComponent', otmType: 'storage', icon: <Cloud size={20}/>, defaultData: { label: 'Storage', otmType: 'storage' } },
    ] as StencilItem[];

    return (
        <div className="w-48 bg-white border-r border-slate-200 flex flex-col h-full z-10 shadow-md">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-semibold text-slate-700 text-sm">Palette</h3>
                <p className="text-xs text-slate-400 mt-1">Drag to canvas</p>
            </div>
            
            <div className="p-3 space-y-3 overflow-y-auto">
                {finalItems.map((item, idx) => (
                    <div
                        key={idx}
                        className="flex items-center gap-3 p-2 rounded border border-slate-200 bg-white hover:border-blue-400 hover:shadow-sm cursor-grab active:cursor-grabbing transition-all select-none"
                        onDragStart={(event) => onDragStart(event, item)}
                        draggable
                    >
                        <div className="text-slate-500">{item.icon}</div>
                        <div className="text-sm font-medium text-slate-700">{item.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
