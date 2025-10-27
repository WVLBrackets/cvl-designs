'use client'

interface SubmitConfirmationModalProps {
  isOpen: boolean
  message: string
  onGoBack: () => void
  onContinue: () => void
}

export default function SubmitConfirmationModal({
  isOpen,
  message,
  onGoBack,
  onContinue,
}: SubmitConfirmationModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Confirm Order Submission</h2>
          <button
            onClick={onGoBack}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Message */}
        <div className="p-6">
          <p className="text-gray-700 whitespace-pre-line">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onGoBack}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={onContinue}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}

