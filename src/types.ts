// ==========================================
// Consolidated Types - Centralized type definitions
// ==========================================

import type { TFile } from 'obsidian';

// ==========================================
// Frontmatter Types (from frontmatter/types.ts)
// ==========================================

export type LinkType = 'WikiLink' | 'Normal';

export interface Range {
	min: number;
	max: number;
}

export interface FrontmatterField {
	id: number;
	name: string;
	count: Range;
	refs: string[];
	overwrite: boolean;
	linkType: LinkType;
	customQuery: string;
}

export interface FrontMatter {
	[key: string]: string[];
}

export type ProcessFrontMatterFn = (
	file: TFile,
	fn: (frontmatter: FrontMatter) => void
) => Promise<void>;

export interface InsertFrontMatterParams
	extends Pick<FrontmatterField, 'name' | 'overwrite' | 'linkType'> {
	file: TFile;
	value: string[];
}

// ==========================================
// Provider Types (from api/types.ts)
// ==========================================

export interface Model {
	id: string;
	name: string;
}

export interface ProviderBase {
	name: string;
	baseUrl: string;
	temperature?: number;
	models: Model[];
	apiKey: string;
}

export type ProviderConfig = ProviderBase;

export interface StructuredOutput {
	output: string[];
	reliability: number;
}

export interface ProviderPreset extends Omit<ProviderBase, 'apiKey'> {
	presetId?: string;
	apiKeyUrl: string;
	apiKeyRequired: boolean;
	modelsList: string;
	popularModels: Model[];
}

export interface APIProvider {
	callAPI(
		systemRole: string,
		user_prompt: string,
		provider: ProviderConfig,
		selectedModel: string,
		temperature?: number
	): Promise<StructuredOutput>;

	buildHeaders(apiKey: string): Record<string, string>;
	processApiResponse(responseData: any): StructuredOutput;
}

// ==========================================
// Settings UI Types (from ui/types.ts)
// ==========================================

export interface SettingsComponentOptions {
	showLinkType?: boolean;
	showOptions?: boolean;
	showTextArea?: boolean;
}

export interface SettingsComponent {
	display(frontmatterId?: number): void;
}

export interface FrontmatterActions {
	onEdit: (frontmatterSetting: FrontmatterField) => void;
	onDelete: (frontmatterSetting: FrontmatterField) => void;
}

export interface FrontmatterEditorModalProps {
	frontmatterSetting: FrontmatterField;
	options: SettingsComponentOptions;
	onSave: (frontmatter: FrontmatterField) => Promise<void>;
}

/**
 * Frontmatter reference type - minimal identification info for selection/reference
 * Used in modals, dropdowns, lists etc. to identify frontmatter
 */
export type FrontmatterRef = Pick<FrontmatterField, 'id' | 'name'>;

// ==========================================
// Plugin Settings Type
// ==========================================

export interface AutoClassifierSettings {
	providers: ProviderConfig[];
	selectedProvider: string;
	selectedModel: string;
	frontmatter: FrontmatterField[];
	classificationRule: string;
}
