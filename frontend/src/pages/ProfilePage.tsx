import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const ProfilePage: React.FC = () => {
  const { user, updatePreferences, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Knowledge level slider
  const [knowledgeLevel, setKnowledgeLevel] = useState(
    user?.preferences?.knowledge_level || 5
  );
  
  // Learning preferences
  const [preferExplanations, setPreferExplanations] = useState(
    user?.preferences?.prefer_explanations || 0.6
  );
  const [preferExamples, setPreferExamples] = useState(
    user?.preferences?.prefer_examples || 0.3
  );
  const [preferResources, setPreferResources] = useState(
    user?.preferences?.prefer_resources || 0.1
  );

  const handleSavePreferences = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const updatedPreferences = {
        knowledge_level: knowledgeLevel,
        prefer_explanations: preferExplanations,
        prefer_examples: preferExamples,
        prefer_resources: preferResources,
        prefer_length: user?.preferences?.prefer_length || 0.5
      };
      
      await updatePreferences(updatedPreferences);
      
      setSuccess('Your preferences have been updated successfully!');
      setIsEditing(false);
      setLoading(false);
    } catch (err) {
      console.error('Error updating preferences:', err);
      setError('Failed to update preferences. Please try again later.');
      setLoading(false);
    }
  };

  const getLevelLabel = (level: number) => {
    if (level <= 3) return 'Beginner';
    if (level <= 6) return 'Intermediate';
    return 'Advanced';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-6">
        <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account and learning preferences
        </p>
      </div>
      
      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {success && (
        <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Account Information</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and preferences</p>
          </div>
          <button
            onClick={() => logout()}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Log out
          </button>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Username</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user?.username}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Email address</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user?.email}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Member since</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
      
      <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Learning Preferences</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Customize your learning experience</p>
          </div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Edit preferences
            </button>
          ) : (
            <div className="flex space-x-3">
              <button
                onClick={() => setIsEditing(false)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePreferences}
                disabled={loading}
                className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          )}
        </div>
        <div className="border-t border-gray-200">
          <div className="px-4 py-5 sm:px-6">
            <div className="space-y-6">
              {/* Knowledge Level */}
              <div>
                <h4 className="text-sm font-medium text-gray-900">Knowledge Level</h4>
                <p className="text-sm text-gray-500">Your current level of knowledge</p>
                {isEditing ? (
                  <div className="mt-2">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={knowledgeLevel}
                      onChange={(e) => setKnowledgeLevel(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500">Beginner</span>
                      <span className="text-xs font-medium text-primary-600">
                        {getLevelLabel(knowledgeLevel)} ({knowledgeLevel}/10)
                      </span>
                      <span className="text-xs text-gray-500">Advanced</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-primary-600 h-2.5 rounded-full" 
                        style={{ width: `${(knowledgeLevel / 10) * 100}%` }}
                      ></div>
                    </div>
                    <span className="ml-3 text-sm font-medium text-gray-900">
                      {getLevelLabel(knowledgeLevel)} ({knowledgeLevel}/10)
                    </span>
                  </div>
                )}
              </div>
              
              {/* Content Type Preferences */}
              <div>
                <h4 className="text-sm font-medium text-gray-900">Content Type Preferences</h4>
                <p className="text-sm text-gray-500">What types of learning materials you prefer</p>
                
                {isEditing ? (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label htmlFor="explanations" className="text-xs text-gray-700">
                        Explanations ({Math.round(preferExplanations * 100)}%)
                      </label>
                      <input
                        id="explanations"
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={preferExplanations}
                        onChange={(e) => {
                          const newValue = parseFloat(e.target.value);
                          setPreferExplanations(newValue);
                          // Adjust others to keep total at 1
                          const remaining = 1 - newValue;
                          const ratio = preferExamples / (preferExamples + preferResources);
                          setPreferExamples(remaining * ratio);
                          setPreferResources(remaining * (1 - ratio));
                        }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <div>
                      <label htmlFor="examples" className="text-xs text-gray-700">
                        Examples ({Math.round(preferExamples * 100)}%)
                      </label>
                      <input
                        id="examples"
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={preferExamples}
                        onChange={(e) => {
                          const newValue = parseFloat(e.target.value);
                          setPreferExamples(newValue);
                          // Adjust others to keep total at 1
                          const remaining = 1 - newValue;
                          const ratio = preferExplanations / (preferExplanations + preferResources);
                          setPreferExplanations(remaining * ratio);
                          setPreferResources(remaining * (1 - ratio));
                        }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <div>
                      <label htmlFor="resources" className="text-xs text-gray-700">
                        Resources ({Math.round(preferResources * 100)}%)
                      </label>
                      <input
                        id="resources"
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={preferResources}
                        onChange={(e) => {
                          const newValue = parseFloat(e.target.value);
                          setPreferResources(newValue);
                          // Adjust others to keep total at 1
                          const remaining = 1 - newValue;
                          const ratio = preferExplanations / (preferExplanations + preferExamples);
                          setPreferExplanations(remaining * ratio);
                          setPreferExamples(remaining * (1 - ratio));
                        }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 space-y-2">
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-700">Explanations</span>
                        <span className="text-xs font-medium text-gray-900">{Math.round(preferExplanations * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-primary-600 h-1.5 rounded-full" 
                          style={{ width: `${preferExplanations * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-700">Examples</span>
                        <span className="text-xs font-medium text-gray-900">{Math.round(preferExamples * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-secondary-500 h-1.5 rounded-full" 
                          style={{ width: `${preferExamples * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-700">Resources</span>
                        <span className="text-xs font-medium text-gray-900">{Math.round(preferResources * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-gray-600 h-1.5 rounded-full" 
                          style={{ width: `${preferResources * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
