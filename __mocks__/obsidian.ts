export const requestUrl = jest.fn();

// Basic App mock for components relying on Obsidian's App
export class App {
	vault = { getMarkdownFiles: jest.fn().mockReturnValue([]) } as any;
}

export class FuzzySuggestModal<T> {
	constructor(public app: App) {}
	getItems(): T[] {
		return [];
	}
	getItemText(item: T): string {
		return '' + (item as any);
	}
	renderSuggestion(_file: any, _el: HTMLElement): void {}
	onChooseItem(_item: T): void {}
	open(): void {}
	close(): void {}
}

// ---------------------- UI Mocks ----------------------

export class ButtonComponent {
	buttonEl = { addClass: jest.fn() } as any;
	setButtonText = jest.fn().mockReturnThis();
	setIcon = jest.fn().mockReturnThis();
	setTooltip = jest.fn().mockReturnThis();
	setCta = jest.fn().mockReturnThis();
	setWarning = jest.fn().mockReturnThis();
	setDisabled = jest.fn().mockReturnThis();
	onClick = jest.fn();
	constructor(public containerEl: HTMLElement) {}
}

export class ExtraButtonComponent {
	extraSettingsEl = { addClass: jest.fn() } as any;
	setIcon = jest.fn().mockReturnThis();
	setTooltip = jest.fn().mockReturnThis();
	setDisabled = jest.fn().mockReturnThis();
	onClick = jest.fn();
	constructor(public containerEl: HTMLElement) {}
}

export const Notice = jest.fn().mockImplementation(function (message: string, duration: number) {
	this.message = message;
	this.duration = duration;
	this.setMessage = jest.fn();
	this.hide = jest.fn();
	return this;
});

export class Setting {
	settingEl = { addClass: jest.fn(), createSpan: jest.fn() } as any;
	controlEl = { createSpan: jest.fn() } as any;
	constructor(public containerEl: HTMLElement) {}
	setName = jest.fn();
	setDesc = jest.fn();
	setHeading = jest.fn();
	addText = jest.fn();
	addDropdown = jest.fn();
	addToggle = jest.fn();
	addExtraButton = jest.fn();
	addButton = jest.fn();
}

export class TextComponent {
	inputEl = { type: '', style: { width: '' }, value: '', classList: { add: jest.fn() } } as any;
	setPlaceholder = jest.fn();
	setValue = jest.fn();
	onChange = jest.fn();
}

export class TextAreaComponent {
	inputEl = { rows: 0, style: { width: '' } } as any;
	constructor(public containerEl: HTMLElement) {}
	setPlaceholder = jest.fn();
	setValue = jest.fn();
	onChange = jest.fn();
}
