import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

interface StudySheet {
  title: string;
  topic_id: string;
  topic_name: string;
  sections: Array<{
    title: string;
    content: string;
    type: string;
  }>;
  difficulty_level: number;
  created_at: string;
}

interface Topic {
  _id: string;
  name: string;
  subject_id: string;
}

interface Subject {
  _id: string;
  name: string;
}

const StudySheetPage: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [studySheet, setStudySheet] = useState<StudySheet | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<number | null>(null);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8003';

  // Fetch study sheet data - MODIFIED TO USE TEST ENDPOINTS WITHOUT AUTHENTICATION
  useEffect(() => {
    const fetchStudySheet = async () => {
      try {
        setLoading(true);
        
        // Use the test endpoint that doesn't require authentication
        const studySheetResponse = await axios.get(
          `${API_URL}/api/test/studysheet/${topicId}?knowledge_level=5.0`
        );
        
        setStudySheet(studySheetResponse.data);
        console.log("Study sheet loaded:", studySheetResponse.data);
        
        // Use the test topics endpoint to get all topics
        const topicsResponse = await axios.get(`${API_URL}/api/test/topics`);
        
        // Find the current topic in the list
        const currentTopic = topicsResponse.data.find((t: any) => t._id === topicId);
        if (currentTopic) {
          setTopic(currentTopic);
          
          // Since we don't have a test endpoint for subjects, we'll just create a mock subject
          setSubject({
            _id: currentTopic.subject_id || "mock-subject-id",
            name: currentTopic.subject_name || "Computer Science"
          });
        }
        
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching study sheet:', err);
        setError('Failed to load your personalized study sheet: ' + (err.message || 'Please try again'));
        setLoading(false);
      }
    };
    
    if (topicId) {
      fetchStudySheet();
    }
  }, [API_URL, topicId]);

  // Submit feedback on study sheet
  const handleFeedbackSubmit = async () => {
    if (feedback === null) return;
    
    try {
      setSubmittingFeedback(true);
      // No token check needed for testing
      
      // In a real application, we would submit this feedback to the server
      // and use it to improve future study sheets
      // await axios.post(
      //   `${API_URL}/api/feedback`,
      //   { 
      //     topic_id: topicId,
      //     rating: feedback,
      //     content_type: 'study_sheet'
      //   },
      //   { headers: { Authorization: `Bearer ${token}` } }
      // );
      
      // For this MVP, we'll just simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setFeedbackSubmitted(true);
      setSubmittingFeedback(false);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Failed to submit your feedback. Please try again later.');
      setSubmittingFeedback(false);
    }
  };

  // Generate practice questions
  const handleGenerateQuestions = async () => {
    try {
      // No token check needed for testing
      
      // In a real application, this would navigate to a practice questions page
      // navigate(`/practice/${topicId}`);
      
      // For this MVP, we'll show an alert
      alert('Practice questions feature will be available in the next update!');
    } catch (err) {
      console.error('Error generating questions:', err);
      setError('Failed to generate practice questions. Please try again later.');
    }
  };

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
          {/* Study Sheet Header */}
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
                  {topic && (
                    <Link to={`/topics/${topic._id}`} className="text-sm text-primary-600 hover:text-primary-700">
                      {topic.name}
                    </Link>
                  )}
                  <span className="mx-2 text-gray-500">/</span>
                  <h1 className="text-2xl font-bold text-gray-900">Study Sheet</h1>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Personalized for {user?.username} • {new Date(studySheet?.created_at || '').toLocaleDateString()}
                </p>
              </div>
              <div className="mt-4 md:mt-0">
                <button
                  onClick={handleGenerateQuestions}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Practice Questions
                </button>
              </div>
            </div>
          </div>

          {/* Study Sheet Content */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-xl font-bold text-gray-900">{studySheet?.title || 'Personalized Study Sheet'}</h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Difficulty Level: {studySheet?.difficulty_level || 5}/10
              </p>
            </div>
            <div className="border-t border-gray-200">
              <div className="px-4 py-5 sm:px-6">
                <div className="study-sheet prose max-w-none">
                  {studySheet?.sections.map((section, index) => (
                    <div key={index} className="mb-8">
                      <h3 className="text-lg font-medium text-gray-900">{section.title}</h3>
                      <div className={`mt-2 ${section.type === 'example' ? 'bg-gray-50 p-4 rounded-md' : ''}`}>
                        <ReactMarkdown>{section.content}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Feedback Section */}
          <div className="bg-gray-50 shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Feedback</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Help us improve your personalized study materials
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              {feedbackSubmitted ? (
                <div className="text-center py-4">
                  <div className="flex justify-center">
                    <svg className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Thank you for your feedback!</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Your input helps us improve our AI-generated content.
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-center">
                    <p className="text-sm text-gray-700 mb-4">How helpful was this study sheet?</p>
                    <div className="flex justify-center space-x-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => setFeedback(rating)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            feedback === rating
                              ? 'bg-primary-600 text-white'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {rating}
                        </button>
                      ))}
                    </div>
                    <div className="mt-6">
                      <button
                        type="button"
                        onClick={handleFeedbackSubmit}
                        disabled={feedback === null || submittingFeedback}
                        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                          feedback === null || submittingFeedback ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {submittingFeedback ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Submitting...
                          </>
                        ) : (
                          'Submit Feedback'
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Next Steps</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Continue your learning journey
              </p>
            </div>
            <div className="border-t border-gray-200">
              <div className="px-4 py-5 sm:px-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <button onClick={handleGenerateQuestions} className="focus:outline-none">
                        <span className="absolute inset-0" aria-hidden="true" />
                        <p className="text-sm font-medium text-gray-900 text-left">Practice Questions</p>
                        <p className="text-sm text-gray-500 truncate text-left">Test your knowledge with practice questions</p>
                      </button>
                    </div>
                  </div>

                  <div className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to="/subjects">
                        <span className="absolute inset-0" aria-hidden="true" />
                        <p className="text-sm font-medium text-gray-900 text-left">Explore More Topics</p>
                        <p className="text-sm text-gray-500 truncate text-left">Discover other related subjects and topics</p>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StudySheetPage;
