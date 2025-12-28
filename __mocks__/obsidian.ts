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
	vault = { getMarkdownFiles: jest.fn().mockReturnValue([]) } as any;
	metadataCache = new MetadataCache();
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
	setPlaceholder = jest.fn().mockReturnThis();
	setValue = jest.fn().mockReturnThis();
	onChange = jest.fn().mockReturnThis();
}
