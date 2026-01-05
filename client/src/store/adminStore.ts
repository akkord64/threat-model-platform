import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type OTMNodeData } from '../store/diagramStore';

// --- Types ---

export type ComponentTemplate = {
    label: string;
    type: 'otmComponent' | 'otmTrustZone';
    otmType?: string;
    icon: string; // string identifier for icon component
    defaultData: Partial<OTMNodeData>;
};

export type RuleCriterion = {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'missing' | 'exists';
    value?: any;
};

export type RuleTemplate = {
    id: string;
    title: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    mitigation?: string;
    target: 'component' | 'trustZone';
    criteria: RuleCriterion[];
};

type AdminState = {
    githubToken: string | null;
    templateRepo: string; // "owner/repo"
    componentPath: string; // "templates/components.json"
    rulePath: string; // "templates/rules.json"
    
    componentTemplates: ComponentTemplate[];
    ruleTemplates: RuleTemplate[];

    setGithubToken: (token: string | null) => void;
    setRepoConfig: (repo: string, compPath: string, rulePath: string) => void;
    setComponentTemplates: (templates: ComponentTemplate[]) => void;
    setRuleTemplates: (templates: RuleTemplate[]) => void;
};

export const useAdminStore = create<AdminState>()(
    persist(
        (set) => ({
            githubToken: null,
            templateRepo: "",
            componentPath: "templates/components.json",
            rulePath: "templates/rules.json",
            componentTemplates: [],
            ruleTemplates: [],

            setGithubToken: (token) => set({ githubToken: token }),
            setRepoConfig: (repo, compPath, rulePath) => set({ templateRepo: repo, componentPath: compPath, rulePath: rulePath }),
            setComponentTemplates: (templates) => set({ componentTemplates: templates }),
            setRuleTemplates: (templates) => set({ ruleTemplates: templates }),
        }),
        {
            name: 'admin-storage', // localstorage key
        }
    )
);
