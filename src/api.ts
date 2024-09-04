import { requestUrl, RequestUrlParam } from "obsidian";

interface AIProvider {
	callAPI(
		system_role: string,
		user_prompt: string,
		apiKey: string,
		model?: string,
		max_tokens?: number,
		temperature?: number,
		top_p?: number,
		frequency_penalty?: number,
		presence_penalty?: number
	): Promise<string>;

	testAPI(apiKey: string): Promise<boolean>;
}

export class OpenAIProvider implements AIProvider {
	private static baseUrl = "https://api.openai.com/v1/chat/completions";

	async callAPI(
		system_role: string,
		user_prompt: string,
		apiKey: string,
		model: string = "gpt-3.5-turbo",
		max_tokens: number = 150,
		temperature: number = 0,
		top_p: number = 0.95,
		frequency_penalty: number = 0,
		presence_penalty: number = 0.5
	): Promise<string> {
		const headers: Record<string, string> = {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		};

		const data = {
			model: model,
			messages: [
				{ role: "system", content: system_role },
				{ role: "user", content: user_prompt },
			],
			max_tokens: max_tokens,
			temperature: temperature,
			top_p: top_p,
			frequency_penalty: frequency_penalty,
			presence_penalty: presence_penalty,
		};

		const requestParam: RequestUrlParam = {
			url: OpenAIProvider.baseUrl,
			method: "POST",
			headers: headers,
			body: JSON.stringify(data),
		};

		try {
			const response = await requestUrl(requestParam);
			if (response.status !== 200) {
				throw new Error(
					`API request failed with status ${response.status}`
				);
			}
			const responseData = response.json;
			if (responseData.choices && responseData.choices.length > 0) {
				return responseData.choices[0].message.content.trim();
			} else {
				throw new Error("No response from the API");
			}
		} catch (error) {
			console.error("Error calling OpenAI API:", error);
			throw error;
		}
	}

	async testAPI(apiKey: string): Promise<boolean> {
		try {
			await this.callAPI(
				"You are a test system.",
				"This is a test prompt.",
				apiKey,
				undefined,
				10  // 테스트를 위해 짧은 응답만 요청
			);
			return true;
		} catch (error) {
			console.error("OpenAI API 테스트 실패:", error);
			return false;
		}
	}
}

export class AIFactory {
	static getProvider(providerName: string): AIProvider {
		switch (providerName.toLowerCase()) {
			case "openai":
				return new OpenAIProvider();
			// 여기에 다른 AI 제공자를 추가할 수 있습니다.
			default:
				throw new Error(`Unknown AI provider: ${providerName}`);
		}
	}
}
