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
	ariaLabel?: string;
}

function configureButton(button: ButtonComponent, props: CommonButtonProps): ButtonComponent {
	const { text, icon, tooltip, onClick, cta, warning, disabled, className, ariaLabel } = props;

	if (text) button.setButtonText(text);
	if (icon) button.setIcon(icon);
	if (tooltip) button.setTooltip(tooltip);
	if (cta) button.setCta();
	if (warning) button.setWarning();
	if (disabled !== undefined) button.setDisabled(disabled);
	if (className) button.buttonEl.addClass(className);

	// Accessibility: Set ARIA attributes
	if (ariaLabel) {
		button.buttonEl.setAttribute('aria-label', ariaLabel);
	} else if (tooltip) {
		// Use tooltip as fallback for aria-label
		button.buttonEl.setAttribute('aria-label', tooltip);
	}
	button.buttonEl.setAttribute('role', 'button');

	button.onClick(onClick);
	return button;
}

function configureExtraButton(
	button: ExtraButtonComponent,
	props: CommonButtonProps
): ExtraButtonComponent {
	const { icon, tooltip, onClick, disabled, className, ariaLabel } = props;

	// ExtraButtonComponent는 icon만 지원 (text, cta, warning 미지원)
	if (icon) button.setIcon(icon);
	if (tooltip) button.setTooltip(tooltip);
	if (disabled !== undefined) button.setDisabled(disabled);
	if (className) button.extraSettingsEl.addClass(className);

	// Accessibility: Set ARIA attributes
	if (ariaLabel) {
		button.extraSettingsEl.setAttribute('aria-label', ariaLabel);
	} else if (tooltip) {
		// Use tooltip as fallback for aria-label
		button.extraSettingsEl.setAttribute('aria-label', tooltip);
	}
	button.extraSettingsEl.setAttribute('role', 'button');

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
