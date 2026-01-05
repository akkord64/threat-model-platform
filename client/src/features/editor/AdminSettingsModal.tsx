import { useState } from 'react';
import { useAdminStore, type ComponentTemplate, type RuleTemplate } from '../../store/adminStore';
import { api } from '../../lib/api/api';
import { X, Save, RefreshCw, Settings, Github } from 'lucide-react';

export default function AdminSettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { 
        githubToken, setGithubToken, 
        templateRepo, componentPath, rulePath, setRepoConfig,
        componentTemplates, setComponentTemplates,
        ruleTemplates, setRuleTemplates
    } = useAdminStore();

    const [activeTab, setActiveTab] = useState<'settings' | 'components' | 'rules'>('settings');
    const [localToken, setLocalToken] = useState(githubToken || '');
    const [localRepo, setLocalRepo] = useState(templateRepo || '');
    const [localCompPath, setLocalCompPath] = useState(componentPath || 'templates/components.json');
    const [localRulePath, setLocalRulePath] = useState(rulePath || 'templates/rules.json');
    const [status, setStatus] = useState<string>('');

    // Editors content
    const [compEditor, setCompEditor] = useState(JSON.stringify(componentTemplates, null, 2));
    const [ruleEditor, setRuleEditor] = useState(JSON.stringify(ruleTemplates, null, 2));

    if (!isOpen) return null;

    const handleSaveSettings = () => {
        setGithubToken(localToken);
        setRepoConfig(localRepo, localCompPath, localRulePath);
        setStatus('Settings saved!');
        setTimeout(() => setStatus(''), 2000);
    };

    const handlePull = async (type: 'components' | 'rules') => {
        if (!localToken || !localRepo) {
            setStatus('Error: Missing Token or Repo');
            return;
        }
        setStatus('Fetching...');
        try {
            const path = type === 'components' ? localCompPath : localRulePath;
            console.log(`[AdminSettings] Pulling ${type} from ${localRepo}/${path}`);
            
            const res = await api.fetchGithubFile(localRepo, path, localToken);
            console.log(`[AdminSettings] Received content:`, res);
            
            const content = JSON.parse(res.content); // Expecting JSON content
            
            if (type === 'components') {
                setComponentTemplates(content);
                setCompEditor(JSON.stringify(content, null, 2));
            } else {
                setRuleTemplates(content);
                setRuleEditor(JSON.stringify(content, null, 2));
            }
            setStatus(`Successfully fetched ${type}!`);
        } catch (e: any) {
            console.error(`[AdminSettings] Pull failed:`, e);
            setStatus(`Error: ${e.message || 'Fetch failed'}`);
        }
    };

    const handlePush = async (type: 'components' | 'rules') => {
        if (!localToken || !localRepo) {
            setStatus('Error: Missing Token or Repo');
            return;
        }
        if (!confirm(`Are you sure you want to overwrite ${type} in GitHub?`)) return;

        setStatus('Pushing...');
        try {
            const path = type === 'components' ? localCompPath : localRulePath;
            const content = type === 'components' ? compEditor : ruleEditor;
            
            // Validate JSON
            JSON.parse(content); 

            await api.pushGithubFile(localRepo, path, content, `Update ${type} templates`, localToken);
            
            // Update store
            if (type === 'components') setComponentTemplates(JSON.parse(content));
            else setRuleTemplates(JSON.parse(content));

            setStatus(`Successfully pushed ${type}!`);
        } catch (e: any) {
            setStatus(`Error: ${e.message || 'Push failed'}`);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-2xl w-[800px] h-[600px] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-lg">
                    <h2 className="font-bold text-lg text-slate-700 flex items-center gap-2">
                        <Settings size={20} /> Template Administration
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200">
                    <button 
                        onClick={() => setActiveTab('settings')}
                        className={`px-4 py-2 text-sm font-medium ${activeTab === 'settings' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        Settings
                    </button>
                    <button 
                        onClick={() => setActiveTab('components')}
                        className={`px-4 py-2 text-sm font-medium ${activeTab === 'components' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        Component Templates
                    </button>
                    <button 
                        onClick={() => setActiveTab('rules')}
                        className={`px-4 py-2 text-sm font-medium ${activeTab === 'rules' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        Threat Rules
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                    {status && <div className="mb-4 p-2 bg-yellow-50 text-yellow-800 text-sm rounded border border-yellow-200">{status}</div>}

                    {activeTab === 'settings' && (
                        <div className="space-y-4 max-w-md">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">GitHub Personal Access Token (PAT)</label>
                                <input 
                                    type="password" 
                                    value={localToken} 
                                    onChange={(e) => setLocalToken(e.target.value)}
                                    className="w-full p-2 border rounded text-sm font-mono"
                                    placeholder="ghp_..."
                                />
                                <p className="text-xs text-slate-500 mt-1">Stored locally in your browser.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Template Repository (owner/repo)</label>
                                <input 
                                    type="text" 
                                    value={localRepo} 
                                    onChange={(e) => setLocalRepo(e.target.value)}
                                    className="w-full p-2 border rounded text-sm"
                                    placeholder="my-org/threat-templates"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Components Path</label>
                                    <input 
                                        type="text" 
                                        value={localCompPath} 
                                        onChange={(e) => setLocalCompPath(e.target.value)}
                                        className="w-full p-2 border rounded text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Rules Path</label>
                                    <input 
                                        type="text" 
                                        value={localRulePath} 
                                        onChange={(e) => setLocalRulePath(e.target.value)}
                                        className="w-full p-2 border rounded text-sm"
                                    />
                                </div>
                            </div>
                            <button onClick={handleSaveSettings} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">Save Configuration</button>
                        </div>
                    )}

                    {(activeTab === 'components' || activeTab === 'rules') && (
                        <div className="h-full flex flex-col">
                            <div className="flex justify-between mb-2">
                                <div className="text-xs text-slate-500">
                                    Edit JSON below. Click Pull to fetch from GitHub, Push to save back.
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handlePull(activeTab as any)} className="flex items-center gap-1 px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded border">
                                        <RefreshCw size={12}/> Pull from GitHub
                                    </button>
                                    <button onClick={() => handlePush(activeTab as any)} className="flex items-center gap-1 px-3 py-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 rounded border border-green-200">
                                        <Github size={12}/> Push to GitHub
                                    </button>
                                </div>
                            </div>
                            <textarea
                                className="flex-1 w-full font-mono text-xs p-2 border border-slate-300 rounded resize-none focus:outline-none focus:border-blue-400"
                                value={activeTab === 'components' ? compEditor : ruleEditor}
                                onChange={(e) => activeTab === 'components' ? setCompEditor(e.target.value) : setRuleEditor(e.target.value)}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
