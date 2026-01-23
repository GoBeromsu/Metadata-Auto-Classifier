import { App, Platform } from 'obsidian';

import { CodexOAuth, formatTokenExpiry, isTokenExpired, CODEX_OAUTH } from '../auth';
import type { OAuthTokens } from '../auth';
import type AutoClassifierPlugin from '../main';
import { getProviderPreset } from '../lib';
import type { ProviderConfig } from '../types';
import { Setting } from './components/Setting';
import { Notice } from './components/Notice';

/**
 * Plan Connections section for OAuth-based provider connections
 * Currently supports Codex (ChatGPT Pro) connection
 */
export class PlanConnectionsSection {
	private codexOAuth: CodexOAuth;

	constructor(
		private readonly plugin: AutoClassifierPlugin,
		private readonly app: App,
		private readonly onRefresh: () => void
	) {
		this.codexOAuth = new CodexOAuth();
	}

	render(containerEl: HTMLElement, codexConnection?: OAuthTokens): void {
		const section = containerEl.createEl('div', { cls: 'plan-connections-section' });
		section.createEl('h3', { text: 'Plan Connections' });

		// Desktop-only notice
		if (!Platform.isDesktop) {
			Setting.create(section, {
				name: 'Desktop Only',
				desc: 'Plan connections require the desktop app to authenticate via browser.',
			});
			return;
		}

		this.renderCodexConnection(section, codexConnection);
	}

	private renderCodexConnection(containerEl: HTMLElement, connection?: OAuthTokens): void {
		const isConnected = connection && !isTokenExpired(connection);
		const statusText = isConnected
			? `Connected (${formatTokenExpiry(connection)})`
			: 'Not connected';

		Setting.create(containerEl, {
			name: 'Codex (ChatGPT Pro)',
			desc: isConnected ? statusText : 'Connect your ChatGPT Pro account to use Codex API',
			button: {
				text: isConnected ? 'Disconnect' : 'Connect',
				warning: isConnected,
				onClick: isConnected ? () => this.disconnectCodex() : () => this.connectCodex(),
			},
		});

		// Add info text about requirements
		if (!isConnected) {
			const infoEl = containerEl.createEl('div', {
				cls: 'setting-item-description plan-connection-info',
			});
			infoEl.style.marginTop = '-8px';
			infoEl.style.marginBottom = '16px';
			infoEl.style.paddingLeft = '16px';
			infoEl.style.color = 'var(--text-muted)';
			infoEl.style.fontSize = '0.85em';
			infoEl.innerHTML = '⚠️ Requires ChatGPT Pro subscription';
		}
	}

	private async connectCodex(): Promise<void> {
		try {
			Notice.success('Opening browser for authentication...');

			const tokens = await this.codexOAuth.startAuthFlow();

			// Save tokens to settings
			this.plugin.settings.codexConnection = tokens;

			// Auto-add Codex provider if not exists
			await this.addCodexProviderIfNeeded(tokens);

			await this.plugin.saveSettings();
			Notice.success('Successfully connected to Codex!');
			this.onRefresh();
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			if (message.includes('timeout') || message.includes('cancelled')) {
				Notice.success('Authentication cancelled');
			} else {
				Notice.error(new Error(`Failed to connect: ${message}`));
			}
		}
	}

	private async disconnectCodex(): Promise<void> {
		const confirmed = confirm(
			'Are you sure you want to disconnect from Codex? This will also remove the Codex provider.'
		);
		if (!confirmed) return;

		// Remove tokens
		this.plugin.settings.codexConnection = undefined;

		// Remove Codex provider if exists
		await this.removeCodexProvider();

		await this.plugin.saveSettings();
		Notice.success('Disconnected from Codex');
		this.onRefresh();
	}

	/**
	 * Automatically add Codex provider when connecting
	 */
	private async addCodexProviderIfNeeded(tokens: OAuthTokens): Promise<void> {
		const existingProvider = this.plugin.settings.providers.find((p) => p.name === 'Codex');

		if (existingProvider) {
			// Update existing provider with new tokens
			existingProvider.oauth = tokens;
			existingProvider.authType = 'oauth';
			return;
		}

		// Create new Codex provider from preset
		const preset = getProviderPreset('Codex');
		const codexProvider: ProviderConfig = {
			name: preset.name,
			baseUrl: CODEX_OAUTH.API_ENDPOINT,
			temperature: preset.temperature,
			models: preset.popularModels,
			apiKey: '', // Not used for OAuth
			authType: 'oauth',
			oauth: tokens,
		};

		this.plugin.settings.providers.push(codexProvider);
	}

	/**
	 * Remove Codex provider when disconnecting
	 */
	private async removeCodexProvider(): Promise<void> {
		this.plugin.settings.providers = this.plugin.settings.providers.filter(
			(p) => p.name !== 'Codex'
		);

		// Clear selection if Codex was selected
		if (this.plugin.settings.selectedProvider === 'Codex') {
			this.plugin.settings.selectedProvider = '';
			this.plugin.settings.selectedModel = '';
		}
	}

	/**
	 * Cancel any ongoing OAuth flow
	 */
	cancelFlow(): void {
		this.codexOAuth.cancelFlow();
	}
}
