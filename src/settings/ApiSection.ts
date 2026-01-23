import { App } from 'obsidian';

import type AutoClassifierPlugin from '../main';
import { ClassificationRuleSection } from './ClassificationRuleSection';
import { ModelSection } from './ModelSection';
import { PlanConnectionsSection } from './PlanConnectionsSection';
import { ProviderSection } from './ProviderSection';

export class Api {
	private readonly app: App;
	private readonly providerSection: ProviderSection;
	private readonly modelSection: ModelSection;
	private readonly classificationRuleSection: ClassificationRuleSection;
	private readonly planConnectionsSection: PlanConnectionsSection;

	constructor(
		private readonly plugin: AutoClassifierPlugin,
		private readonly containerEl: HTMLElement
	) {
		this.app = plugin.app;
		const onRefresh = () => this.display();

		this.providerSection = new ProviderSection(plugin, this.app, onRefresh);
		this.modelSection = new ModelSection(plugin, this.app, onRefresh);
		this.classificationRuleSection = new ClassificationRuleSection(plugin, onRefresh);
		this.planConnectionsSection = new PlanConnectionsSection(plugin, this.app, onRefresh);
	}

	display(): void {
		const { classificationRule, providers, selectedModel, codexConnection } = this.plugin.settings;
		this.containerEl.empty();
		this.containerEl.createEl('h2', { text: 'API Configuration' });

		this.classificationRuleSection.render(this.containerEl, classificationRule);
		this.planConnectionsSection.render(this.containerEl, codexConnection);
		this.providerSection.render(this.containerEl, providers);
		this.modelSection.render(this.containerEl, providers, selectedModel);
	}
}
