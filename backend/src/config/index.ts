// Configuration entry point
export { configManager } from './ConfigManager';
export { envSchema, ConfigValidationError } from './schema';
export { setupSecretsManager, testSecretsManager, createOrUpdateSecrets } from './secretsManager';

// Initialize configuration on import
import { configManager } from './ConfigManager';

// Ensure configuration is validated at startup
try {
  configManager.validateRequiredServices();
  console.log('✅ Configuration validation successful');
} catch (error) {
  console.error('❌ Configuration validation failed:');
  console.error(error);
  throw error;
}