/**
 * Doctor Brief Modal Component
 * Displays a full-screen modal with doctor brief information
 * Used on PatientOverviewPage or AppointmentsPage
 */

import React, { useState } from 'react';
import { X, Download, Printer } from 'lucide-react';
import BriefSections from './BriefSections';

const DoctorBriefModal = ({ brief, isOpen, onClose, onSave }) => {
  const [personalNotes, setPersonalNotes] = useState(brief?.personalNotes || '');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !brief) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave({ ...brief, personalNotes });
      }
      // Show success feedback
      setTimeout(() => setIsSaving(false), 500);
    } catch (error) {
      console.error('Error saving brief:', error);
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // Placeholder for PDF export functionality
    console.log('PDF export not yet implemented - would use react-to-pdf');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-4 md:inset-8 bg-white rounded-lg shadow-xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Doctor Brief</h2>
            <p className="text-sm text-gray-600">
              {brief.patientName} • Appointment: {new Date(brief.appointmentDate).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <BriefSections
            brief={brief}
            onAddNote={setPersonalNotes}
            personalNotes={personalNotes}
          />
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-100 flex items-center gap-2 text-sm"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-100 flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-100 font-medium"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium disabled:bg-gray-400"
            >
              {isSaving ? 'Saving...' : 'Save Notes'}
            </button>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
        }
      `}</style>
    </>
  );
};

export default DoctorBriefModal;
