import { FrontmatterField } from 'frontmatter/types';

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
 * Frontmatter 참조 타입 - 선택/참조를 위한 최소 식별 정보
 * 모달, 드롭다운, 리스트 등에서 frontmatter를 식별할 때 사용
 */
export type FrontmatterRef = Pick<FrontmatterField, 'id' | 'name'>;
