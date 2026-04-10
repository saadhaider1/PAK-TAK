/**
 * Form Validation Utilities for PROPLEDGER
 * Provides user-friendly validation with clear error messages
 */

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Signup Form Validation
export function validateSignupForm(data: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  userType: string;
  country?: string;
  city?: string;
  terms?: boolean;
  agreeAgent?: boolean;
  licenseNumber?: string;
  experience?: string;
  specialization?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  // Full Name
  if (!data.fullName || data.fullName.trim().length < 2) {
    errors.fullName = 'Full name must be at least 2 characters';
  } else if (data.fullName.length > 100) {
    errors.fullName = 'Full name must not exceed 100 characters';
  } else if (!/^[a-zA-Z\s]+$/.test(data.fullName)) {
    errors.fullName = 'Full name can only contain letters and spaces';
  }

  // Email
  if (!data.email) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Please enter a valid email address';
  } else if (data.email.length > 255) {
    errors.email = 'Email must not exceed 255 characters';
  }

  // Phone
  if (!data.phone) {
    errors.phone = 'Phone number is required';
  } else if (!/^(\+92|0)?[0-9]{10}$/.test(data.phone.replace(/[\s-]/g, ''))) {
    errors.phone = 'Please enter a valid Pakistani phone number';
  }

  // Password
  if (!data.password) {
    errors.password = 'Password is required';
  } else if (data.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  } else if (data.password.length > 128) {
    errors.password = 'Password must not exceed 128 characters';
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(data.password)) {
    errors.password = 'Password must contain uppercase, lowercase, and numbers';
  }

  // Confirm Password
  if (!data.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  // User Type Specific Validation
  if (data.userType === 'agent') {
    if (!data.city || data.city.trim().length < 2) {
      errors.city = 'City is required for agents';
    }
    if (!data.licenseNumber || data.licenseNumber.trim().length < 5) {
      errors.licenseNumber = 'Valid license number is required';
    }
    if (!data.experience) {
      errors.experience = 'Experience is required';
    }
    if (!data.specialization) {
      errors.specialization = 'Specialization is required';
    }
    if (!data.agreeAgent) {
      errors.agreeAgent = 'You must agree to agent terms';
    }
  } else {
    if (!data.country || data.country.trim().length < 2) {
      errors.country = 'Country is required';
    }
    if (!data.terms) {
      errors.terms = 'You must agree to terms and conditions';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// Login Form Validation
export function validateLoginForm(data: {
  email: string;
  password: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.email) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!data.password) {
    errors.password = 'Password is required';
  } else if (data.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// Message Form Validation
export function validateMessageForm(data: {
  subject: string;
  message: string;
  priority?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.subject || data.subject.trim().length < 3) {
    errors.subject = 'Subject must be at least 3 characters';
  } else if (data.subject.length > 200) {
    errors.subject = 'Subject must not exceed 200 characters';
  }

  if (!data.message || data.message.trim().length < 10) {
    errors.message = 'Message must be at least 10 characters';
  } else if (data.message.length > 2000) {
    errors.message = 'Message must not exceed 2000 characters';
  }

  if (data.priority && !['normal', 'high', 'urgent'].includes(data.priority)) {
    errors.priority = 'Invalid priority level';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// Real-time Field Validation
export function validateField(fieldName: string, value: any, rules?: any): string | null {
  switch (fieldName) {
    case 'email':
      if (!value) return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
      return null;

    case 'password':
      if (!value) return 'Password is required';
      if (value.length < 8) return 'Password must be at least 8 characters';
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(value)) {
        return 'Must contain uppercase, lowercase, and numbers';
      }
      return null;

    case 'phone':
      if (!value) return 'Phone number is required';
      if (!/^(\+92|0)?[0-9]{10}$/.test(value.replace(/[\s-]/g, ''))) {
        return 'Invalid phone number format';
      }
      return null;

    case 'fullName':
      if (!value || value.trim().length < 2) return 'Name must be at least 2 characters';
      if (!/^[a-zA-Z\s]+$/.test(value)) return 'Name can only contain letters';
      return null;

    default:
      return null;
  }
}

// Sanitize and Validate Input
export function sanitizeInput(input: string, maxLength: number = 255): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, maxLength);
}

// Check if form has changes (for unsaved changes warning)
export function hasFormChanges(original: any, current: any): boolean {
  return JSON.stringify(original) !== JSON.stringify(current);
}
