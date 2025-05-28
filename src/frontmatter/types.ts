import { TFile } from 'obsidian';

export type LinkType = 'WikiLink' | 'Normal';

export interface FrontmatterTemplate {
	id: number;
	name: string;
	count: {
		min: number;
		max: number;
	};
	refs: string[];
	overwrite: boolean;
	linkType: LinkType;
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
	linkType?: LinkType;
}
