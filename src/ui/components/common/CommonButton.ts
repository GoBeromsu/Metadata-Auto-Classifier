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

export class CommonButton {
	private readonly buttonComponent: ButtonComponent;
	private readonly props: CommonButtonProps;

	constructor(containerEl: HTMLElement, props: CommonButtonProps) {
		this.props = props;
		this.buttonComponent = new ButtonComponent(containerEl);
		this.updateButton();
	}

	private updateButton(): void {
		createButtonConfig(this.props)(this.buttonComponent);
	}
}
// Setting.addButton에 주입할 수 있는 설정 함수
export function createButtonConfig(props: CommonButtonProps) {
	return (button: ButtonComponent) => {
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
	};
}

export function createExtraButtonConfig(props: CommonButtonProps) {
	return (button: ExtraButtonComponent) => {
		const { icon, tooltip, onClick, disabled, className } = props;

		// ExtraButtonComponent는 icon만 지원 (text, cta, warning 미지원)
		if (icon) button.setIcon(icon);
		if (tooltip) button.setTooltip(tooltip);
		if (disabled !== undefined) button.setDisabled(disabled);
		if (className) button.extraSettingsEl.addClass(className);

		button.onClick(onClick);

		return button;
	};
}
