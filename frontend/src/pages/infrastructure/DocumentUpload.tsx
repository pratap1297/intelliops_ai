import React, { useState } from 'react';
import { Upload, FileType, AlertCircle, X, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { analyzeInfrastructureDocument } from '../../lib/services';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/Header';

export function DocumentUpload() {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    validateAndSetFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    validateAndSetFile(file);
  };

  const validateAndSetFile = (file?: File) => {
    if (!file) return;

    const validTypes = ['.pdf', '.png', '.docx', '.xlsx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!validTypes.includes(fileExtension)) {
      toast.error('Invalid file type. Please upload PDF, PNG, DOCX, or XLSX files.');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    try {
      // Call LLM service to analyze the document
      const analysis = await analyzeInfrastructureDocument(selectedFile);
      
      // Store the analysis results in localStorage for the plan editor
      localStorage.setItem('infrastructure_analysis', JSON.stringify(analysis));
      
      toast.success('Document processed successfully');
      navigate('/infrastructure/plan');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to process document');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header 
        subtitle="Upload your infrastructure diagram or specification document"
      />
      
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">
              Upload Infrastructure Document
            </h1>

            {/* File Upload Area */}
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                className="hidden"
                accept=".pdf,.png,.docx,.xlsx"
                onChange={handleFileSelect}
                id="file-upload"
              />

              <label
                htmlFor="file-upload"
                className="cursor-pointer"
              >
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Upload className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      Drop your file here, or <span className="text-blue-600">browse</span>
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Supports PDF, PNG, DOCX, and XLSX files
                    </p>
                  </div>
                </div>
              </label>
            </div>

            {/* Selected File Preview */}
            {selectedFile && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileType className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-900">{selectedFile.name}</span>
                    <span className="text-sm text-gray-500">
                      ({Math.round(selectedFile.size / 1024)} KB)
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="p-1 hover:bg-gray-200 rounded-full"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
            )}

            {/* Upload Button */}
            <div className="mt-6">
              <button
                onClick={handleUpload}
                disabled={!selectedFile || isProcessing}
                className={`w-full py-3 px-4 rounded-lg text-white font-medium ${
                  !selectedFile || isProcessing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isProcessing ? 'Processing...' : 'Upload and Process'}
              </button>
            </div>

            {/* Instructions */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900">Instructions</h3>
                  <ul className="mt-2 text-sm text-blue-800 space-y-1">
                    <li>• Upload your infrastructure diagram (PNG/PDF)</li>
                    <li>• Or upload your infrastructure specifications (DOCX/XLSX)</li>
                    <li>• Maximum file size: 10MB</li>
                    <li>• The file will be processed to generate an infrastructure plan</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}