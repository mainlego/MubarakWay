/**
 * Password validation utility for admin users
 *
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */

const validatePassword = (password) => {
  const errors = [];

  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*...)');
  }

  // Check for common weak passwords
  const weakPasswords = [
    'password', 'password123', '12345678', 'qwerty123',
    'admin123', 'letmein', 'welcome123', 'Password1!'
  ];

  if (weakPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a more unique password');
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password)
  };
};

const calculatePasswordStrength = (password) => {
  let strength = 0;

  // Length check
  if (password.length >= 8) strength += 1;
  if (password.length >= 12) strength += 1;
  if (password.length >= 16) strength += 1;

  // Character variety
  if (/[a-z]/.test(password)) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/[0-9]/.test(password)) strength += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 1;

  // Additional complexity
  if (password.length >= 12 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    strength += 1;
  }

  if (strength <= 3) return 'weak';
  if (strength <= 5) return 'medium';
  if (strength <= 7) return 'strong';
  return 'very-strong';
};

const generatePasswordRequirements = () => {
  return {
    minLength: 8,
    requiresUppercase: true,
    requiresLowercase: true,
    requiresNumber: true,
    requiresSpecialChar: true,
    message: 'Password must be at least 8 characters and contain uppercase, lowercase, number, and special character',
    examples: [
      'Secure@Pass123',
      'MyS3cure!Pwd',
      'Admin#2025Pwd'
    ]
  };
};

module.exports = {
  validatePassword,
  calculatePasswordStrength,
  generatePasswordRequirements
};
