import { ButtonComponent, ExtraButtonComponent } from 'obsidian';

export interface CommonButtonProps {
	text?: string;
	icon?: string;
	tooltip?: string;
	onClick: () => void;
	cta?: boolean;
	warning?: boolean;
	disabled?: boolean;
	className?: string;
}

function configureButton(button: ButtonComponent, props: CommonButtonProps): ButtonComponent {
	const { text, icon, tooltip, onClick, cta, warning, disabled, className } = props;

	if (text) button.setButtonText(text);
	if (icon) button.setIcon(icon);
	if (tooltip) button.setTooltip(tooltip);
	if (cta) button.setCta();
	if (warning) button.setWarning();
	if (disabled !== undefined) button.setDisabled(disabled);
	if (className) button.buttonEl.addClass(className);

	button.onClick(onClick);
	return button;
}

function configureExtraButton(
	button: ExtraButtonComponent,
	props: CommonButtonProps
): ExtraButtonComponent {
	const { icon, tooltip, onClick, disabled, className } = props;

	// ExtraButtonComponent는 icon만 지원 (text, cta, warning 미지원)
	if (icon) button.setIcon(icon);
	if (tooltip) button.setTooltip(tooltip);
	if (disabled !== undefined) button.setDisabled(disabled);
	if (className) button.extraSettingsEl.addClass(className);

	button.onClick(onClick);
	return button;
}

// Modal 등에서 직접 버튼 생성 (직관적!)
export function CommonButton(containerEl: HTMLElement, props: CommonButtonProps): ButtonComponent {
	const button = new ButtonComponent(containerEl);
	return configureButton(button, props);
}

// Setting.addButton용 - HOF 패턴 (Obsidian 요구사항)
export function createButtonConfig(props: CommonButtonProps) {
	return (button: ButtonComponent) => configureButton(button, props);
}

// Setting.addExtraButton용 - HOF 패턴 (Obsidian 요구사항)
export function createExtraButtonConfig(props: CommonButtonProps) {
	return (button: ExtraButtonComponent) => configureExtraButton(button, props);
}
