import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import TextbookUpload from '../components/TextbookUpload';

const TextbookUploadPage: React.FC = () => {
  const [uploadedTextbooks, setUploadedTextbooks] = useState<any[]>([]);

  const handleUploadSuccess = (data: any) => {
    setUploadedTextbooks(prev => [data, ...prev]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Upload Textbooks</h1>
        <p className="mt-2 text-sm text-gray-500">
          Upload textbooks to improve the quality of generated study sheets. The system will extract
          knowledge from these textbooks and use it when generating study materials.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7">
          <TextbookUpload onUploadSuccess={handleUploadSuccess} />
        </div>

        <div className="lg:col-span-5">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900">Recently Uploaded Textbooks</h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                These textbooks are being processed and added to the knowledge base.
              </p>
            </div>
            <div className="border-t border-gray-200">
              {uploadedTextbooks.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {uploadedTextbooks.map((textbook) => (
                    <li key={textbook.id} className="px-4 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">{textbook.title}</h3>
                          <p className="mt-1 text-xs text-gray-500">
                            {textbook.subject} • Grade: {textbook.grade}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            Uploaded: {new Date(textbook.uploaded_at).toLocaleString()}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            Status: <span className="text-green-600">{textbook.status || 'Processing'}</span>
                          </p>
                        </div>
                        <div className="text-xs text-gray-500">
                          {textbook.pages_processed ? `${textbook.pages_processed} pages processed` : 'Processing...'}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-5 sm:p-6 text-center">
                  <p className="text-sm text-gray-500">No textbooks uploaded yet</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-6">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Study Sheet Generator</h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>
                  Generate personalized study sheets using knowledge from uploaded textbooks and external sources.
                </p>
              </div>
              <div className="mt-5">
                <Link
                  to="/generate-study-sheet"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm"
                >
                  Create New Study Sheet
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextbookUploadPage;
