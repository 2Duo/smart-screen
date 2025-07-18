import dotenv from 'dotenv';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { envSchema, EnvConfig, ConfigValidationError, requiredSecrets, sensitiveFields } from './schema';
import path from 'path';
import fs from 'fs';

export class ConfigManager {
  private config: EnvConfig;
  private secretsClient?: SecretsManagerClient;
  private cachedSecrets: Map<string, any> = new Map();

  constructor() {
    this.loadEnvironmentFiles();
    this.config = this.validateEnvironment();
    this.initializeSecretsManager();
  }

  /**
   * Load environment files based on NODE_ENV
   */
  private loadEnvironmentFiles(): void {
    const environment = process.env.NODE_ENV || 'development';
    const rootDir = path.join(__dirname, '..', '..');

    // Load base .env file
    const baseEnvPath = path.join(rootDir, '.env');
    if (fs.existsSync(baseEnvPath)) {
      dotenv.config({ path: baseEnvPath });
    }

    // Load environment-specific .env file
    const envSpecificPath = path.join(rootDir, `.env.${environment}`);
    if (fs.existsSync(envSpecificPath)) {
      dotenv.config({ path: envSpecificPath, override: true });
    }

    // Load local override file (should be in .gitignore)
    const localEnvPath = path.join(rootDir, '.env.local');
    if (fs.existsSync(localEnvPath)) {
      dotenv.config({ path: localEnvPath, override: true });
    }
  }

  /**
   * Validate environment variables using Zod schema
   */
  private validateEnvironment(): EnvConfig {
    try {
      const parsed = envSchema.parse(process.env);
      
      // Check required secrets for current environment
      const environment = parsed.NODE_ENV;
      const required = requiredSecrets[environment] || [];
      
      for (const secret of required) {
        if (!process.env[secret]) {
          throw new Error(`Required secret '${secret}' is missing for environment '${environment}'`);
        }
      }

      this.logConfigurationSummary(parsed);
      return parsed;
    } catch (error) {
      if (error instanceof Error) {
        throw new ConfigValidationError(
          `Configuration validation failed: ${error.message}`,
          error as any
        );
      }
      throw error;
    }
  }

  /**
   * Initialize AWS Secrets Manager client if credentials are available
   */
  private initializeSecretsManager(): void {
    if (this.config.AWS_REGION && this.config.AWS_ACCESS_KEY_ID && this.config.AWS_SECRET_ACCESS_KEY) {
      this.secretsClient = new SecretsManagerClient({
        region: this.config.AWS_REGION,
        credentials: {
          accessKeyId: this.config.AWS_ACCESS_KEY_ID,
          secretAccessKey: this.config.AWS_SECRET_ACCESS_KEY,
        },
      });
    }
  }

  /**
   * Get configuration value
   */
  public get<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
    return this.config[key];
  }

  /**
   * Get all configuration (without sensitive values for logging)
   */
  public getAll(includeSensitive: boolean = false): Partial<EnvConfig> {
    if (includeSensitive) {
      return { ...this.config };
    }

    const sanitized: Partial<EnvConfig> = {};
    for (const [key, value] of Object.entries(this.config)) {
      if (sensitiveFields.includes(key as any)) {
        sanitized[key as keyof EnvConfig] = '***REDACTED***' as any;
      } else {
        sanitized[key as keyof EnvConfig] = value as any;
      }
    }
    return sanitized;
  }

  /**
   * Check if service is properly configured
   */
  public isServiceConfigured(service: 'weather' | 'google-oauth' | 'aws-secrets'): boolean {
    switch (service) {
      case 'weather':
        return !!this.config.OPENWEATHER_API_KEY;
      case 'google-oauth':
        return !!(this.config.GOOGLE_CLIENT_ID && this.config.GOOGLE_CLIENT_SECRET);
      case 'aws-secrets':
        return !!this.secretsClient;
      default:
        return false;
    }
  }

  /**
   * Get secret from AWS Secrets Manager
   */
  public async getSecret(secretName: string): Promise<any> {
    if (!this.secretsClient) {
      throw new Error('AWS Secrets Manager is not configured');
    }

    // Check cache first
    if (this.cachedSecrets.has(secretName)) {
      return this.cachedSecrets.get(secretName);
    }

    try {
      const command = new GetSecretValueCommand({ SecretId: secretName });
      const response = await this.secretsClient.send(command);
      
      if (!response.SecretString) {
        throw new Error(`Secret '${secretName}' has no string value`);
      }

      const secret = JSON.parse(response.SecretString);
      
      // Cache the secret
      this.cachedSecrets.set(secretName, secret);
      
      return secret;
    } catch (error) {
      console.error(`Failed to retrieve secret '${secretName}':`, error);
      throw new Error(`Failed to retrieve secret '${secretName}'`);
    }
  }

  /**
   * Get configuration with secrets merged from AWS Secrets Manager
   */
  public async getConfigWithSecrets(): Promise<EnvConfig & any> {
    const baseConfig = { ...this.config };

    if (this.secretsClient && this.config.SECRETS_MANAGER_SECRET_NAME) {
      try {
        const secrets = await this.getSecret(this.config.SECRETS_MANAGER_SECRET_NAME);
        return { ...baseConfig, ...secrets };
      } catch (error) {
        console.warn('Failed to load secrets from AWS Secrets Manager, using environment variables only');
      }
    }

    return baseConfig;
  }

  /**
   * Validate that all required services are configured
   */
  public validateRequiredServices(): void {
    const issues: string[] = [];

    if (!this.isServiceConfigured('weather')) {
      issues.push('Weather service: Missing OPENWEATHER_API_KEY');
    }

    if (!this.isServiceConfigured('google-oauth')) {
      issues.push('Google OAuth: Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
    }

    if (this.config.NODE_ENV === 'production') {
      if (!this.config.JWT_SECRET) {
        issues.push('Production environment: Missing JWT_SECRET');
      }
    }

    if (issues.length > 0) {
      throw new ConfigValidationError(
        `Configuration validation failed:\n${issues.join('\n')}`,
        new Error('Service configuration incomplete') as any
      );
    }
  }

  /**
   * Log configuration summary (without sensitive data)
   */
  private logConfigurationSummary(config: EnvConfig): void {
    console.log(`🔧 Configuration loaded for environment: ${config.NODE_ENV}`);
    console.log(`📡 Server will run on port: ${config.PORT}`);
    console.log(`🌐 Frontend URL: ${config.FRONTEND_URL}`);
    console.log(`🌤️  Weather service: ${this.isServiceConfigured('weather') ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`📅 Google OAuth: ${this.isServiceConfigured('google-oauth') ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`🔐 AWS Secrets Manager: ${this.isServiceConfigured('aws-secrets') ? '✅ Configured' : '❌ Not configured'}`);
  }

  /**
   * Reload configuration (useful for testing or hot-reloading)
   */
  public reload(): void {
    this.cachedSecrets.clear();
    this.loadEnvironmentFiles();
    this.config = this.validateEnvironment();
    this.initializeSecretsManager();
  }
}

// Export singleton instance
export const configManager = new ConfigManager();