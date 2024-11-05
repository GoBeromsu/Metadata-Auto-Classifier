import { AIProvider } from 'utils/constant';
import { APIProvider } from 'utils/interface';
import { OpenAIProvider } from './OpenAIProvider';

export const getProvider = (providerName: string): APIProvider => {
	switch (providerName) {
		case AIProvider.OpenAI:
			return new OpenAIProvider();
		default:
			throw new Error(`Unknown AI provider: ${providerName}`);
	}
};
