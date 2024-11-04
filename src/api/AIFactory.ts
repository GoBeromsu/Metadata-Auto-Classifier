import { APIProvider } from './interface';
import OpenAIProvider from './OpenAIProvider';

export default class AIFactory {
	static getProvider(providerName: string): APIProvider {
		switch (providerName.toLowerCase()) {
			case 'openai':
				return new OpenAIProvider();
			default:
				throw new Error(`Unknown AI provider: ${providerName}`);
		}
	}
}
