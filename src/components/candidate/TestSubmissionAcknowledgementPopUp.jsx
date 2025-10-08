import React from "react";

function TestSubmissionAcknowledgementPopUp({ isOpen, onClose, onSubmit }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#000000bd] bg-opacity-50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Close button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Content */}
        <div className="mt-2">
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Finish Test?</h3>
          <p className="text-gray-600 text-sm mb-6">Are you sure you want to submit your test? You cannot make any more changes after this.</p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button onClick={onSubmit} className="px-5 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors font-medium">
            Yes, Submit Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default TestSubmissionAcknowledgementPopUp;
