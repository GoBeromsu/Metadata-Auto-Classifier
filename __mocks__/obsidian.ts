export const requestUrl = jest.fn();

// Obsidian API functions
export const getFrontMatterInfo = jest.fn((content: string) => {
	const match = content.match(/^---\n[\s\S]*?\n---\n/);
	if (match) {
		return {
			exists: true,
			frontmatter: match[0],
			contentStart: match[0].length,
		};
	}
	return {
		exists: false,
		frontmatter: '',
		contentStart: 0,
	};
});

export const parseFrontMatterStringArray = jest.fn((frontmatter: any, key: string) => {
	if (!frontmatter || !frontmatter[key]) {
		return null;
	}
	const value = frontmatter[key];
	if (Array.isArray(value)) {
		return value;
	}
	return [value];
});

export const getAllTags = jest.fn((cache: any) => {
	if (!cache) return null;
	const tags = new Set<string>();

	// Add frontmatter tags
	if (cache.frontmatter && cache.frontmatter.tags) {
		const frontmatterTags = Array.isArray(cache.frontmatter.tags)
			? cache.frontmatter.tags
			: [cache.frontmatter.tags];
		frontmatterTags.forEach((tag: string) => tags.add(tag));
	}

	// Add inline tags (simulated)
	if (cache.tags) {
		cache.tags.forEach((tag: any) => tags.add(tag.tag));
	}

	return tags.size > 0 ? Array.from(tags) : null;
});

// MetadataCache mock
export class MetadataCache {
	private fileCaches = new Map<any, any>();

	getFileCache = jest.fn((file: any) => {
		return this.fileCaches.get(file) || null;
	});

	// Helper for testing
	setFileCache(file: any, cache: any) {
		this.fileCaches.set(file, cache);
	}

	clearCache() {
		this.fileCaches.clear();
	}
}

// TFile mock - minimal implementation for testing
export class TFile {
	path: string = '';
	basename: string = '';
	name: string = '';
	extension: string = 'md';
	stat = { ctime: 0, mtime: 0, size: 0 };
	vault: any = null;
	parent: any = null;
}

export function createMockTFile(path: string, basename: string): TFile {
	const file = new TFile();
	file.path = path;
	file.basename = basename;
	file.name = basename + '.md';
	return file;
}

// Basic App mock for components relying on Obsidian's App
export class App {
	vault = {
		getMarkdownFiles: jest.fn().mockReturnValue([]),
		read: jest.fn().mockResolvedValue(''),
		modify: jest.fn().mockResolvedValue(undefined),
		create: jest.fn().mockResolvedValue(undefined),
		delete: jest.fn().mockResolvedValue(undefined),
	} as any;
	metadataCache = new MetadataCache();
	workspace = {
		getActiveFile: jest.fn().mockReturnValue(null),
		on: jest.fn(),
		off: jest.fn(),
	} as any;
	fileManager = {
		processFrontMatter: jest.fn(),
	} as any;
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
	buttonEl = { addClass: jest.fn(), setAttribute: jest.fn() } as any;
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
	extraSettingsEl = { addClass: jest.fn(), setAttribute: jest.fn() } as any;
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
	setPlaceholder = jest.fn().mockReturnThis();
	setValue = jest.fn().mockReturnThis();
	onChange = jest.fn().mockReturnThis();
}

// Helper to create a recursive mock element
function createMockElement(): any {
	const mockElement: any = {
		empty: jest.fn(),
		style: {},
		classList: {
			add: jest.fn(),
			remove: jest.fn(),
		},
		setAttribute: jest.fn(),
		querySelector: jest.fn().mockReturnValue(null),
		querySelectorAll: jest.fn().mockReturnValue([]),
		addEventListener: jest.fn(),
		appendChild: jest.fn(),
		value: '',
		checked: false,
	};
	// Recursive mock for createEl and createDiv
	mockElement.createEl = jest.fn().mockImplementation(() => createMockElement());
	mockElement.createDiv = jest.fn().mockImplementation(() => createMockElement());
	return mockElement;
}

// Modal mock
export class Modal {
	app: App;
	contentEl: HTMLElement;
	modalEl: HTMLElement;

	constructor(app: App) {
		this.app = app;
		this.contentEl = createMockElement() as any;
		this.modalEl = {
			addClass: jest.fn(),
		} as any;
	}

	open = jest.fn();
	close = jest.fn();
	onOpen(): void {}
	onClose(): void {}
}

// Plugin mock
export class Plugin {
	app: App;
	manifest: any = { id: 'test-plugin', name: 'Test Plugin', version: '1.0.0' };

	constructor(app?: App) {
		this.app = app || new App();
	}

	loadData = jest.fn().mockResolvedValue({});
	saveData = jest.fn().mockResolvedValue(undefined);
	addCommand = jest.fn();
	addSettingTab = jest.fn();
	registerCommand = jest.fn();

	onload(): Promise<void> | void {}
	onunload(): void {}
}

// PluginSettingTab mock
export class PluginSettingTab {
	app: App;
	plugin: Plugin;
	containerEl: HTMLElement;

	constructor(app: App, plugin: Plugin) {
		this.app = app;
		this.plugin = plugin;
		this.containerEl = {
			empty: jest.fn(),
			createEl: jest.fn(),
			createDiv: jest.fn(),
		} as any;
	}

	display(): void {}
	hide(): void {}
}

// Vault mock
export class Vault {
	getMarkdownFiles = jest.fn().mockReturnValue([]);
	read = jest.fn().mockResolvedValue('');
	modify = jest.fn().mockResolvedValue(undefined);
	create = jest.fn().mockResolvedValue(undefined);
	delete = jest.fn().mockResolvedValue(undefined);
}

// FileManager mock
export class FileManager {
	processFrontMatter = jest.fn();
}

// Workspace mock
export class Workspace {
	getActiveFile = jest.fn().mockReturnValue(null);
	on = jest.fn();
	off = jest.fn();
}
