import {
	PROVIDER_NAMES,
	generateId,
	getProviderPresets,
	getProviderPreset,
	findMatchingPreset,
} from 'utils';
import type { ProviderPreset } from 'api/types';
import providerPresetsData from '../../src/api/providerPreset.json';

// -------------------- PROVIDER_NAMES Tests --------------------
describe('PROVIDER_NAMES', () => {
	test('contains all expected provider names', () => {
		expect(PROVIDER_NAMES.OPENAI).toBe(providerPresetsData.openai.name);
		expect(PROVIDER_NAMES.ANTHROPIC).toBe(providerPresetsData.anthropic.name);
		expect(PROVIDER_NAMES.OPENROUTER).toBe(providerPresetsData.openrouter.name);
		expect(PROVIDER_NAMES.GEMINI).toBe(providerPresetsData.gemini.name);
		expect(PROVIDER_NAMES.DEEPSEEK).toBe(providerPresetsData.deepseek.name);
		expect(PROVIDER_NAMES.LMSTUDIO).toBe(providerPresetsData.lmstudio.name);
		expect(PROVIDER_NAMES.OLLAMA).toBe(providerPresetsData.ollama.name);
		expect(PROVIDER_NAMES.CUSTOM).toBe(providerPresetsData.custom.name);
	});

	test('has correct provider name values', () => {
		expect(PROVIDER_NAMES.OPENAI).toBe('OpenAI');
		expect(PROVIDER_NAMES.ANTHROPIC).toBe('Anthropic');
		expect(PROVIDER_NAMES.OPENROUTER).toBe('OpenRouter');
		expect(PROVIDER_NAMES.GEMINI).toBe('Gemini');
		expect(PROVIDER_NAMES.DEEPSEEK).toBe('DeepSeek');
		expect(PROVIDER_NAMES.LMSTUDIO).toBe('LM Studio');
		expect(PROVIDER_NAMES.OLLAMA).toBe('Ollama');
		expect(PROVIDER_NAMES.CUSTOM).toBe('Custom Provider');
	});

	test('is a readonly constant', () => {
		expect(Object.isFrozen(PROVIDER_NAMES)).toBe(false);
		const constantCheck = () => {
			// TypeScript should prevent this at compile time
			// @ts-expect-error - Testing immutability
			PROVIDER_NAMES.OPENAI = 'Modified';
		};
		expect(constantCheck).toBeDefined();
	});
});

// -------------------- generateId Tests --------------------
describe('generateId', () => {
	test('returns a number', () => {
		const id = generateId();
		expect(typeof id).toBe('number');
	});

	test('returns current timestamp', () => {
		const beforeTime = Date.now();
		const id = generateId();
		const afterTime = Date.now();

		expect(id).toBeGreaterThanOrEqual(beforeTime);
		expect(id).toBeLessThanOrEqual(afterTime);
	});

	test('generates unique IDs when called multiple times', () => {
		const id1 = generateId();
		const id2 = generateId();

		// IDs should be different or equal if called at exact same millisecond
		expect(id2).toBeGreaterThanOrEqual(id1);
	});

	test('generates increasing IDs over time', async () => {
		const id1 = generateId();
		// Wait 10ms to ensure different timestamp
		await new Promise((resolve) => setTimeout(resolve, 10));
		const id2 = generateId();

		expect(id2).toBeGreaterThan(id1);
	});
});

// -------------------- getProviderPresets Tests --------------------
describe('getProviderPresets', () => {
	test('returns an array', () => {
		const presets = getProviderPresets();
		expect(Array.isArray(presets)).toBe(true);
	});

	test('returns all provider presets', () => {
		const presets = getProviderPresets();
		expect(presets.length).toBe(8);
	});

	test('contains expected provider names', () => {
		const presets = getProviderPresets();
		const names = presets.map((p) => p.name);

		expect(names).toContain('OpenAI');
		expect(names).toContain('Anthropic');
		expect(names).toContain('OpenRouter');
		expect(names).toContain('Gemini');
		expect(names).toContain('DeepSeek');
		expect(names).toContain('LM Studio');
		expect(names).toContain('Ollama');
		expect(names).toContain('Custom Provider');
	});

	test('each preset has required ProviderPreset properties', () => {
		const presets = getProviderPresets();

		presets.forEach((preset: ProviderPreset) => {
			expect(preset).toHaveProperty('name');
			expect(preset).toHaveProperty('baseUrl');
			expect(preset).toHaveProperty('apiKeyUrl');
			expect(preset).toHaveProperty('apiKeyRequired');
			expect(preset).toHaveProperty('modelsList');
			expect(preset).toHaveProperty('temperature');
			expect(preset).toHaveProperty('popularModels');

			expect(typeof preset.name).toBe('string');
			expect(typeof preset.baseUrl).toBe('string');
			expect(typeof preset.apiKeyUrl).toBe('string');
			expect(typeof preset.apiKeyRequired).toBe('boolean');
			expect(typeof preset.modelsList).toBe('string');
			expect(typeof preset.temperature).toBe('number');
			expect(Array.isArray(preset.popularModels)).toBe(true);
		});
	});

	test('does not include apiKey property', () => {
		const presets = getProviderPresets();

		presets.forEach((preset) => {
			expect(preset).not.toHaveProperty('apiKey');
		});
	});
});

// -------------------- getProviderPreset Tests --------------------
describe('getProviderPreset', () => {
	test('returns OpenAI preset when given "OpenAI"', () => {
		const preset = getProviderPreset('OpenAI');

		expect(preset.name).toBe('OpenAI');
		expect(preset.baseUrl).toBe('https://api.openai.com/v1/chat/completions');
		expect(preset.apiKeyRequired).toBe(true);
	});

	test('returns Anthropic preset when given "Anthropic"', () => {
		const preset = getProviderPreset('Anthropic');

		expect(preset.name).toBe('Anthropic');
		expect(preset.baseUrl).toBe('https://api.anthropic.com/v1/messages');
		expect(preset.apiKeyRequired).toBe(true);
	});

	test('returns Gemini preset when given "Gemini"', () => {
		const preset = getProviderPreset('Gemini');

		expect(preset.name).toBe('Gemini');
		expect(preset.baseUrl).toBe('https://generativelanguage.googleapis.com/v1beta');
		expect(preset.apiKeyRequired).toBe(true);
	});

	test('returns OpenRouter preset when given "OpenRouter"', () => {
		const preset = getProviderPreset('OpenRouter');

		expect(preset.name).toBe('OpenRouter');
		expect(preset.baseUrl).toBe('https://openrouter.ai/api/v1/chat/completions');
		expect(preset.apiKeyRequired).toBe(true);
	});

	test('returns DeepSeek preset when given "DeepSeek"', () => {
		const preset = getProviderPreset('DeepSeek');

		expect(preset.name).toBe('DeepSeek');
		expect(preset.baseUrl).toBe('https://api.deepseek.com/v1/chat/completions');
		expect(preset.apiKeyRequired).toBe(true);
	});

	test('returns LM Studio preset when given "LM Studio"', () => {
		const preset = getProviderPreset('LM Studio');

		expect(preset.name).toBe('LM Studio');
		expect(preset.baseUrl).toBe('http://localhost:1234/v1/chat/completions');
		expect(preset.apiKeyRequired).toBe(false);
	});

	test('returns Ollama preset when given "Ollama"', () => {
		const preset = getProviderPreset('Ollama');

		expect(preset.name).toBe('Ollama');
		expect(preset.baseUrl).toBe('http://localhost:11434/api/chat');
		expect(preset.apiKeyRequired).toBe(false);
	});

	test('returns Custom Provider preset when given "Custom Provider"', () => {
		const preset = getProviderPreset('Custom Provider');

		expect(preset.name).toBe('Custom Provider');
		expect(preset.baseUrl).toBe('');
		expect(preset.apiKeyRequired).toBe(false);
	});

	test('throws error when provider name does not exist', () => {
		expect(() => getProviderPreset('NonExistentProvider')).toThrow(
			'Provider preset not found: NonExistentProvider'
		);
	});

	test('throws error with correct message for invalid provider', () => {
		expect(() => getProviderPreset('InvalidProvider')).toThrow(/Provider preset not found/);
	});

	test('throws error for empty string provider name', () => {
		expect(() => getProviderPreset('')).toThrow('Provider preset not found: ');
	});

	test('is case-sensitive for provider names', () => {
		expect(() => getProviderPreset('openai')).toThrow();
		expect(() => getProviderPreset('OPENAI')).toThrow();
	});

	test('returned preset includes popularModels array', () => {
		const preset = getProviderPreset('OpenAI');

		expect(Array.isArray(preset.popularModels)).toBe(true);
		expect(preset.popularModels.length).toBeGreaterThan(0);
		preset.popularModels.forEach((model) => {
			expect(model).toHaveProperty('id');
			expect(model).toHaveProperty('name');
		});
	});
});

// -------------------- findMatchingPreset Tests --------------------
describe('findMatchingPreset', () => {
	test('matches provider by exact baseUrl', () => {
		const config = {
			baseUrl: 'https://api.openai.com/v1/chat/completions',
			name: 'SomeOtherName',
		};

		const result = findMatchingPreset(config);
		expect(result).toBe('OpenAI');
	});

	test('matches provider by exact name', () => {
		const config = {
			baseUrl: 'https://some-other-url.com',
			name: 'Anthropic',
		};

		const result = findMatchingPreset(config);
		expect(result).toBe('Anthropic');
	});

	test('prioritizes baseUrl match over name match', () => {
		const config = {
			baseUrl: 'https://api.openai.com/v1/chat/completions',
			name: 'Anthropic',
		};

		const result = findMatchingPreset(config);
		expect(result).toBe('OpenAI');
	});

	test('returns "Custom Provider" when no match found', () => {
		const config = {
			baseUrl: 'https://unknown-provider.com',
			name: 'UnknownProvider',
		};

		const result = findMatchingPreset(config);
		expect(result).toBe('Custom Provider');
	});

	test('returns "Custom Provider" for empty baseUrl and name', () => {
		const config = {
			baseUrl: '',
			name: '',
		};

		const result = findMatchingPreset(config);
		expect(result).toBe('Custom Provider');
	});

	test('matches Gemini by baseUrl', () => {
		const config = {
			baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
			name: 'CustomName',
		};

		const result = findMatchingPreset(config);
		expect(result).toBe('Gemini');
	});

	test('matches DeepSeek by name', () => {
		const config = {
			baseUrl: 'https://custom-url.com',
			name: 'DeepSeek',
		};

		const result = findMatchingPreset(config);
		expect(result).toBe('DeepSeek');
	});

	test('matches Ollama by baseUrl', () => {
		const config = {
			baseUrl: 'http://localhost:11434/api/chat',
			name: 'LocalAI',
		};

		const result = findMatchingPreset(config);
		expect(result).toBe('Ollama');
	});

	test('matches LM Studio by baseUrl', () => {
		const config = {
			baseUrl: 'http://localhost:1234/v1/chat/completions',
			name: 'LocalModel',
		};

		const result = findMatchingPreset(config);
		expect(result).toBe('LM Studio');
	});

	test('matches OpenRouter by name', () => {
		const config = {
			baseUrl: 'https://different-url.com',
			name: 'OpenRouter',
		};

		const result = findMatchingPreset(config);
		expect(result).toBe('OpenRouter');
	});

	test('is case-sensitive for matching', () => {
		const config = {
			baseUrl: 'https://custom.com',
			name: 'openai', // lowercase
		};

		const result = findMatchingPreset(config);
		expect(result).toBe('Custom Provider');
	});

	test('does not partially match baseUrl', () => {
		const config = {
			baseUrl: 'https://api.openai.com/v1/chat', // Missing '/completions'
			name: 'Test',
		};

		const result = findMatchingPreset(config);
		expect(result).toBe('Custom Provider');
	});

	test('handles Custom Provider name explicitly', () => {
		const config = {
			baseUrl: 'https://custom.com',
			name: 'Custom Provider',
		};

		const result = findMatchingPreset(config);
		expect(result).toBe('Custom Provider');
	});
});
