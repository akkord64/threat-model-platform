import { useDiagramStore, AppNode } from "../../store/diagramStore";
import { X, Settings2 } from 'lucide-react';

export default function PropertiesPanel() {
    // Connect to store
    const { nodes, selectedNodeId, setSelectedNode, updateNodeData } = useDiagramStore();

    // Find selected node
    const selectedNode = nodes.find((n) => n.id === selectedNodeId);

    if (!selectedNode) {
        return (
            <div className="w-80 border-l border-slate-200 bg-slate-50 p-4 text-slate-500 text-sm flex flex-col items-center justify-center gap-2">
                <Settings2 size={32} className="text-slate-300" />
                <p>Select a Component or Trust Zone to edit properties.</p>
            </div>
        );
    }

    // Generic handler for text inputs
    const handleInputChange = (field: string, value: string) => {
        updateNodeData(selectedNode.id, { [field]: value });
    };

    return (
        <div className="w-80 h-full border-l border-slate-200 bg-white flex flex-col font-sans shadow-xl z-10 relative">
             {/* Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Settings2 size={18}/> Properties
                </h2>
                <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-slate-600">
                    <X size={18} />
                </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-6">
                {/* ID Readonly Field */}
                 <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Node ID</label>
                    <input disabled value={selectedNode.id} className="w-full text-sm p-2 bg-slate-100 rounded border-slate-200 text-slate-500 font-mono"/>
                </div>

                {/* Common Field: Name/Label */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                    <input
                        type="text"
                        value={selectedNode.data.label}
                        onChange={(e) => handleInputChange('label', e.target.value)}
                        className="w-full p-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition-all"
                    />
                </div>

                {/* ---- COMPONENT SPECIFIC FIELDS ---- */}
                {selectedNode.type === 'otmComponent' && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">OTM Type</label>
                             <select
                                value={selectedNode.data.otmType || ''}
                                onChange={(e) => handleInputChange('otmType', e.target.value)}
                                className="w-full p-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-200 outline-none bg-white"
                            >
                                <option value="microservice">Microservice</option>
                                <option value="database">Database</option>
                                <option value="web-server">Web Server</option>
                                <option value="message-broker">Message Broker</option>
                                <option value="storage">Storage / S3</option>
                                <option value="generic-client">Client / Browser</option>
                            </select>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Tags (comma separated)</label>
                             <input
                                type="text"
                                placeholder="e.g. pii, public, java"
                                value={selectedNode.data.tags?.join(', ') || ''}
                                // Simple split logic for MVP
                                onChange={(e) => updateNodeData(selectedNode.id, { tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                                className="w-full p-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-200 outline-none"
                            />
                        </div>
                    </>
                )}

                 {/* ---- TRUST ZONE SPECIFIC FIELDS ---- */}
                 {selectedNode.type === 'otmTrustZone' && (
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1">
                            <ShieldAlert size={14}/> Risk Ratings (0-100)
                        </h3>
                        {['confidentiality', 'integrity', 'availability'].map((riskType) => {
                            const currentRisk = selectedNode.data.risk as any || {};
                            const val = currentRisk[riskType] || 0;
                            return (
                            <div key={riskType} className="mb-3 last:mb-0">
                                <div className="flex justify-between text-xs text-slate-600 mb-1 capitalize">
                                    <span>{riskType}</span>
                                    <span className="font-mono">{val}</span>
                                </div>
                                <input
                                    type="range" min="0" max="100"
                                    value={val}
                                    onChange={(e) => {
                                        const newRisk = { ...currentRisk, [riskType]: parseInt(e.target.value) };
                                        updateNodeData(selectedNode.id, { risk: newRisk });
                                    }}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                            </div>
                        )})}
                    </div>
                )}
            </div>
        </div>
    );
}
