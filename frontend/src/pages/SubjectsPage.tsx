import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';

interface Subject {
  _id: string;
  name: string;
  description: string;
  source: string;
}

interface Topic {
  _id: string;
  name: string;
  description: string;
  subject_id: string;
  difficulty: number;
}

const SubjectsPage: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  // Get selected subject from URL params
  useEffect(() => {
    const selected = searchParams.get('selected');
    if (selected) {
      setSelectedSubject(selected);
    }
  }, [searchParams]);

  // Fetch subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        const response = await axios.get(`${API_URL}/api/subjects`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setSubjects(response.data);
        
        // If a subject was selected from URL or there's only one subject, select it
        if ((searchParams.get('selected') && response.data.some((s: Subject) => s._id === searchParams.get('selected'))) || 
            (!selectedSubject && response.data.length === 1)) {
          const subjectId = searchParams.get('selected') || response.data[0]._id;
          setSelectedSubject(subjectId);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching subjects:', err);
        setError('Failed to load subjects. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchSubjects();
  }, [API_URL, searchParams]);

  // Fetch topics for selected subject
  useEffect(() => {
    const fetchTopics = async () => {
      if (!selectedSubject) return;
      
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        const response = await axios.get(`${API_URL}/api/topics?subject_id=${selectedSubject}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setTopics(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching topics:', err);
        setError('Failed to load topics. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchTopics();
  }, [API_URL, selectedSubject]);

  const handleSubjectSelect = (subjectId: string) => {
    setSelectedSubject(subjectId);
    setSearchParams({ selected: subjectId });
  };

  // Function to get difficulty label and color
  const getDifficultyInfo = (difficulty: number) => {
    if (difficulty <= 3) {
      return { label: 'Beginner', color: 'bg-green-100 text-green-800' };
    } else if (difficulty <= 6) {
      return { label: 'Intermediate', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { label: 'Advanced', color: 'bg-red-100 text-red-800' };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-6">
        <h1 className="text-3xl font-bold text-gray-900">Subjects</h1>
        <p className="mt-1 text-sm text-gray-500">
          Browse subjects and topics to study
        </p>
      </div>
      
      {loading && !subjects.length ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 my-4">
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
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Subjects List */}
          <div className="bg-white shadow rounded-lg p-4 lg:col-span-1">
            <h2 className="text-lg font-medium text-gray-900 mb-4">All Subjects</h2>
            <div className="space-y-2">
              {subjects.length > 0 ? (
                subjects.map((subject) => (
                  <button
                    key={subject._id}
                    onClick={() => handleSubjectSelect(subject._id)}
                    className={`w-full text-left px-4 py-2 rounded-md text-sm transition-colors ${
                      selectedSubject === subject._id
                        ? 'bg-primary-100 text-primary-700 font-medium'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {subject.name}
                  </button>
                ))
              ) : (
                <p className="text-sm text-gray-500 p-4">No subjects available</p>
              )}
            </div>
          </div>

          {/* Topics List */}
          <div className="bg-white shadow rounded-lg p-4 lg:col-span-3">
            {selectedSubject ? (
              <>
                <h2 className="text-lg font-medium text-gray-900 mb-1">
                  {subjects.find(s => s._id === selectedSubject)?.name || 'Topics'}
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  {subjects.find(s => s._id === selectedSubject)?.description || 'Select a topic to study'}
                </p>
                
                {loading && !topics.length ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                  </div>
                ) : topics.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {topics.map((topic) => {
                      const difficultyInfo = getDifficultyInfo(topic.difficulty);
                      return (
                        <Link
                          key={topic._id}
                          to={`/topics/${topic._id}`}
                          className="block bg-gray-50 hover:bg-gray-100 rounded-lg p-4 border border-gray-200"
                        >
                          <div className="flex justify-between items-start">
                            <h3 className="text-md font-medium text-gray-900">{topic.name}</h3>
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${difficultyInfo.color}`}>
                              {difficultyInfo.label}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-gray-500 line-clamp-3">{topic.description}</p>
                          <div className="mt-4 flex items-center">
                            <span className="text-xs font-medium text-primary-600">Study this topic →</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500">No topics available for this subject yet.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-gray-500">Select a subject to view its topics</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectsPage;
