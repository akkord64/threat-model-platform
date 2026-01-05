import { useState, useRef } from 'react';
import { useDiagramStore, type AppNode } from '../../store/diagramStore';
import { useAdminStore } from '../../store/adminStore';
import { api, type OTMProject } from '../../lib/api/api';
import { Save, Upload, ShieldAlert, Layout, FileText, Download, FileUp, FolderOpen, PlusSquare, FileCode, FileSymlink, Settings } from 'lucide-react';
import { type Edge } from '@xyflow/react';
import { getLayoutedElements } from '../../lib/layout';
import yaml from 'js-yaml';
import AdminSettingsModal from './AdminSettingsModal';

export default function TopBar() {
    const { nodes, edges, loadDiagram, setAnalysisReport } = useDiagramStore();
    const { ruleTemplates } = useAdminStore();
    const [isLoading, setIsLoading] = useState(false);
    const [showAdmin, setShowAdmin] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const otmInputRef = useRef<HTMLInputElement>(null);

    // --- File Menu Actions ---

    const handleNew = () => {
        if (confirm("Are you sure you want to create a new model? Unsaved changes will be lost.")) {
            loadDiagram([], []);
            setAnalysisReport(null);
        }
    };

    const handleSaveJSON = () => {
        const data = {
            nodes,
            edges,
            version: "1.0"
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'threat-model.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleLoadJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            if (nodes.length > 0) {
                if (!confirm("This will overwrite your current model. Continue?")) {
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    return;
                }
            }
            try {
                const content = e.target?.result as string;
                const data = JSON.parse(content);
                if (data.nodes && data.edges) {
                    loadDiagram(data.nodes, data.edges);
                    setAnalysisReport(null);
                } else {
                    alert("Invalid JSON file format. Missing nodes or edges.");
                }
            } catch (err) {
                console.error(err);
                alert("Failed to parse JSON file.");
            }
        };
        reader.readAsText(file);
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleTriggerLoad = () => {
        fileInputRef.current?.click();
    };

    // --- OTM YAML Import/Export ---

    const handleImportOTM = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            if (nodes.length > 0) {
                if (!confirm("This will overwrite your current model. Continue?")) {
                    if (otmInputRef.current) otmInputRef.current.value = '';
                    return;
                }
            }
            try {
                const content = e.target?.result as string;
                // Parse YAML to JS Object
                const data = yaml.load(content) as OTMProject;
                
                if (data.otmVersion && data.trustZones) {
                    convertOtmToDiagram(data);
                    alert("OTM Model imported successfully!");
                } else {
                    alert("Invalid OTM file format. Missing mandatory fields.");
                }
            } catch (err) {
                console.error(err);
                alert("Failed to parse OTM YAML file.");
            }
        };
        reader.readAsText(file);
        if (otmInputRef.current) otmInputRef.current.value = '';
    };

    const handleTriggerImportOTM = () => {
        otmInputRef.current?.click();
    };

    const handleExportOTM = async () => {
        const projectId = prompt("Enter Project ID:", "my-threat-model");
        if (!projectId) return;
        const projectName = prompt("Enter Project Name:", "My System");
        
        setIsLoading(true);
        try {
            // Get OTM Object from backend (or we could map locally, but backend validates)
            const otm = await api.parseDiagram(projectId, projectName || "Untitled", nodes, edges);
            
            // Dump to YAML
            const yamlStr = yaml.dump(otm);
            
            // Download
            const blob = new Blob([yamlStr], { type: 'text/yaml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${projectId}.otm.yaml`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
            alert("Failed to export OTM. Check console.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAutoLayout = () => {
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            nodes,
            edges,
            'TB' // Top-Bottom
        );
        loadDiagram(layoutedNodes, layoutedEdges);
    };

    // --- Existing Actions ---

    const handleSaveToGitHub = async () => {
        const projectId = prompt("Enter Project ID:", "my-threat-model");
        if (!projectId) return;
        const projectName = prompt("Enter Project Name:", "My System");
        const filename = prompt("Enter Filename (e.g., model.otm):", "model.otm");
        const message = prompt("Commit Message:", "Update threat model");

        if (projectId && projectName && filename && message) {
            setIsLoading(true);
            try {
                await api.saveToGithub(projectId, projectName, nodes, edges, filename, message);
                alert("Successfully saved to GitHub!");
            } catch (error) {
                console.error(error);
                alert("Failed to save to GitHub. Check console/server logs.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleImportIaC = async () => {
        if (nodes.length > 0) {
            if (!confirm("This will overwrite your current model. Continue?")) return;
        }

        const iacType = prompt("Enter IaC Type (terraform, cloudformation):", "terraform");
        const content = prompt("Paste IaC Content here:");
        
        if (iacType && content) {
            setIsLoading(true);
            try {
                const otm = await api.importIaC(iacType, content);
                convertOtmToDiagram(otm);
                alert("Imported successfully!");
            } catch (error) {
                 console.error(error);
                 alert("Failed to import IaC. Check console/server logs.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleAnalyze = async () => {
        setIsLoading(true);
        try {
            // Pass dynamic rule templates to the backend analysis
            const report = await api.analyzeDiagram("preview-id", "Preview System", nodes, edges, ruleTemplates);
            setAnalysisReport(report);
            if (report.threats.length === 0) {
                alert("Analysis Complete: No threats found.");
            }
        } catch (error) {
            console.error(error);
            alert("Analysis Failed. Check console.");
        } finally {
            setIsLoading(false);
        }
    };

    const convertOtmToDiagram = (otm: OTMProject) => {
        const newNodes: AppNode[] = [];
        const newEdges: Edge[] = [];
        
        otm.trustZones.forEach((tz, index) => {
            newNodes.push({
                id: tz.id,
                type: 'otmTrustZone',
                position: { x: index * 500, y: 0 },
                data: { label: tz.name, description: tz.description, risk: tz.risk },
                style: { width: 400, height: 400 } 
            });
        });

        otm.components.forEach((comp, index) => {
            // OTM 'parent' can be a string (simplified) or an object { trustZone: "id" } / { component: "id" }
            let parentId = null;
            if (typeof comp.parent === 'string') {
                parentId = comp.parent;
            } else if (typeof comp.parent === 'object' && comp.parent !== null) {
                // @ts-ignore
                parentId = comp.parent.trustZone || comp.parent.component || null;
            }

            newNodes.push({
                id: comp.id,
                type: 'otmComponent',
                position: { x: 50 + (index * 20), y: 50 + (index * 50) }, 
                parentNode: parentId,
                extent: 'parent', 
                data: { label: comp.name, otmType: comp.type, tags: comp.tags }
            });
        });

        otm.dataflows.forEach((df) => {
             newEdges.push({
                 id: df.id,
                 source: df.source,
                 target: df.destination,
                 label: df.name
             });
        });

        loadDiagram(newNodes, newEdges);
    };

    return (
        <div className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between shadow-sm z-20 relative">
            <div className="flex items-center gap-2 font-bold text-slate-700 text-lg">
                <span>🛡️ Threat Model Platform</span>
            </div>
            
            <div className="flex items-center gap-2">
                {/* File Management Group */}
                <div className="flex items-center bg-slate-100 rounded p-1 mr-2">
                    <button onClick={handleNew} title="New Model" className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-white rounded transition-colors">
                        <PlusSquare size={18} />
                    </button>
                    
                    <div className="w-px h-4 bg-slate-300 mx-1"></div>

                    <button onClick={handleTriggerLoad} title="Open JSON" className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-white rounded transition-colors">
                        <FolderOpen size={18} />
                    </button>
                    <button onClick={handleSaveJSON} title="Save JSON" className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-white rounded transition-colors">
                        <Download size={18} />
                    </button>
                    
                     <div className="w-px h-4 bg-slate-300 mx-1"></div>

                    <button onClick={handleTriggerImportOTM} title="Import OTM (YAML)" className="p-1.5 text-slate-600 hover:text-purple-600 hover:bg-white rounded transition-colors">
                        <FileCode size={18} />
                    </button>
                    <button onClick={handleExportOTM} title="Export OTM (YAML)" className="p-1.5 text-slate-600 hover:text-purple-600 hover:bg-white rounded transition-colors">
                        <FileSymlink size={18} />
                    </button>

                     <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleLoadJSON} 
                        accept=".json" 
                        className="hidden" 
                    />
                     <input 
                        type="file" 
                        ref={otmInputRef} 
                        onChange={handleImportOTM} 
                        accept=".yaml,.yml" 
                        className="hidden" 
                    />
                </div>

                {/* Auto Layout */}
                 <button 
                    onClick={handleAutoLayout}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded transition-colors"
                >
                    <Layout size={16} /> Layout
                </button>

                <div className="w-px h-6 bg-slate-300 mx-1"></div>

                {/* Analysis & Remote Actions */}
                 <button 
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded transition-colors disabled:opacity-50"
                >
                    <ShieldAlert size={16} /> Analyze
                </button>

                <button 
                    onClick={handleImportIaC}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors disabled:opacity-50"
                >
                    <FileUp size={16} /> Import IaC
                </button>
                
                <button 
                    onClick={handleSaveToGitHub}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50"
                >
                    <Save size={16} /> Push to GitHub
                </button>

                <div className="w-px h-6 bg-slate-300 mx-1"></div>

                <button 
                    onClick={() => setShowAdmin(true)}
                    className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                    title="Settings & Templates"
                >
                    <Settings size={20} />
                </button>
            </div>

            <AdminSettingsModal isOpen={showAdmin} onClose={() => setShowAdmin(false)} />
        </div>
    );
}
