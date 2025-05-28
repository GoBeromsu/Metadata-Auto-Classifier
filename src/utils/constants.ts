import { DEFAULT_TASK_TEMPLATE } from 'api/prompt';
import { DEFAULT_PROVIDER } from '../api/constants';
import { FrontmatterTemplate, LinkType } from '../frontmatter/types';
import { AutoClassifierSettings } from '../ui';

export const DEFAULT_FRONTMATTER_SETTING = {
	name: '',	
	count: { min: 1, max: 1 },
	refs: [],
	overwrite: false,
	linkType: 'WikiLink' as LinkType,
	customQuery: '',
};

export const DEFAULT_TAG_SETTING: FrontmatterTemplate = {
	id: 0,
	name: 'tags',
	refs: [],
	count: { min: 1, max: 5 },
	overwrite: false,
	linkType: 'Normal' as LinkType,
	customQuery: '',
};

// Default settings for the Auto Classifier plugin
export const DEFAULT_SETTINGS: AutoClassifierSettings = {
	providers: [DEFAULT_PROVIDER],
	selectedProvider: '',
	selectedModel: '',
	frontmatter: [DEFAULT_TAG_SETTING],
	classificationRule: DEFAULT_TASK_TEMPLATE,
};
