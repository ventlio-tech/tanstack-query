import type { PowerSyncConfig } from './powersync.interface';
import { usePowerSyncStore } from './powersync-store';

/**
 * Configures the PowerSync data provider.
 * Call this during app initialization (e.g. in bootstrapQueryRequest)
 * to enable transparent PowerSync data resolution in useGetRequest and mutation hooks.
 *
 * @param config - PowerSync configuration including mode, collection registry, and space ID accessor
 */
export function bootstrapPowerSync(config: PowerSyncConfig): void {
  usePowerSyncStore.getState().setConfig(config);
}

/**
 * Switch the data source mode at runtime.
 * Useful for toggling between API and PowerSync modes dynamically
 * (e.g. when a local server becomes available/unavailable).
 */
export function setDataSourceMode(mode: 'api' | 'powersync'): void {
  usePowerSyncStore.getState().setMode(mode);
}
