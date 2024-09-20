import AutoClassifierPlugin from '../main';
import { MetaDataManager } from '../metaDataManager';

import { Tag } from './Tag';
import { SettingStrategy } from './SettingStrategy';
import { Api } from './Api';
import { Frontmatter } from './Frontmatter';

export class SettingFactory {
	static createStrategy(
		type: string,
		plugin: AutoClassifierPlugin,
		metaDataManager: MetaDataManager
	): SettingStrategy {
		switch (type) {
			case 'frontmatter':
				return new Frontmatter(plugin, metaDataManager);
			case 'tag':
				return new Tag(plugin, metaDataManager);
			case 'api':
				return new Api(plugin, metaDataManager);
			default:
				throw new Error(`Unknown setting type: ${type}`);
		}
	}
}
