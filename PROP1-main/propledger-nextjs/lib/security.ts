/**
 * Security Utilities for PROPLEDGER
 * Handles input sanitization, validation, and security measures
 */

// XSS Protection - Sanitize HTML input
export function sanitizeHtml(input: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return input.replace(/[&<>"'/]/g, (char) => map[char]);
}

// SQL Injection Protection - Validate and sanitize database inputs
export function sanitizeSqlInput(input: string): string {
  // Remove SQL keywords and special characters
  return input
    .replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/gi, '')
    .replace(/[;'"\\]/g, '')
    .trim();
}

// Email Validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

// Phone Number Validation (Pakistani format)
export function isValidPhone(phone: string): boolean {
  // Supports: +92, 03XX, etc.
  const phoneRegex = /^(\+92|0)?[0-9]{10}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
}

// Password Strength Validation
export interface PasswordStrength {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  issues: string[];
}

export function validatePasswordStrength(password: string): PasswordStrength {
  const issues: string[] = [];
  let strength: 'weak' | 'medium' | 'strong' = 'weak';

  if (password.length < 8) {
    issues.push('Password must be at least 8 characters long');
  }
  if (!/[a-z]/.test(password)) {
    issues.push('Password must contain lowercase letters');
  }
  if (!/[A-Z]/.test(password)) {
    issues.push('Password must contain uppercase letters');
  }
  if (!/[0-9]/.test(password)) {
    issues.push('Password must contain numbers');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    issues.push('Password must contain special characters');
  }

  // Determine strength
  if (issues.length === 0) {
    strength = 'strong';
  } else if (issues.length <= 2) {
    strength = 'medium';
  }

  return {
    isValid: issues.length === 0,
    strength,
    issues,
  };
}

// CSRF Token Generation
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

// Rate Limiting Helper (Client-side tracking)
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore: Map<string, RateLimitEntry> = new Map();

export function checkRateLimit(key: string, maxAttempts: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (entry.count >= maxAttempts) {
    return false;
  }

  entry.count++;
  return true;
}

// Session Validation
export function isSessionValid(expiryTime: string | number): boolean {
  const expiry = typeof expiryTime === 'string' ? new Date(expiryTime).getTime() : expiryTime;
  return Date.now() < expiry;
}

// Input Length Validation
export function validateLength(input: string, min: number, max: number): boolean {
  return input.length >= min && input.length <= max;
}

// Numeric Validation
export function isValidNumber(value: string, min?: number, max?: number): boolean {
  const num = parseFloat(value);
  if (isNaN(num)) return false;
  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;
  return true;
}

// URL Validation
export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

// Sanitize File Name
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255);
}

// Check for Common Passwords
const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein', 'welcome'];

export function isCommonPassword(password: string): boolean {
  return commonPasswords.some((common) => password.toLowerCase().includes(common));
}

// Secure Random String Generator
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, Array.from(array)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
    .substring(0, length);
}

// Content Security Policy Helper
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  };
}

// Validate Pakistani CNIC
export function isValidCNIC(cnic: string): boolean {
  const cnicRegex = /^[0-9]{5}-[0-9]{7}-[0-9]$/;
  return cnicRegex.test(cnic);
}

// Mask Sensitive Data
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const maskedLocal = local.charAt(0) + '*'.repeat(local.length - 2) + local.charAt(local.length - 1);
  return `${maskedLocal}@${domain}`;
}

export function maskPhone(phone: string): string {
  if (phone.length < 4) return phone;
  return '*'.repeat(phone.length - 4) + phone.slice(-4);
}

// Detect Suspicious Activity
export function detectSuspiciousActivity(input: string): boolean {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /eval\(/i,
    /document\./i,
    /window\./i,
    /<iframe/i,
  ];
  return suspiciousPatterns.some((pattern) => pattern.test(input));
}
