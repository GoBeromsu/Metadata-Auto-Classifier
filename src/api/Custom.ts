import { APIProvider, ProviderConfig, StructuredOutput } from 'utils/interface';

export class Custom implements APIProvider {
	async callAPI(
		chatRole: string,
		promptTemplate: string,
		provider: ProviderConfig,
		model: string
	): Promise<StructuredOutput> {
		throw new Error('Method not implemented.');
	}

	async verifyConnection(provider: ProviderConfig): Promise<boolean> {
		throw new Error('Method not implemented.');
	}
}
