/**
 * Secure input component with XSS protection and validation
 */

import { useState, useCallback, ChangeEvent, KeyboardEvent } from 'react'
import { InputSanitizer, URLValidator } from '../utils/cryptoUtils'
import { AlertTriangle, CheckCircle } from 'lucide-react'

interface SecureInputProps {
  value: string
  onChange: (value: string) => void
  onEnter?: () => void
  placeholder?: string
  type?: 'text' | 'url' | 'email'
  maxLength?: number
  className?: string
  required?: boolean
  disabled?: boolean
  'data-testid'?: string
}

export function SecureInput({
  value,
  onChange,
  onEnter,
  placeholder,
  type = 'text',
  maxLength = 500,
  className = '',
  required = false,
  disabled = false,
  'data-testid': testId
}: SecureInputProps) {
  const [validationError, setValidationError] = useState<string>('')
  const [isValid, setIsValid] = useState(true)

  const validateInput = useCallback((inputValue: string): boolean => {
    // Basic validation
    if (!InputSanitizer.validateInput(inputValue, maxLength)) {
      setValidationError('Input contains invalid characters or is too long')
      setIsValid(false)
      return false
    }

    // Type-specific validation
    if (type === 'url' && inputValue.trim()) {
      if (!URLValidator.isAllowedURL(inputValue)) {
        setValidationError('URL is not allowed or contains invalid characters')
        setIsValid(false)
        return false
      }
    }

    if (type === 'email' && inputValue.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(inputValue)) {
        setValidationError('Invalid email format')
        setIsValid(false)
        return false
      }
    }

    // Required field validation
    if (required && !inputValue.trim()) {
      setValidationError('This field is required')
      setIsValid(false)
      return false
    }

    setValidationError('')
    setIsValid(true)
    return true
  }, [type, maxLength, required])

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    
    // Sanitize input immediately
    const sanitizedValue = InputSanitizer.sanitizeText(rawValue)
    
    // Validate the sanitized input
    const isValidInput = validateInput(sanitizedValue)
    
    // Always update the value (even if invalid) to show user what they typed
    onChange(sanitizedValue)
    
    // Don't prevent typing, but show validation feedback
    if (!isValidInput && sanitizedValue.length > 0) {
      // Show validation error
    }
  }, [onChange, validateInput])

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onEnter && isValid) {
      onEnter()
    }
  }, [onEnter, isValid])

  const baseClassName = `
    w-full px-3 py-2 rounded-lg border transition-colors
    bg-black/20 backdrop-blur-sm text-white placeholder-gray-400
    focus:outline-none focus:ring-2 focus:ring-blue-500/50
    ${isValid 
      ? 'border-gray-600 focus:border-blue-500' 
      : 'border-red-500 focus:border-red-400'
    }
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text" // Always use text type for security
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={maxLength}
          className={baseClassName}
          disabled={disabled}
          data-testid={testId}
          autoComplete="off"
          spellCheck="false"
        />
        
        {/* Validation indicator */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {value.length > 0 && (
            <>
              {isValid ? (
                <CheckCircle size={16} className="text-green-500" />
              ) : (
                <AlertTriangle size={16} className="text-red-500" />
              )}
            </>
          )}
        </div>
      </div>

      {/* Character count */}
      {maxLength && value.length > 0 && (
        <div className="absolute -bottom-5 right-0 text-xs text-gray-400">
          {value.length}/{maxLength}
        </div>
      )}

      {/* Validation error */}
      {validationError && (
        <div className="absolute -bottom-5 left-0 text-xs text-red-400">
          {validationError}
        </div>
      )}
    </div>
  )
}

/**
 * Secure textarea component with XSS protection
 */
interface SecureTextareaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  maxLength?: number
  rows?: number
  className?: string
  required?: boolean
  disabled?: boolean
}

export function SecureTextarea({
  value,
  onChange,
  placeholder,
  maxLength = 1000,
  rows = 4,
  className = '',
  required = false,
  disabled = false
}: SecureTextareaProps) {
  const [validationError, setValidationError] = useState<string>('')
  const [isValid, setIsValid] = useState(true)

  const validateInput = useCallback((inputValue: string): boolean => {
    if (!InputSanitizer.validateInput(inputValue, maxLength)) {
      setValidationError('Input contains invalid characters or is too long')
      setIsValid(false)
      return false
    }

    if (required && !inputValue.trim()) {
      setValidationError('This field is required')
      setIsValid(false)
      return false
    }

    setValidationError('')
    setIsValid(true)
    return true
  }, [maxLength, required])

  const handleChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    const rawValue = e.target.value
    const sanitizedValue = InputSanitizer.sanitizeText(rawValue)
    
    validateInput(sanitizedValue)
    onChange(sanitizedValue)
  }, [onChange, validateInput])

  const baseClassName = `
    w-full px-3 py-2 rounded-lg border transition-colors resize-none
    bg-black/20 backdrop-blur-sm text-white placeholder-gray-400
    focus:outline-none focus:ring-2 focus:ring-blue-500/50
    ${isValid 
      ? 'border-gray-600 focus:border-blue-500' 
      : 'border-red-500 focus:border-red-400'
    }
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        className={baseClassName}
        disabled={disabled}
        autoComplete="off"
        spellCheck="false"
      />

      {/* Character count */}
      {maxLength && value.length > 0 && (
        <div className="absolute -bottom-5 right-0 text-xs text-gray-400">
          {value.length}/{maxLength}
        </div>
      )}

      {/* Validation error */}
      {validationError && (
        <div className="absolute -bottom-5 left-0 text-xs text-red-400">
          {validationError}
        </div>
      )}
    </div>
  )
}