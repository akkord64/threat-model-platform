import { useDiagramStore } from "../../store/diagramStore";
import { AlertTriangle, X, ShieldCheck, Info } from 'lucide-react';
import clsx from 'clsx';

export default function ThreatsPanel() {
    const { analysisReport, setAnalysisReport, setSelectedNode } = useDiagramStore();

    if (!analysisReport) return null;

    const severityColor = (sev: string) => {
        switch (sev) {
            case 'critical': return 'bg-red-100 text-red-800 border-red-200';
            case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    return (
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20 flex flex-col transition-all">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-4">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <AlertTriangle size={18} className="text-orange-500" />
                        Threat Analysis Report
                    </h3>
                    <div className="flex gap-2 text-xs">
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Critical: {analysisReport.summary.critical}</span>
                        <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">High: {analysisReport.summary.high}</span>
                        <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">Medium: {analysisReport.summary.medium}</span>
                    </div>
                </div>
                <button onClick={() => setAnalysisReport(null)} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 bg-slate-50/50">
                {analysisReport.threats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                        <ShieldCheck size={48} className="text-green-500" />
                        <p>No threats detected based on current rules.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {analysisReport.threats.map((threat) => (
                            <div 
                                key={threat.id} 
                                className={clsx(
                                    "border rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col gap-1",
                                    severityColor(threat.severity)
                                )}
                                onClick={() => threat.componentId && setSelectedNode(threat.componentId)}
                            >
                                <div className="flex justify-between items-start">
                                    <span className="font-bold text-sm">{threat.title}</span>
                                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">{threat.severity}</span>
                                </div>
                                <p className="text-xs opacity-90">{threat.description}</p>
                                {threat.mitigation && (
                                    <div className="mt-2 text-xs flex items-start gap-1 p-2 bg-white/50 rounded">
                                        <Info size={12} className="mt-0.5 shrink-0" />
                                        <span><span className="font-semibold">Mitigation:</span> {threat.mitigation}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
