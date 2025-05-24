import { ButtonComponent } from 'obsidian';

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
	private buttonComponent: ButtonComponent;
	private props: CommonButtonProps;

	constructor(containerEl: HTMLElement, props: CommonButtonProps) {
		this.props = props;
		this.buttonComponent = new ButtonComponent(containerEl);
		this.updateButton();
	}

	private updateButton(): void {
		const { text, icon, tooltip, onClick, cta, warning, disabled, className } = this.props;

		if (text) {
			this.buttonComponent.setButtonText(text);
		}

		if (icon) {
			this.buttonComponent.setIcon(icon);
		}

		if (tooltip) {
			this.buttonComponent.setTooltip(tooltip);
		}

		if (cta) {
			this.buttonComponent.setCta();
		}

		if (warning) {
			this.buttonComponent.setWarning();
		}

		if (disabled !== undefined) {
			this.buttonComponent.setDisabled(disabled);
		}

		if (className) {
			this.buttonComponent.buttonEl.addClass(className);
		}

		this.buttonComponent.onClick(onClick);
	}

	public updateProps(newProps: Partial<CommonButtonProps>): void {
		this.props = { ...this.props, ...newProps };
		this.updateButton();
	}

	public getButtonElement(): HTMLElement {
		return this.buttonComponent.buttonEl;
	}

	public destroy(): void {
		this.buttonComponent.buttonEl.remove();
	}
}
