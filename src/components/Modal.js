import React from 'react';

function Modal({ content, onClose }) {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-center">
        <p className="text-lg font-semibold mb-4">{content}</p>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-300 shadow-md"
        >
          OK
        </button>
      </div>
    </div>
  );
}

export default Modal;