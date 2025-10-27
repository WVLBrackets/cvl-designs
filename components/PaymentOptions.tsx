/**
 * Payment Options Component
 * Displays payment methods with QR codes and config-driven messages
 */

'use client'

import Image from 'next/image'

interface PaymentOptionsProps {
  paymentMessage: string
  venmoMessage: string
  zelleMessage: string
  cashAppMessage: string
  paymentQuestions: string
  invoiceAmount: number
  contactMeEmail?: string
  contactMePhone?: string
}

export default function PaymentOptions({
  paymentMessage,
  venmoMessage,
  zelleMessage,
  cashAppMessage,
  paymentQuestions,
  invoiceAmount,
  contactMeEmail,
  contactMePhone,
}: PaymentOptionsProps) {
  // Replace {Invoice Amount} placeholder with actual amount
  const formattedPaymentMessage = paymentMessage.replace(
    '{Invoice Amount}',
    `$${invoiceAmount.toFixed(2)}`
  )
  
  // Replace placeholders in payment questions
  // We'll handle email as JSX with a link, so we need to parse the text
  const questionsParts = paymentQuestions.split('{ContactMeEmail}')
  const hasEmailPlaceholder = questionsParts.length > 1
  
  // Replace phone placeholder in text
  let formattedQuestions = paymentQuestions
  if (contactMePhone) {
    formattedQuestions = formattedQuestions.replace('{ContactMePhone}', contactMePhone)
  }
  
  return (
    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg shadow-lg p-8">
      <p className="text-center text-lg text-gray-700 mb-6 font-semibold">
        {formattedPaymentMessage}
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Venmo */}
        <div className="bg-white rounded-lg p-6 text-center shadow-md">
          <div className="w-40 h-40 mx-auto mb-4 relative">
            <Image
              src="/images/brand/Venmo.jpg"
              alt="Venmo QR Code"
              fill
              className="object-contain"
              sizes="160px"
            />
          </div>
          <h3 className="font-bold text-lg text-gray-900 mb-2">Venmo</h3>
          <p className="text-sm text-gray-600 whitespace-pre-line">{venmoMessage}</p>
        </div>
        
        {/* Zelle */}
        <div className="bg-white rounded-lg p-6 text-center shadow-md">
          <div className="w-40 h-40 mx-auto mb-4 relative">
            <Image
              src="/images/brand/Zelle.jpg"
              alt="Zelle QR Code"
              fill
              className="object-contain"
              sizes="160px"
            />
          </div>
          <h3 className="font-bold text-lg text-gray-900 mb-2">Zelle</h3>
          <p className="text-sm text-gray-600 whitespace-pre-line">{zelleMessage}</p>
        </div>
        
        {/* CashApp */}
        <div className="bg-white rounded-lg p-6 text-center shadow-md">
          <div className="w-40 h-40 mx-auto mb-4 relative">
            <Image
              src="/images/brand/Cash App.jpg"
              alt="Cash App QR Code"
              fill
              className="object-contain"
              sizes="160px"
            />
          </div>
          <h3 className="font-bold text-lg text-gray-900 mb-2">Cash App</h3>
          <p className="text-sm text-gray-600 whitespace-pre-line">{cashAppMessage}</p>
        </div>
      </div>
      
      <div className="mt-6 text-center text-sm text-gray-600">
        {hasEmailPlaceholder && contactMeEmail ? (
          <p className="whitespace-pre-line">
            {questionsParts[0].replace('{ContactMePhone}', contactMePhone || '{ContactMePhone}')}
            <a 
              href={`mailto:${contactMeEmail}`}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              {contactMeEmail}
            </a>
            {questionsParts[1]?.replace('{ContactMePhone}', contactMePhone || '{ContactMePhone}')}
          </p>
        ) : (
          <p className="whitespace-pre-line">{formattedQuestions}</p>
        )}
      </div>
    </div>
  )
}

