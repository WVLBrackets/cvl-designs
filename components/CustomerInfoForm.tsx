/**
 * Customer Information Form Component
 */

'use client'

import { useState } from 'react'
import type { ContactInfo } from '@/lib/types'

interface CustomerInfoFormProps {
  contactInfo: ContactInfo
  onChange: (contactInfo: ContactInfo) => void
  compact?: boolean
  accentColor?: string
}

function formatPhone(digitsOnly: string): string {
  const d = digitsOnly.replace(/\D/g, '').slice(0, 10)
  if (d.length === 0) return ''
  if (d.length <= 3) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

function isValidEmail(email: string): boolean {
  return /^([^\s@]+)@([^\s@]+)\.[^\s@]+$/.test(email)
}

/**
 * Helper function to validate contact info
 */
export function isContactInfoValid(contactInfo: ContactInfo): boolean {
  const phoneDigits = contactInfo.phoneNumber.replace(/\D/g, '')
  const phoneValid = phoneDigits.length === 10
  const emailValid = contactInfo.email.length > 0 && isValidEmail(contactInfo.email)
  const firstNameValid = contactInfo.parentFirstName.trim().length > 0
  const lastNameValid = contactInfo.parentLastName.trim().length > 0
  
  return emailValid && firstNameValid && lastNameValid && phoneValid
}

export default function CustomerInfoForm({ contactInfo, onChange, compact = false, accentColor = '' }: CustomerInfoFormProps) {
  const [phoneTouched, setPhoneTouched] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)

  const phoneDigits = contactInfo.phoneNumber.replace(/\D/g, '')
  const phoneValid = phoneDigits.length === 10
  const emailValid = contactInfo.email.length === 0 ? false : isValidEmail(contactInfo.email)

  const phoneInputClass = `w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
    phoneTouched && !phoneValid ? 'border-red-500' : 'border-gray-300'
  }`
  const emailInputClass = `w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
    emailTouched && !emailValid ? 'border-red-500' : 'border-gray-300'
  }`

  if (compact) {
    return (
      <div 
        className="bg-white rounded-lg shadow-md p-3"
        style={accentColor ? { borderWidth: '2px', borderStyle: 'solid', borderColor: accentColor } : {}}
      >
        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3">
          <input
            type="text"
            required
            value={contactInfo.parentFirstName}
            onChange={(e) => onChange({ ...contactInfo, parentFirstName: e.target.value })}
            className="w-full md:w-44 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="First name"
          />
          <input
            type="text"
            required
            value={contactInfo.parentLastName}
            onChange={(e) => onChange({ ...contactInfo, parentLastName: e.target.value })}
            className="w-full md:w-44 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Last name"
          />
          <span className="hidden md:inline text-gray-500">:</span>
          <input
            type="tel"
            required
            value={formatPhone(contactInfo.phoneNumber)}
            onChange={(e) => onChange({ ...contactInfo, phoneNumber: e.target.value })}
            onBlur={() => setPhoneTouched(true)}
            className={phoneInputClass.replace('w-full', 'w-full md:w-52')}
            placeholder="Phone"
          />
          <span className="hidden md:inline text-gray-500">-</span>
          <input
            type="email"
            required
            value={contactInfo.email}
            onChange={(e) => onChange({ ...contactInfo, email: e.target.value })}
            onBlur={() => setEmailTouched(true)}
            className={emailInputClass.replace('w-full', 'w-full md:flex-1')}
            placeholder="Email"
          />
        </div>
        {(phoneTouched && !phoneValid) && (
          <p className="text-red-600 text-sm mt-2">Please enter a 10 digit phone number.</p>
        )}
        {(emailTouched && !emailValid) && (
          <p className="text-red-600 text-sm">Please enter a valid email address.</p>
        )}
      </div>
    )
  }

  // Full form (initial)
  const isEmailComplete = emailValid
  const isFirstNameComplete = contactInfo.parentFirstName.trim().length > 0
  const isLastNameComplete = contactInfo.parentLastName.trim().length > 0
  const isPhoneComplete = phoneValid

  return (
    <div 
      className="bg-white rounded-lg shadow-md p-6"
      style={accentColor ? { borderWidth: '2px', borderStyle: 'solid', borderColor: accentColor } : {}}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address {isEmailComplete ? <span className="text-green-600">✓</span> : <span className="text-red-600">*</span>}
          </label>
          <input
            type="email"
            required
            value={contactInfo.email}
            onChange={(e) => onChange({ ...contactInfo, email: e.target.value })}
            onBlur={() => setEmailTouched(true)}
            className={emailInputClass}
            placeholder="your@email.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Parent First Name {isFirstNameComplete ? <span className="text-green-600">✓</span> : <span className="text-red-600">*</span>}
          </label>
          <input
            type="text"
            required
            value={contactInfo.parentFirstName}
            onChange={(e) => onChange({ ...contactInfo, parentFirstName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="First Name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Parent Last Name {isLastNameComplete ? <span className="text-green-600">✓</span> : <span className="text-red-600">*</span>}
          </label>
          <input
            type="text"
            required
            value={contactInfo.parentLastName}
            onChange={(e) => onChange({ ...contactInfo, parentLastName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Last Name"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number {isPhoneComplete ? <span className="text-green-600">✓</span> : <span className="text-red-600">*</span>}
          </label>
          <input
            type="tel"
            required
            value={formatPhone(contactInfo.phoneNumber)}
            onChange={(e) => onChange({ ...contactInfo, phoneNumber: e.target.value })}
            onBlur={() => setPhoneTouched(true)}
            className={phoneInputClass}
            placeholder="(555) 123-4567"
          />
        </div>
        {(phoneTouched && !phoneValid) && (
          <p className="text-red-600 text-sm md:col-span-2">Please enter a 10 digit phone number.</p>
        )}
        {(emailTouched && !emailValid) && (
          <p className="text-red-600 text-sm md:col-span-2 -mt-2">Please enter a valid email address.</p>
        )}
      </div>
    </div>
  )
}

