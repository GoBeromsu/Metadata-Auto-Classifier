import { TFile } from 'obsidian';

export interface FrontmatterTemplate {
	id: number;
	name: string;
	count: {
		min: number;
		max: number;
	};
	refs: string[];
	overwrite: boolean;
	linkType: 'WikiLink' | 'Normal';
	customQuery: string;
}

export interface FrontMatter {
	[key: string]: string[];
}

export type ProcessFrontMatterFn = (
	file: TFile,
	fn: (frontmatter: FrontMatter) => void
) => Promise<void>;

export interface InsertFrontMatterParams {
	file: TFile;
	key: string;
	value: string[];
	overwrite: boolean;
	linkType?: 'Normal' | 'WikiLink';
}
