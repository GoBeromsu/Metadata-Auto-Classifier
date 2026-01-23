import type { Plugin } from 'obsidian';
import type { FrontmatterField } from '../frontmatter/types';

export interface CommandHandler {
	processFrontmatter: (frontmatterId: number) => Promise<void>;
	processAllFrontmatter: () => Promise<void>;
}

export class CommandService {
	constructor(
		private readonly plugin: Plugin,
		private readonly handler: CommandHandler
	) {}

	setupCommands(frontmatterSettings: FrontmatterField[]): void {
		// Register individual frontmatter commands
		frontmatterSettings.forEach((fm) => {
			this.registerCommand(fm.name, async () => await this.handler.processFrontmatter(fm.id));
		});

		// Register "fetch all" command
		this.registerCommand(
			'Fetch all frontmatter using current provider',
			async () => await this.handler.processAllFrontmatter()
		);
	}

	registerCommand(name: string, callback: () => Promise<void>): void {
		this.plugin.addCommand({
			id: `fetch-frontmatter-${name}`,
			name: `Fetch frontmatter: ${name}`,
			callback: async () => await callback(),
		});
	}
}
