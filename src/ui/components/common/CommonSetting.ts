import {
	ButtonComponent,
	DropdownComponent,
	Setting,
	TextAreaComponent,
	TextComponent,
	ToggleComponent,
} from 'obsidian';
import { CommonButtonProps } from './CommonButton';

export interface DropdownOption {
	value: string;
	display: string;
}

export interface TextInputConfig {
	placeholder?: string;
	value?: string;
	onChange: (value: string) => void;
}

export interface DropdownConfig {
	options: DropdownOption[];
	value?: string;
	onChange: (value: string) => void;
}

export interface ToggleConfig {
	value: boolean;
	onChange: (value: boolean) => void;
}

export interface TextAreaConfig {
	placeholder?: string;
	value?: string;
	rows?: number;
	onChange: (value: string) => void;
}

export interface CommonSettingProps {
	name: string;
	desc?: string;
	className?: string;
	heading?: boolean;

	// Input components
	textInput?: TextInputConfig;
	dropdown?: DropdownConfig;
	toggle?: ToggleConfig;
	textArea?: TextAreaConfig;

	// Button components
	button?: CommonButtonProps;
	extraButton?: CommonButtonProps;
	buttons?: CommonButtonProps[];
}

export class CommonSetting {
	private setting: Setting;
	private props: CommonSettingProps;

	// Store component references for potential updates
	private textComponent?: TextComponent;
	private dropdownComponent?: DropdownComponent;
	private toggleComponent?: ToggleComponent;
	private textAreaComponent?: TextAreaComponent;

	constructor(containerEl: HTMLElement, props: CommonSettingProps) {
		this.props = props;
		this.setting = new Setting(containerEl);
		this.initialize();
	}

	/**
	 * Static factory method for creating settings with side effects.
	 * This method clearly indicates that it performs DOM manipulation and returns void.
	 */
	public static create(containerEl: HTMLElement, props: CommonSettingProps): void {
		new CommonSetting(containerEl, props);
	}

	private initialize(): void {
		const { name, desc, className, heading } = this.props;

		// Set basic properties
		this.setting.setName(name);

		if (desc) {
			this.setting.setDesc(desc);
		}

		if (heading) {
			this.setting.setHeading();
		}

		if (className) {
			this.setting.settingEl.addClass(className);
		}

		// Initialize components based on configuration
		this.initializeTextInput();
		this.initializeDropdown();
		this.initializeToggle();
		this.initializeTextArea();
		this.initializeButtons();
	}

	private initializeTextInput(): void {
		const { textInput } = this.props;
		if (!textInput) return;

		this.setting.addText((text) => {
			this.textComponent = text;

			if (textInput.placeholder) {
				text.setPlaceholder(textInput.placeholder);
			}

			if (textInput.value !== undefined) {
				text.setValue(textInput.value);
			}

			text.onChange(textInput.onChange);
		});
	}

	private initializeDropdown(): void {
		const { dropdown } = this.props;
		if (!dropdown) return;

		this.setting.addDropdown((dropdownComponent) => {
			this.dropdownComponent = dropdownComponent;

			dropdown.options.forEach((option) => {
				dropdownComponent.addOption(option.value, option.display);
			});

			if (dropdown.value !== undefined) {
				dropdownComponent.setValue(dropdown.value);
			}

			dropdownComponent.onChange(dropdown.onChange);
		});
	}

	private initializeToggle(): void {
		const { toggle } = this.props;
		if (!toggle) return;

		this.setting.addToggle((toggleComponent) => {
			this.toggleComponent = toggleComponent;
			toggleComponent.setValue(toggle.value);
			toggleComponent.onChange(toggle.onChange);
		});
	}

	private initializeTextArea(): void {
		const { textArea } = this.props;
		if (!textArea) return;

		// Create container for textarea
		const textareaContainer = this.setting.settingEl.createDiv({ cls: 'textarea-container' });

		this.textAreaComponent = new TextAreaComponent(textareaContainer);

		if (textArea.placeholder) {
			this.textAreaComponent.setPlaceholder(textArea.placeholder);
		}

		if (textArea.value !== undefined) {
			this.textAreaComponent.setValue(textArea.value);
		}

		if (textArea.rows) {
			this.textAreaComponent.inputEl.rows = textArea.rows;
		}

		this.textAreaComponent.onChange(textArea.onChange);
	}

	private initializeButtons(): void {
		const { button, extraButton, buttons } = this.props;

		// Single button
		if (button) {
			this.addButtonToSetting(button, false);
		}

		// Extra button (icon-only style)
		if (extraButton) {
			this.addButtonToSetting(extraButton, true);
		}

		// Multiple buttons (treat as extra buttons since they're typically icon-only)
		if (buttons) {
			buttons.forEach((buttonProps) => {
				this.addButtonToSetting(buttonProps, true);
			});
		}
	}

	private addButtonToSetting(buttonProps: CommonButtonProps, isExtraButton: boolean): void {
		const addButtonMethod = isExtraButton
			? this.setting.addExtraButton.bind(this.setting)
			: this.setting.addButton.bind(this.setting);

		addButtonMethod((button: ButtonComponent) => {
			if (buttonProps.text) {
				button.setButtonText(buttonProps.text);
			}

			if (buttonProps.icon) {
				button.setIcon(buttonProps.icon);
			}

			if (buttonProps.tooltip) {
				button.setTooltip(buttonProps.tooltip);
			}

			if (buttonProps.cta) {
				button.setCta();
			}

			if (buttonProps.warning) {
				button.setWarning();
			}

			if (buttonProps.disabled) {
				button.setDisabled(buttonProps.disabled);
			}

			if (buttonProps.className) {
				button.buttonEl.addClass(buttonProps.className);
			}

			button.onClick(buttonProps.onClick);
		});
	}

	public updateProps(newProps: Partial<CommonSettingProps>): void {
		// For now, we'll recreate the setting if props change
		// In the future, we could implement more granular updates
		this.props = { ...this.props, ...newProps };

		// Clear and reinitialize
		this.setting.settingEl.empty();
		this.initialize();
	}

	public getSettingElement(): HTMLElement {
		return this.setting.settingEl;
	}

	public getSetting(): Setting {
		return this.setting;
	}

	// Getters for component references if needed
	public getTextComponent(): TextComponent | undefined {
		return this.textComponent;
	}

	public getDropdownComponent(): DropdownComponent | undefined {
		return this.dropdownComponent;
	}

	public getToggleComponent(): ToggleComponent | undefined {
		return this.toggleComponent;
	}

	public getTextAreaComponent(): TextAreaComponent | undefined {
		return this.textAreaComponent;
	}
}
