import { App, TFile } from 'obsidian';

export class MetaDataManager {
	private app: App;

	constructor(app: App) {
		this.app = app;
	}

	async insertToFrontMatter(
		file: TFile,
		key: string,
		value: string | string[],
		overwrite = false
	): Promise<void> {
		await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
			frontmatter = frontmatter || {};

			if (frontmatter[key] && !overwrite) {
				if (Array.isArray(frontmatter[key])) {
					if (Array.isArray(value)) {
						frontmatter[key].push(...value);
					} else {
						frontmatter[key].push(value);
					}
				} else {
					if (Array.isArray(value)) {
						frontmatter[key] = [frontmatter[key], ...value];
					} else {
						frontmatter[key] = [frontmatter[key], value];
					}
				}
			} else {
				frontmatter[key] = Array.isArray(value) ? value : [value];
			}

			// Remove duplicates and empty strings
			if (Array.isArray(frontmatter[key])) {
				frontmatter[key] = [...new Set(frontmatter[key])].filter(Boolean);
			}
		});
	}

	async getFrontMatter(file: TFile): Promise<Record<string, any> | null> {
		const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
		if (frontmatter) {
			const { position, ...rest } = frontmatter;
			return rest;
		}
		return null;
	}

	async getFrontMatterValue(file: TFile, key: string): Promise<any> {
		const fileCache = this.app.metadataCache.getFileCache(file);
		if (fileCache?.frontmatter && key in fileCache.frontmatter) {
			return fileCache.frontmatter[key];
		}
		return null;
	}

	async getAllTags(): Promise<string[]> {
		const tags = new Set<string>();
		this.app.vault.getMarkdownFiles().forEach((file) => {
			const cachedMetadata = this.app.metadataCache.getFileCache(file);
			if (cachedMetadata && cachedMetadata.tags) {
				cachedMetadata.tags.forEach((tag) => {
					tags.add(tag.tag.replace(/^#/, ''));
				});
			}
		});
		return Array.from(tags);
	}

	async getSavedFrontMatterValue(file: TFile, key: string): Promise<any> {
		const content = await this.app.vault.read(file);
		const frontmatter = this.parseFrontMatter(content);
		return frontmatter[key];
	}

	private parseFrontMatter(content: string): Record<string, any> {
		const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
		const match = content.match(frontmatterRegex);
		if (match) {
			const frontmatterContent = match[1];
			const frontmatter: Record<string, any> = {};
			frontmatterContent.split('\n').forEach((line) => {
				const [key, value] = line.split(':').map((part) => part.trim());
				if (key && value) {
					frontmatter[key] = value;
				}
			});
			return frontmatter;
		}
		return {};
	}
}
