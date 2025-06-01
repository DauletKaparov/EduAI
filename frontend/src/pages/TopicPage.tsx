import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

interface Topic {
  _id: string;
  name: string;
  description: string;
  subject_id: string;
  difficulty: number;
  prerequisites: string[];
}

interface Content {
  _id: string;
  topic_id: string;
  type: string;
  title: string;
  body: string;
  source: string;
  difficulty: number;
}

interface Subject {
  _id: string;
  name: string;
}

const TopicPage: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [topic, setTopic] = useState<Topic | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generatingStudySheet, setGeneratingStudySheet] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const fetchTopicData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        // Fetch topic details
        const topicResponse = await axios.get(`${API_URL}/api/topics/${topicId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setTopic(topicResponse.data);
        
        // Fetch subject details
        const subjectResponse = await axios.get(
          `${API_URL}/api/subjects/${topicResponse.data.subject_id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setSubject(subjectResponse.data);
        
        // Fetch content for this topic
        const contentResponse = await axios.get(
          `${API_URL}/api/contents?topic_id=${topicId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setContents(contentResponse.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching topic data:', err);
        setError('Failed to load topic data. Please try again later.');
        setLoading(false);
      }
    };
    
    if (topicId) {
      fetchTopicData();
    }
  }, [API_URL, topicId]);

  const handleGenerateStudySheet = async () => {
    try {
      setGeneratingStudySheet(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Generate a study sheet
      await axios.post(
        `${API_URL}/api/generate/studysheet`,
        { topic_id: topicId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Navigate to the study sheet page
      navigate(`/study-sheet/${topicId}`);
    } catch (err) {
      console.error('Error generating study sheet:', err);
      setError('Failed to generate study sheet. Please try again later.');
      setGeneratingStudySheet(false);
    }
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

  // Group content by type
  const explanations = contents.filter(c => c.type === 'explanation');
  const examples = contents.filter(c => c.type === 'example');
  const resources = contents.filter(c => c.type === 'resource');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {loading ? (
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
        <>
          {/* Topic Header */}
          <div className="py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center">
                  {subject && (
                    <Link to={`/subjects?selected=${subject._id}`} className="text-sm text-primary-600 hover:text-primary-700">
                      {subject.name}
                    </Link>
                  )}
                  <span className="mx-2 text-gray-500">/</span>
                  <h1 className="text-2xl font-bold text-gray-900">{topic?.name}</h1>
                </div>
                <p className="mt-1 text-sm text-gray-500">{topic?.description}</p>
              </div>
              <div className="mt-4 md:mt-0 flex space-x-3">
                <button
                  onClick={handleGenerateStudySheet}
                  disabled={generatingStudySheet}
                  className={`flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                    generatingStudySheet ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {generatingStudySheet ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    'Generate Study Sheet'
                  )}
                </button>
              </div>
            </div>
            
            {topic && (
              <div className="mt-4">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getDifficultyInfo(topic.difficulty).color}`}>
                  {getDifficultyInfo(topic.difficulty).label} Level
                </span>
              </div>
            )}
          </div>

          {/* Content Sections */}
          <div className="mt-6 grid grid-cols-1 gap-6">
            {/* Explanations */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Explanations</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">Core concepts and knowledge</p>
                </div>
              </div>
              <div className="border-t border-gray-200">
                {explanations.length > 0 ? (
                  <div className="px-4 py-5 sm:px-6 space-y-6">
                    {explanations.map((explanation) => (
                      <div key={explanation._id} className="prose max-w-none">
                        <h4 className="text-lg font-medium text-gray-900">{explanation.title}</h4>
                        <div className="mt-2 text-sm text-gray-700 whitespace-pre-line">
                          {explanation.body}
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          Source: {explanation.source}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-5 sm:px-6 text-center">
                    <p className="text-sm text-gray-500">No explanations available for this topic yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Examples */}
            {examples.length > 0 && (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Examples</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">Practical examples to reinforce learning</p>
                </div>
                <div className="border-t border-gray-200">
                  <div className="px-4 py-5 sm:px-6 space-y-6">
                    {examples.map((example) => (
                      <div key={example._id} className="prose max-w-none">
                        <h4 className="text-lg font-medium text-gray-900">{example.title}</h4>
                        <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-4 rounded-md whitespace-pre-line">
                          {example.body}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Resources */}
            {resources.length > 0 && (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Additional Resources</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">Further reading and learning materials</p>
                </div>
                <div className="border-t border-gray-200">
                  <div className="px-4 py-5 sm:px-6">
                    <ul className="space-y-4">
                      {resources.map((resource) => (
                        <li key={resource._id} className="text-sm">
                          <h4 className="font-medium text-gray-900">{resource.title}</h4>
                          <p className="mt-1 text-gray-700">{resource.body}</p>
                          <p className="mt-1 text-xs text-primary-600">{resource.source}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Generate Study Sheet CTA */}
            <div className="bg-primary-50 shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Generate a Personalized Study Sheet</h3>
                <div className="mt-2 max-w-xl text-sm text-gray-500">
                  <p>
                    Our AI will create a personalized study sheet for you based on your knowledge level and learning preferences.
                  </p>
                </div>
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={handleGenerateStudySheet}
                    disabled={generatingStudySheet}
                    className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm ${
                      generatingStudySheet ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {generatingStudySheet ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Your Study Sheet...
                      </>
                    ) : (
                      'Create My Study Sheet'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TopicPage;
