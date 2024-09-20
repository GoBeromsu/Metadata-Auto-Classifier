import { App, TFile } from 'obsidian';
import { getFrontMatterInfo } from 'obsidian';

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

	async getAllTags(): Promise<string[]> {
		const tags = new Set<string>();
		const files = this.app.vault.getMarkdownFiles();

		for (const file of files) {
			const cachedMetadata = this.app.metadataCache.getFileCache(file);

			// frontmatter tags
			const frontmatterTags = cachedMetadata?.frontmatter?.tags;
			if (Array.isArray(frontmatterTags)) {
				frontmatterTags.forEach((tag) => {
					if (typeof tag === 'string') {
						tags.add(tag.replace(/^#/, ''));
					}
				});
			}

			// inline tags
			if (cachedMetadata?.tags) {
				cachedMetadata.tags.forEach((tag) => tags.add(tag.tag.replace(/^#/, '')));
			}
		}

		return Array.from(tags);
	}

	async getSavedFrontMatterValue(file: TFile, key: string): Promise<any> {
		return this.app.metadataCache.getFileCache(file)?.frontmatter?.[key];
	}

	async getMarkdownContentWithoutFrontmatter(file: TFile): Promise<string> {
		const content = await this.app.vault.read(file);
		const { contentStart } = getFrontMatterInfo(content);
		return content.slice(contentStart).trim();
	}
}
