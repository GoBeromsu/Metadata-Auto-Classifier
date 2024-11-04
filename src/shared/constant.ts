export interface FrontmatterTemplate {
	id: number;
	name: string;
	count: number;
	refs: string[];
} // Default frontmatter setting
export const DEFAULT_FRONTMATTER_SETTING = {
	name: '',
	count: 1,
	refs: [],
};
