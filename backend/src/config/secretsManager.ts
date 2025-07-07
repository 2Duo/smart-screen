import { SecretsManagerClient, CreateSecretCommand, UpdateSecretCommand } from '@aws-sdk/client-secrets-manager';
import { configManager } from './ConfigManager';

/**
 * AWS Secrets Manager integration utilities
 */

// Secret structure for the application
export interface SmartDisplaySecrets {
  // API Keys
  OPENWEATHER_API_KEY: string;
  
  // Google OAuth
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  
  // Security
  JWT_SECRET: string;
  
  // Database (if implemented)
  DATABASE_URL?: string;
  DATABASE_PASSWORD?: string;
  
  // Additional service keys
  THIRD_PARTY_API_KEYS?: {
    [serviceName: string]: string;
  };
}

/**
 * Create or update secrets in AWS Secrets Manager
 * This is typically used for initial setup or updates
 */
export async function createOrUpdateSecrets(
  secretName: string,
  secrets: Partial<SmartDisplaySecrets>,
  description?: string
): Promise<void> {
  if (!configManager.isServiceConfigured('aws-secrets')) {
    throw new Error('AWS Secrets Manager is not configured');
  }

  const secretsClient = new SecretsManagerClient({
    region: configManager.get('AWS_REGION'),
    credentials: {
      accessKeyId: configManager.get('AWS_ACCESS_KEY_ID')!,
      secretAccessKey: configManager.get('AWS_SECRET_ACCESS_KEY')!,
    },
  });

  const secretString = JSON.stringify(secrets, null, 2);

  try {
    // Try to update existing secret first
    await secretsClient.send(new UpdateSecretCommand({
      SecretId: secretName,
      SecretString: secretString,
      Description: description,
    }));
    
    console.log(`✅ Successfully updated secret: ${secretName}`);
  } catch (error: any) {
    if (error.name === 'ResourceNotFoundException') {
      // Secret doesn't exist, create it
      try {
        await secretsClient.send(new CreateSecretCommand({
          Name: secretName,
          SecretString: secretString,
          Description: description || `Smart Display secrets for ${configManager.get('NODE_ENV')} environment`,
        }));
        
        console.log(`✅ Successfully created secret: ${secretName}`);
      } catch (createError) {
        console.error(`❌ Failed to create secret: ${secretName}`, createError);
        throw createError;
      }
    } else {
      console.error(`❌ Failed to update secret: ${secretName}`, error);
      throw error;
    }
  }
}

/**
 * Generate a secure JWT secret
 */
export function generateJWTSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Validate that all required secrets are present
 */
export function validateSecrets(secrets: any): secrets is SmartDisplaySecrets {
  const required = ['OPENWEATHER_API_KEY'];
  
  if (configManager.get('NODE_ENV') === 'production') {
    required.push('JWT_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET');
  }

  for (const key of required) {
    if (!secrets[key] || typeof secrets[key] !== 'string' || secrets[key].trim() === '') {
      throw new Error(`Required secret '${key}' is missing or empty`);
    }
  }

  return true;
}

/**
 * Setup script for AWS Secrets Manager
 * This can be used for initial deployment or secret rotation
 */
export async function setupSecretsManager(): Promise<void> {
  console.log('🔐 Setting up AWS Secrets Manager...');
  
  if (!configManager.isServiceConfigured('aws-secrets')) {
    console.warn('⚠️  AWS Secrets Manager is not configured. Skipping setup.');
    return;
  }

  const environment = configManager.get('NODE_ENV');
  const secretName = configManager.get('SECRETS_MANAGER_SECRET_NAME');
  
  if (!secretName) {
    console.warn('⚠️  SECRETS_MANAGER_SECRET_NAME is not configured. Skipping setup.');
    return;
  }

  // Check if secrets already exist
  try {
    const existingSecrets = await configManager.getSecret(secretName);
    console.log('✅ Secrets already exist in AWS Secrets Manager');
    
    // Validate existing secrets
    validateSecrets(existingSecrets);
    console.log('✅ Existing secrets are valid');
    
    return;
  } catch (error) {
    console.log('📝 Secrets not found or invalid, creating new ones...');
  }

  // Create new secrets
  const newSecrets: Partial<SmartDisplaySecrets> = {};

  // Generate JWT secret if in production
  if (environment === 'production') {
    newSecrets.JWT_SECRET = generateJWTSecret();
    console.log('🔑 Generated new JWT secret');
  }

  // Prompt for required secrets (in a real scenario, these would be provided via environment or manual input)
  console.log(`
⚠️  Please set the following secrets manually in AWS Secrets Manager or via environment variables:

Required secrets for ${environment} environment:
- OPENWEATHER_API_KEY: Your OpenWeatherMap API key
- GOOGLE_CLIENT_ID: Your Google OAuth Client ID  
- GOOGLE_CLIENT_SECRET: Your Google OAuth Client Secret

Optional secrets:
- DATABASE_URL: Database connection string (if using database)
- Additional service API keys

You can use the AWS Console or CLI to set these values in the secret: ${secretName}
`);

  // Create the secret structure (with placeholder values)
  const secretsToCreate: Partial<SmartDisplaySecrets> = {
    OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY || 'REPLACE_WITH_ACTUAL_KEY',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || 'REPLACE_WITH_ACTUAL_CLIENT_ID',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || 'REPLACE_WITH_ACTUAL_CLIENT_SECRET',
    ...newSecrets,
  };

  try {
    await createOrUpdateSecrets(
      secretName, 
      secretsToCreate,
      `Smart Display secrets for ${environment} environment - Auto-generated on ${new Date().toISOString()}`
    );
    
    console.log(`✅ Secrets manager setup complete for environment: ${environment}`);
    console.log(`🔐 Secret name: ${secretName}`);
    console.log('⚠️  Remember to replace placeholder values with actual API keys!');
  } catch (error) {
    console.error('❌ Failed to setup secrets manager:', error);
    throw error;
  }
}

/**
 * Example usage and testing
 */
export async function testSecretsManager(): Promise<void> {
  console.log('🧪 Testing AWS Secrets Manager integration...');
  
  if (!configManager.isServiceConfigured('aws-secrets')) {
    console.log('⚠️  AWS Secrets Manager is not configured. Skipping test.');
    return;
  }

  const secretName = configManager.get('SECRETS_MANAGER_SECRET_NAME');
  
  if (!secretName) {
    console.log('⚠️  SECRETS_MANAGER_SECRET_NAME is not configured. Skipping test.');
    return;
  }

  try {
    const secrets = await configManager.getSecret(secretName);
    console.log('✅ Successfully retrieved secrets from AWS Secrets Manager');
    
    // Test configuration with secrets
    const configWithSecrets = await configManager.getConfigWithSecrets();
    console.log('✅ Successfully merged configuration with secrets');
    
    // Validate secrets
    validateSecrets(secrets);
    console.log('✅ All required secrets are present and valid');
    
    return;
  } catch (error) {
    console.error('❌ Secrets Manager test failed:', error);
    throw error;
  }
}