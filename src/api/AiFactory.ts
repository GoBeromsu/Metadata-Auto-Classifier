import { APIProvider } from './interface';
import { OpenAIProvider } from './OpenAIProvider';

export class AiFactory {
	static getProvider(providerName: string): APIProvider {
		switch (providerName.toLowerCase()) {
			case 'openai':
				return new OpenAIProvider();
			default:
				throw new Error(`Unknown AI provider: ${providerName}`);
		}
	}
}
