import type { ProviderConfig } from 'api/types';

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
