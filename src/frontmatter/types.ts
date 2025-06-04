import type { TFile } from 'obsidian';

export type LinkType = 'WikiLink' | 'Normal';

export interface Range {
        min: number;
        max: number;
}

export interface FrontmatterField {
        id: number;
        name: string;
        count: Range;
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

export interface InsertFrontMatterParams
        extends Pick<FrontmatterField, 'name' | 'overwrite' | 'linkType'> {
        file: TFile;
        value: string[];
}
