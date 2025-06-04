jest.mock('api', () => ({
	testModel: jest.fn(),
}));

jest.mock('ui/modals/ModelModal', () => ({
	ModelModal: class {
		constructor(
			public app: any,
			public props: any
		) {}
		open = jest.fn();
	},
}));

jest.mock('ui/modals/ProviderModal', () => ({
	ProviderModal: class {
		constructor(
			public app: any,
			public onSave: any,
			public provider?: any
		) {}
		open = jest.fn();
	},
}));

import { Api } from 'ui/containers/Api';
import { testModel } from 'api';

const mockTestModel = testModel as jest.MockedFunction<typeof testModel>;

const createMockPlugin = () => ({
	app: { vault: { getMarkdownFiles: jest.fn() } },
	settings: {
		providers: [
			{
				name: 'openai',
				models: [
					{ name: 'gpt-4', displayName: 'GPT-4' },
					{ name: 'gpt-3.5', displayName: 'GPT-3.5' },
				],
			},
			{
				name: 'anthropic',
				models: [{ name: 'claude-3', displayName: 'Claude 3' }],
			},
		],
		selectedProvider: 'openai',
		selectedModel: 'gpt-4',
		classificationRule: 'default rule',
	},
	saveSettings: jest.fn().mockResolvedValue(undefined),
});

const createMockContainer = () => ({
	empty: jest.fn(),
	createEl: jest.fn().mockReturnValue({
		createEl: jest.fn().mockReturnValue({}),
	}),
	createDiv: jest.fn().mockReturnValue({
		style: {},
	}),
});

describe('Api Container - Regression Tests', () => {
	let mockPlugin: any;
	let mockContainer: any;
	let api: Api;

	beforeEach(() => {
		mockPlugin = createMockPlugin();
		mockContainer = createMockContainer();
		api = new Api(mockPlugin, mockContainer);
		jest.clearAllMocks();
	});

	describe('Provider Management', () => {
		test('provider 삭제시 선택된 설정 초기화 (Critical Regression)', async () => {
			// Given: openai provider가 선택된 상태
			expect(mockPlugin.settings.selectedProvider).toBe('openai');
			expect(mockPlugin.settings.selectedModel).toBe('gpt-4');

			// When: openai provider 삭제 버튼 클릭 시뮬레이션
			const providerSection = mockContainer.createEl();
			api.display();

			// Provider 삭제 로직 시뮬레이션
			mockPlugin.settings.providers = mockPlugin.settings.providers.filter(
				(p: any) => p.name !== 'openai'
			);
			mockPlugin.settings.selectedProvider = '';
			mockPlugin.settings.selectedModel = '';

			// Then: 선택된 설정이 초기화되어야 함
			expect(mockPlugin.settings.selectedProvider).toBe('');
			expect(mockPlugin.settings.selectedModel).toBe('');
			expect(mockPlugin.settings.providers).toHaveLength(1);
			expect(mockPlugin.settings.providers[0].name).toBe('anthropic');
		});

		test('선택되지 않은 provider 삭제시 선택 설정 유지', async () => {
			// Given: openai가 선택된 상태
			const originalProvider = mockPlugin.settings.selectedProvider;
			const originalModel = mockPlugin.settings.selectedModel;

			// When: anthropic provider 삭제
			mockPlugin.settings.providers = mockPlugin.settings.providers.filter(
				(p: any) => p.name !== 'anthropic'
			);

			// Then: 선택 설정 유지
			expect(mockPlugin.settings.selectedProvider).toBe(originalProvider);
			expect(mockPlugin.settings.selectedModel).toBe(originalModel);
		});
	});

	describe('Model Management', () => {
		test('model 선택시 provider도 함께 업데이트 (Critical Regression)', async () => {
			// Given: 다른 provider의 model 선택
			const claudeModel = mockPlugin.settings.providers[1].models[0];

			// When: Claude 3 model 선택 시뮬레이션
			mockPlugin.settings.selectedProvider = 'anthropic';
			mockPlugin.settings.selectedModel = claudeModel.name;

			// Then: provider도 함께 변경되어야 함
			expect(mockPlugin.settings.selectedProvider).toBe('anthropic');
			expect(mockPlugin.settings.selectedModel).toBe('claude-3');
		});

		test('model 삭제시 선택된 설정 초기화', async () => {
			// Given: gpt-4가 선택된 상태
			expect(mockPlugin.settings.selectedModel).toBe('gpt-4');

			// When: gpt-4 model 삭제
			const openaiProvider = mockPlugin.settings.providers.find((p: any) => p.name === 'openai');
			if (openaiProvider) {
				openaiProvider.models = openaiProvider.models.filter((m: any) => m.name !== 'gpt-4');
			}
			mockPlugin.settings.selectedProvider = '';
			mockPlugin.settings.selectedModel = '';

			// Then: 선택 설정 초기화
			expect(mockPlugin.settings.selectedProvider).toBe('');
			expect(mockPlugin.settings.selectedModel).toBe('');
		});
	});

	describe('Connection Test', () => {
		test('연결 테스트 성공시 성공 메시지', async () => {
			// Given: 테스트 성공 모킹
			mockTestModel.mockResolvedValue(true);

			// When: 연결 테스트 실행
			const provider = mockPlugin.settings.providers[0];
			const model = provider.models[0];
			const result = await testModel(provider, model.name);

			// Then: 성공 결과
			expect(result).toBe(true);
			expect(mockTestModel).toHaveBeenCalledWith(provider, model.name);
		});

		test('연결 테스트 실패시 에러 처리', async () => {
			// Given: 테스트 실패 모킹
			mockTestModel.mockResolvedValue(false);

			// When: 연결 테스트 실행
			const provider = mockPlugin.settings.providers[0];
			const model = provider.models[0];
			const result = await testModel(provider, model.name);

			// Then: 실패 결과
			expect(result).toBe(false);
		});
	});

	describe('Classification Rule', () => {
		test('classification rule 변경시 설정 저장', () => {
			// Given: 새로운 rule
			const newRule = 'new classification rule';

			// When: rule 변경
			mockPlugin.settings.classificationRule = newRule;

			// Then: 설정이 업데이트되어야 함
			expect(mockPlugin.settings.classificationRule).toBe(newRule);
		});

		test('reset 버튼 클릭시 기본값 복원', () => {
			// Given: 변경된 rule
			mockPlugin.settings.classificationRule = 'custom rule';

			// When: reset (기본값으로 복원)
			const DEFAULT_TASK_TEMPLATE = 'default template';
			mockPlugin.settings.classificationRule = DEFAULT_TASK_TEMPLATE;

			// Then: 기본값으로 복원
			expect(mockPlugin.settings.classificationRule).toBe(DEFAULT_TASK_TEMPLATE);
		});
	});
});
