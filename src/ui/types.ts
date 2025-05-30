import type { ProviderConfig, Model } from 'api/types';
import { FrontmatterTemplate } from 'frontmatter/types';

// 🎯 도메인별 콜백 그룹화 - 직관적인 네이밍
export interface ClassificationCallbacks {
	onChange: (rule: string) => Promise<void>;
}

export interface ProviderCallbacks {
	onAdd: (provider: ProviderConfig) => Promise<void>;
	onUpdate: (oldName: string, newProvider: ProviderConfig) => Promise<void>;
	onDelete: (providerName: string) => Promise<void>;
}

export interface ModelCallbacks {
	onAdd: (providerName: string, model: Model) => Promise<void>;
	onSelect: (providerName: string, modelName: string) => Promise<void>;
	onDelete: (providerName: string, modelName: string) => Promise<void>;
}

// 🔄 기존 ApiCallbacks는 호환성을 위해 유지 (점진적 마이그레이션)
export interface ApiCallbacks {
	onClassificationRuleChange: (rule: string) => Promise<void>;
	onProviderAdd: (provider: ProviderConfig) => Promise<void>;
	onProviderUpdate: (oldName: string, newProvider: ProviderConfig) => Promise<void>;
	onProviderDelete: (providerName: string) => Promise<void>;
	onModelSelect: (providerName: string, modelName: string) => Promise<void>;
	onModelDelete: (providerName: string, modelName: string) => Promise<void>;
	onOpenProviderModal: (type: 'add' | 'edit', provider?: ProviderConfig) => void;
	onOpenModelModal: (
		type: 'add' | 'edit',
		editTarget?: { model: string; displayName: string; provider: string }
	) => void;
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

/**
 * Frontmatter 참조 타입 - 선택/참조를 위한 최소 식별 정보
 * 모달, 드롭다운, 리스트 등에서 frontmatter를 식별할 때 사용
 */
export type FrontmatterRef = Pick<FrontmatterTemplate, 'id' | 'name'>;
