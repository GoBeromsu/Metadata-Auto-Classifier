import { App, TFile } from "obsidian";

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
				frontmatter[key] = value;
			}
		});
	}

	async getFrontMatter(file: TFile): Promise<Record<string, any> | null> {
		const frontmatter =
			this.app.metadataCache.getFileCache(file)?.frontmatter;
		if (frontmatter) {
			const { position, ...rest } = frontmatter;
			return rest;
		}
		return null;
	}
}
