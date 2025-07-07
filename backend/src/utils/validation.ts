import path from 'path';
import { createHash } from 'crypto';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitized?: string;
}

export class InputValidator {
  
  static validateLocation(location: unknown): ValidationResult {
    if (!location || typeof location !== 'string') {
      return { isValid: false, error: 'Location parameter is required and must be a string' };
    }

    const sanitized = location.trim();
    
    if (sanitized.length < 1) {
      return { isValid: false, error: 'Location cannot be empty' };
    }
    
    if (sanitized.length > 100) {
      return { isValid: false, error: 'Location name too long (max 100 characters)' };
    }
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /[<>]/,  // HTML tags
      /javascript:/i,  // JavaScript protocol
      /on\w+\s*=/i,  // Event handlers
      /script/i,  // Script tags
      /[\x00-\x1f\x7f-\x9f]/,  // Control characters
      /^\s*$/,  // Only whitespace
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(sanitized)) {
        return { isValid: false, error: 'Location contains invalid characters' };
      }
    }
    
    return { isValid: true, sanitized };
  }
  
  static validateSearchQuery(query: unknown): ValidationResult {
    if (!query || typeof query !== 'string') {
      return { isValid: false, error: 'Query parameter is required and must be a string' };
    }

    const sanitized = query.trim();
    
    if (sanitized.length < 2) {
      return { isValid: false, error: 'Query must be at least 2 characters long' };
    }
    
    if (sanitized.length > 50) {
      return { isValid: false, error: 'Query too long (max 50 characters)' };
    }
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /[<>]/,  // HTML tags
      /javascript:/i,  // JavaScript protocol
      /on\w+\s*=/i,  // Event handlers
      /script/i,  // Script tags
      /[\x00-\x1f\x7f-\x9f]/,  // Control characters
      /^\s*$/,  // Only whitespace
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(sanitized)) {
        return { isValid: false, error: 'Query contains invalid characters' };
      }
    }
    
    return { isValid: true, sanitized };
  }
  
  static validateFilePath(filePath: unknown): ValidationResult {
    if (!filePath || typeof filePath !== 'string') {
      return { isValid: false, error: 'File path must be a string' };
    }

    const sanitized = filePath.trim();
    
    if (sanitized.length === 0) {
      return { isValid: false, error: 'File path cannot be empty' };
    }
    
    if (sanitized.length > 255) {
      return { isValid: false, error: 'File path too long (max 255 characters)' };
    }
    
    // Check for path traversal attacks
    const pathTraversalPatterns = [
      /\.\./,  // Parent directory
      /\.\\/,  // Current directory with backslash
      /\.\/(?!$)/,  // Current directory (except at end)
      /\/\//,  // Double slash
      /\\\\/, // Double backslash
      /[\x00-\x1f\x7f-\x9f]/,  // Control characters
      /[<>|"*?]/,  // Invalid filename characters
    ];
    
    for (const pattern of pathTraversalPatterns) {
      if (pattern.test(sanitized)) {
        return { isValid: false, error: 'File path contains invalid or dangerous characters' };
      }
    }
    
    // Resolve path to check for traversal
    const resolved = path.resolve(sanitized);
    const normalized = path.normalize(sanitized);
    
    if (normalized !== sanitized) {
      return { isValid: false, error: 'File path contains path traversal attempts' };
    }
    
    return { isValid: true, sanitized };
  }
  
  static validateSocketEventType(eventType: unknown): ValidationResult {
    if (!eventType || typeof eventType !== 'string') {
      return { isValid: false, error: 'Event type must be a string' };
    }

    const sanitized = eventType.trim();
    
    if (sanitized.length === 0) {
      return { isValid: false, error: 'Event type cannot be empty' };
    }
    
    if (sanitized.length > 50) {
      return { isValid: false, error: 'Event type too long (max 50 characters)' };
    }
    
    // Only allow alphanumeric characters, hyphens, and underscores
    if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
      return { isValid: false, error: 'Event type contains invalid characters' };
    }
    
    return { isValid: true, sanitized };
  }
  
  static validateSocketPayload(payload: unknown): ValidationResult {
    if (payload === null || payload === undefined) {
      return { isValid: true, sanitized: payload };
    }
    
    // Check payload size (prevent large payloads)
    const payloadStr = JSON.stringify(payload);
    if (payloadStr.length > 10000) {  // 10KB limit
      return { isValid: false, error: 'Payload too large (max 10KB)' };
    }
    
    // Check for suspicious patterns in stringified payload
    const suspiciousPatterns = [
      /javascript:/i,  // JavaScript protocol
      /on\w+\s*=/i,  // Event handlers
      /<script/i,  // Script tags
      /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]/,  // Control characters (except tab, newline, carriage return)
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(payloadStr)) {
        return { isValid: false, error: 'Payload contains suspicious content' };
      }
    }
    
    return { isValid: true, sanitized: payload };
  }
  
  static validateNumberParameter(value: unknown, min: number = 0, max: number = 100): ValidationResult {
    if (value === null || value === undefined) {
      return { isValid: true, sanitized: value };
    }
    
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      if (isNaN(parsed)) {
        return { isValid: false, error: 'Parameter must be a valid number' };
      }
      value = parsed;
    }
    
    if (typeof value !== 'number') {
      return { isValid: false, error: 'Parameter must be a number' };
    }
    
    if (value < min || value > max) {
      return { isValid: false, error: `Parameter must be between ${min} and ${max}` };
    }
    
    return { isValid: true, sanitized: value };
  }
}

export class HTMLEscaper {
  
  static escape(text: string): string {
    const escapeMap: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;'
    };
    
    return text.replace(/[&<>"'`=\/]/g, (char) => escapeMap[char] || char);
  }
  
  static escapeAttribute(attr: string): string {
    return attr.replace(/[&<>"']/g, (char) => {
      const escapeMap: { [key: string]: string } = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      };
      return escapeMap[char] || char;
    });
  }
  
  static escapeJSON(obj: any): any {
    if (typeof obj === 'string') {
      return this.escape(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.escapeJSON(item));
    }
    
    if (obj !== null && typeof obj === 'object') {
      const escaped: any = {};
      for (const [key, value] of Object.entries(obj)) {
        escaped[this.escape(key)] = this.escapeJSON(value);
      }
      return escaped;
    }
    
    return obj;
  }
}

export class RateLimiter {
  private static requests: Map<string, number[]> = new Map();
  
  static isAllowed(identifier: string, maxRequests: number = 100, windowMs: number = 15 * 60 * 1000): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }
    
    const requests = this.requests.get(identifier)!;
    
    // Remove old requests outside the window
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }
  
  static cleanup(): void {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;  // 15 minutes
    
    for (const [identifier, requests] of this.requests.entries()) {
      const validRequests = requests.filter(timestamp => timestamp > now - windowMs);
      if (validRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, validRequests);
      }
    }
  }
}

// Utility to generate nonce for CSP
export function generateNonce(): string {
  const buffer = Buffer.alloc(16);
  for (let i = 0; i < 16; i++) {
    buffer[i] = Math.floor(Math.random() * 256);
  }
  return buffer.toString('base64');
}

// Utility to hash sensitive data
export function hashSensitiveData(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}