import type { ProviderConfig } from 'api/types';
import type AutoClassifierPlugin from 'main';
import type { App } from 'obsidian';
import { CommonSetting } from 'ui/components/common/CommonSetting';
import { ProviderModal } from 'ui/modals/ProviderModal';

export class ProviderSection {
	constructor(
		private readonly plugin: AutoClassifierPlugin,
		private readonly app: App,
		private readonly onRefresh: () => void
	) {}

	render(containerEl: HTMLElement, providers: ProviderConfig[]): void {
		const providerSection = containerEl.createEl('div', { cls: 'provider-section' });
		providerSection.createEl('h3', { text: 'Providers' });

		providers.forEach((provider) => {
			CommonSetting.create(providerSection, {
				name: provider.name,
				buttons: [
					{
						icon: 'pencil',
						text: 'Edit',
						onClick: () => this.openProviderModal('edit', provider),
					},
					{
						icon: 'trash',
						text: 'Delete',
						onClick: async () => {
							const confirmed = confirm(
								`Are you sure you want to delete "${provider.name}" provider?`
							);
							if (!confirmed) return;

							this.plugin.settings.providers = this.plugin.settings.providers.filter(
								(p) => p.name !== provider.name
							);

							if (this.plugin.settings.selectedProvider === provider.name) {
								this.plugin.settings.selectedProvider = '';
								this.plugin.settings.selectedModel = '';
							}

							await this.plugin.saveSettings();
							this.onRefresh();
						},
					},
				],
			});
		});

		CommonSetting.create(providerSection, {
			name: '',
			button: {
				text: '+ Add provider',
				onClick: () => this.openProviderModal('add'),
			},
		});
	}

	private openProviderModal(type: 'add' | 'edit', providerToEdit?: ProviderConfig): void {
		const modal = new ProviderModal(
			this.app,
			async (savedProvider: ProviderConfig) => {
				if (type === 'add') {
					this.plugin.settings.providers.push(savedProvider);
				} else if (type === 'edit' && providerToEdit) {
					const index = this.plugin.settings.providers.findIndex(
						(p) => p.name === providerToEdit.name
					);
					if (index !== -1) {
						this.plugin.settings.providers[index] = savedProvider;

						if (this.plugin.settings.selectedProvider === providerToEdit.name) {
							this.plugin.settings.selectedProvider = savedProvider.name;
						}
					}
				}
				await this.plugin.saveSettings();
				this.onRefresh();
			},
			providerToEdit
		);
		modal.open();
	}
}
