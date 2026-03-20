import { PluginLogger } from './plugin-logger';

/**
 * Module-level logger for MAC.
 * Used by provider/lib layers that don't have direct plugin access.
 * The plugin sets debug mode via setDebug() after loading settings.
 */
let _debugMode = false;

export const macLogger = new PluginLogger('MAC', () => _debugMode);

export function setLoggerDebug(enabled: boolean): void {
	_debugMode = enabled;
}
