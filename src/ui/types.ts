import type { ProviderConfig } from 'api/types';
import { FrontmatterTemplate } from 'frontmatter/types';

export interface UIComponent {
	updateProps(newProps: any): void;
	display(containerEl: HTMLElement): void;
}

export interface ApiProps {
	// Current state (read-only)
	classificationRule: string;
	providers: ProviderConfig[];
	selectedProvider: string;
	selectedModel: string;

	// State change callbacks
	onClassificationRuleChange: (rule: string) => Promise<void>;
	onProviderAdd: (provider: ProviderConfig) => Promise<void>;
	onProviderUpdate: (oldName: string, newProvider: ProviderConfig) => Promise<void>;
	onProviderDelete: (providerName: string) => Promise<void>;
	onModelSelect: (providerName: string, modelName: string) => Promise<void>;
	onModelDelete: (modelName: string) => Promise<void>;

	// Modal event handlers (clean event-based pattern)
	onOpenProviderModal: (type: 'add' | 'edit', provider?: ProviderConfig) => void;
	onOpenModelModal: (
		type: 'add' | 'edit',
		editTarget?: { model: string; displayName: string; provider: string }
	) => void;

	// UI refresh callback
	onRefresh?: () => void;
}

export interface SettingsComponentOptions {
	showLinkType?: boolean;
	showOptions?: boolean;
	showTextArea?: boolean;
}

export interface SettingsComponent {
	display(containerEl: HTMLElement, frontmatterId?: number): void;
}

export interface FrontmatterActions {
	onEdit: (frontmatterSetting: FrontmatterTemplate) => void;
	onDelete: (frontmatterSetting: FrontmatterTemplate) => void;
}

export interface FrontmatterEditorModalProps {
	frontmatterSetting: FrontmatterTemplate;
	options: SettingsComponentOptions;
	onSave: (frontmatter: FrontmatterTemplate) => Promise<void>;
}
