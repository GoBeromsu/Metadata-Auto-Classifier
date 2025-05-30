import { Setting, TextAreaComponent, TextComponent } from 'obsidian';
import {
	createButtonConfig,
	createExtraButtonConfig,
	type CommonButtonProps,
} from './CommonButton';

export interface DropdownOption {
	value: string;
	display: string;
}

export interface TextInputConfig {
	placeholder?: string;
	value?: string;
	onChange: (value: string) => void;
}

export interface RangeInputConfig {
	minPlaceholder?: string;
	maxPlaceholder?: string;
	minValue?: number;
	maxValue?: number;
	onChange: (min: number, max: number) => void;
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
	rangeInput?: RangeInputConfig;
	dropdown?: DropdownConfig;
	toggle?: ToggleConfig;
	// textArea?: TextAreaConfig;

	// Button components
	button?: CommonButtonProps;
	extraButton?: CommonButtonProps;
	buttons?: CommonButtonProps[];
}

export class CommonSetting {
	private setting: Setting;

	constructor(containerEl: HTMLElement, props: CommonSettingProps) {
		const {
			name,
			desc,
			className,
			heading,
			textInput,
			rangeInput,
			dropdown,
			toggle,
			button,
			extraButton,
			buttons,
		} = props;

		this.setting = new Setting(containerEl);
		this.setting.setName(name);

		if (desc) this.setting.setDesc(desc);
		if (heading) this.setting.setHeading();

		if (className) this.setting.settingEl.addClass(className);

		// Initialize components based on configuration
		if (textInput) this.initTextInput(textInput);
		if (rangeInput) this.initRangeInput(rangeInput);
		if (dropdown) this.initDropdown(dropdown);
		if (toggle) this.initToggle(toggle);

		if (button) this.addButton(button);
		if (extraButton) this.addExtraButton(extraButton);
		if (buttons) buttons.forEach((buttonProps) => this.addExtraButton(buttonProps));
	}

	/**
	 * Static factory method for creating settings with side effects.
	 * This method clearly indicates that it performs DOM manipulation and returns void.
	 */
	public static create(containerEl: HTMLElement, props: CommonSettingProps): void {
		new CommonSetting(containerEl, props);
	}

	private initTextInput(textInput: TextInputConfig): void {
		this.setting.addText((text) => {
			if (textInput.placeholder) text.setPlaceholder(textInput.placeholder);
			if (textInput.value !== undefined) text.setValue(textInput.value);
			text.onChange(textInput.onChange);
		});
	}

	private initDropdown(config: DropdownConfig): void {
		this.setting.addDropdown((component) => {
			config.options.forEach(({ value, display }) => {
				component.addOption(value, display);
			});
			component.setValue(config.value ?? '');
			component.onChange(config.onChange);
		});
	}

	private initToggle(toggle: ToggleConfig): void {
		this.setting.addToggle((component) => {
			component.setValue(toggle.value);
			component.onChange(toggle.onChange);
		});
	}

	private initTextArea(textArea: TextAreaConfig): void {
		const textareaContainer = this.setting.settingEl.createDiv({ cls: 'textarea-container' });
		const component = new TextAreaComponent(textareaContainer);

		if (textArea.placeholder) component.setPlaceholder(textArea.placeholder);
		if (textArea.value !== undefined) component.setValue(textArea.value);
		if (textArea.rows) component.inputEl.rows = textArea.rows;
		component.onChange(textArea.onChange);
	}

	private addButton(buttonProps: CommonButtonProps): void {
		this.setting.addButton(createButtonConfig(buttonProps));
	}

	private addExtraButton(buttonProps: CommonButtonProps): void {
		this.setting.addExtraButton(createExtraButtonConfig(buttonProps));
	}

	private initRangeInput(config: RangeInputConfig): void {
		// Local state for composition - no class fields needed!
		let minComponent: TextComponent;
		let maxComponent: TextComponent;

		// Inner composite function - encapsulates combination logic
		const handleCombinedChange = () => {
			const min = parseInt(minComponent?.getValue() || '0', 10);
			const max = parseInt(maxComponent?.getValue() || '0', 10);
			if (!isNaN(min) && !isNaN(max)) {
				config.onChange(min, max);
			}
		};

		// First component - same as any other TextInput
		this.setting.addText((input) => {
			minComponent = input;
			input.inputEl.type = 'number';
			input.inputEl.style.width = '80px';
			if (config.minPlaceholder) input.setPlaceholder(config.minPlaceholder);
			if (config.minValue !== undefined) input.setValue(config.minValue.toString());
			input.onChange(handleCombinedChange);
		});

		// Separator - pure presentation
		this.setting.controlEl.createSpan({
			text: '~',
			cls: 'range-separator',
			attr: { style: 'margin: 0 8px; color: var(--text-muted);' },
		});

		// Second component - same as any other TextInput
		this.setting.addText((input) => {
			maxComponent = input;
			input.inputEl.type = 'number';
			input.inputEl.style.width = '80px';
			if (config.maxPlaceholder) input.setPlaceholder(config.maxPlaceholder);
			if (config.maxValue !== undefined) input.setValue(config.maxValue.toString());
			input.onChange(handleCombinedChange);
		});
	}
}
