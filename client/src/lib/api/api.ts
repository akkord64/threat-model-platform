import axios from 'axios';
import type { RuleTemplate } from '../../store/adminStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export type OTMProject = {
    otmVersion: string;
    project: { id: string; name: string };
    trustZones: any[];
    components: any[];
    dataflows: any[];
};

export type Threat = {
    id: string;
    ruleId: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'mitigated' | 'accepted';
    componentId?: string;
    mitigation?: string;
};

export type AnalysisReport = {
    projectId: string;
    timestamp: string;
    threats: Threat[];
    summary: {
        total: number;
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
};

export const api = {
    parseDiagram: async (projectId: string, projectName: string, nodes: any[], edges: any[]) => {
        const response = await axios.post<OTMProject>(`${API_URL}/diagrams/parse`, {
            projectId,
            projectName,
            nodes,
            edges
        });
        return response.data;
    },

    analyzeDiagram: async (projectId: string, projectName: string, nodes: any[], edges: any[], customRules?: RuleTemplate[]) => {
        const response = await axios.post<AnalysisReport>(`${API_URL}/diagrams/analyze`, {
            projectId,
            projectName,
            nodes,
            edges,
            customRules
        });
        return response.data;
    },

    saveToGithub: async (projectId: string, projectName: string, nodes: any[], edges: any[], filename: string, commitMessage: string) => {
        const response = await axios.post(`${API_URL}/diagrams/save-to-github`, {
            projectId,
            projectName,
            nodes,
            edges,
            filename,
            commitMessage
        });
        return response.data;
    },

    importIaC: async (iacType: string, content: string, mapping?: string) => {
        const response = await axios.post<OTMProject>(`${API_URL}/diagrams/import-iac`, {
            iacType,
            content,
            mapping
        });
        return response.data;
    },

    fetchGithubFile: async (repo: string, path: string, token: string) => {
        const response = await axios.post<{ content: string }>(`${API_URL}/diagrams/github/fetch-file`, {
            repo,
            path,
            token
        });
        return response.data;
    },

    pushGithubFile: async (repo: string, path: string, content: string, message: string, token: string) => {
        const response = await axios.post(`${API_URL}/diagrams/github/push-file`, {
            repo,
            path,
            content,
            message,
            token
        });
        return response.data;
    }
};
