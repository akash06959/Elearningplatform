import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const ModuleForm = ({ initialData, courseId, onSuccess }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [order, setOrder] = useState(initialData?.order || 1);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfFileName, setPdfFileName] = useState('');
  const [hasPdf, setHasPdf] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Module title is required');
      return;
    }
    
    const moduleData = {
      title,
      description,
      order,
      video_url // Include other module fields
    };
    
    try {
      let moduleId;
      
      if (initialData?.id) {
        // Update existing module
        await api.put(`/api/courses/modules/${initialData.id}/`, moduleData);
        moduleId = initialData.id;
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        // Create new module
        const response = await api.post(`/api/courses/modules/`, {
          ...moduleData,
          course_id: courseId
        });
        moduleId = response.data.id;
        
        if (onSuccess) {
          onSuccess(response.data);
        }
      }
      
      // Handle PDF upload separately if a file is selected
      if (pdfFile) {
        const formData = new FormData();
        formData.append('pdf_file', pdfFile);
        
        await api.post(`/api/courses/modules/${moduleId}/upload-pdf/`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        toast.success(`Module ${initialData?.id ? 'updated' : 'created'} with PDF successfully!`);
      } else {
        toast.success(`Module ${initialData?.id ? 'updated' : 'created'} successfully!`);
      }
      
      // Reset form
      setTitle('');
      setDescription('');
      setOrder(1);
      setPdfFile(null);
      setPdfFileName('');
      setHasPdf(false);
      
    } catch (error) {
      console.error('Error saving module:', error);
      toast.error('Failed to save module');
    }
  };

  const handlePdfFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please select a PDF file');
        return;
      }
      
      setPdfFile(file);
      setPdfFileName(file.name);
      setHasPdf(true);
    }
  };

  const removePdf = () => {
    setPdfFile(null);
    setPdfFileName('');
    setHasPdf(false);
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        PDF Document (Optional)
      </label>
      
      {hasPdf ? (
        <div className="flex items-center p-2 bg-gray-50 border rounded">
          <div className="flex-1 truncate">
            <span className="text-sm font-medium">{pdfFileName}</span>
          </div>
          <button 
            type="button" 
            onClick={removePdf}
            className="ml-2 text-red-600 hover:text-red-800"
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
          <div className="space-y-1 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4h-12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="flex text-sm text-gray-600">
              <label htmlFor="pdf-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                <span>Upload a PDF file</span>
                <input 
                  id="pdf-upload" 
                  name="pdf-upload" 
                  type="file" 
                  className="sr-only"
                  accept="application/pdf"
                  onChange={handlePdfFileChange}
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">PDF up to 10MB</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModuleForm; 