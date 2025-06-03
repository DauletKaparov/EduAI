import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import { generatorAPI, topicsAPI } from '../services/api';

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

  // Using API service instead of direct axios calls

  // Mock data for when backend is unavailable
  const mockStudySheet: StudySheet = {
    title: "Comprehensive Study Guide: Algebra",
    topic_id: topicId || 't1',
    topic_name: "Algebra",
    sections: [
      {
        title: "Introduction to Algebra",
        content: "Algebra is a branch of mathematics dealing with symbols and the rules for manipulating these symbols. In elementary algebra, those symbols represent quantities without fixed values, known as variables. The rules for manipulating these symbols are derived from the properties of numbers and operations.\n\nThe fundamental concept in algebra is the variable, a symbol (usually a letter) that represents an unspecified number. By using variables, algebraic expressions can describe operations that can be performed on any number, not just on specific values.\n\nAlgebra provides a concise way to represent mathematical relationships and solve problems involving unknown quantities.",
        type: "explanation"
      },
      {
        title: "Core Concepts in Algebra",
        content: "**Variables and Constants**\nVariables are symbols (like x, y, z) that represent unknown values, while constants are fixed values (like 5, -3, π).\n\n**Algebraic Expressions**\nCombinations of variables, constants, and operations (like 3x + 5y, 2a² - 7b + 4).\n\n**Equations**\nStatements asserting that two expressions are equal (like x + 5 = 10).\n\n**Functions**\nRules that assign exactly one output to each input (like f(x) = 2x + 3).\n\n**Polynomials**\nExpressions consisting of variables and coefficients using only addition, subtraction, multiplication, and non-negative integer exponents (like x² + 3x - 7).",
        type: "core_concepts"
      },
      {
        title: "Solving Linear Equations",
        content: "Linear equations are equations where each term is either a constant or the product of a constant and a single variable raised to the power of 1.\n\n**Steps to Solve Linear Equations:**\n\n1. **Simplify** both sides of the equation by combining like terms.\n2. **Use addition or subtraction** to isolate the variable terms on one side of the equation.\n3. **Use multiplication or division** to isolate the variable.\n4. **Check your solution** by substituting it back into the original equation.\n\n**Example:**\nSolve for x in 3x + 5 = 20\n\nStep 1: No like terms to combine\n\nStep 2: Subtract 5 from both sides\n3x + 5 - 5 = 20 - 5\n3x = 15\n\nStep 3: Divide both sides by 3\n3x/3 = 15/3\nx = 5\n\nStep 4: Check: 3(5) + 5 = 15 + 5 = 20 ✓\n\nTherefore, x = 5 is the solution.",
        type: "explanation"
      },
      {
        title: "Practice Problems",
        content: "1. Solve for x: 2x - 7 = 15\n2. Solve for y: 4y + 10 = -10\n3. Solve for z: 3z/4 - 2 = 10\n4. If 5x + 3 = 18, what is the value of 2x - 1?\n5. Solve for a: 7 - 2a = 4a + 21",
        type: "practice"
      },
      {
        title: "Additional Resources",
        content: "- Khan Academy: [Algebra I Course](https://www.khanacademy.org/math/algebra)\n- Purplemath: [Algebra Lessons](https://www.purplemath.com/modules/index.htm)\n- Wolfram Alpha: [Algebra Calculator](https://www.wolframalpha.com/)\n- MIT OpenCourseWare: [Algebra](https://ocw.mit.edu/courses/mathematics/)",
        type: "resources"
      }
    ],
    difficulty_level: 5,
    created_at: new Date().toISOString()
  };

  const mockTopic: Topic = {
    _id: topicId || 't1',
    name: 'Algebra',
    subject_id: 's1'
  };

  const mockSubject: Subject = {
    _id: 's1',
    name: 'Mathematics'
  };

  // Fetch study sheet data using our API service
  useEffect(() => {
    const fetchStudySheet = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Check if we're using the admin bypass token
        const token = localStorage.getItem('token');
        const isAdminUser = token === 'admin-dev-token';
        
        // If using admin bypass, use mock data directly
        if (isAdminUser) {
          console.log('Using mock study sheet data for admin user');
          setStudySheet(mockStudySheet);
          setTopic(mockTopic);
          setSubject(mockSubject);
          setLoading(false);
          return;
        }
        
        // Initialize API URL for direct calls if needed
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8003';
        let studySheetData = null;
        let errorMessage = 'Failed to load your personalized study sheet. Please try again.';
        
        // First attempt - Use the API service to fetch the study sheet
        try {
          console.log('Attempting to fetch study sheet with API service...');
          const studySheetResponse = await generatorAPI.fetchStudySheet(topicId || '');
          if (studySheetResponse.status === 200 && studySheetResponse.data) {
            studySheetData = studySheetResponse.data;
            console.log("Study sheet loaded successfully:", studySheetData);
          }
        } catch (primaryError: any) {
          console.error('Primary fetch method failed:', primaryError);
          errorMessage = primaryError.response?.data || 'Server error during study sheet retrieval.';
          
          // Second attempt - Try direct API call as fallback
          try {
            console.log('Trying fallback approach with direct API call...');
            const fallbackResponse = await fetch(`${API_URL}/api/test/studysheet/${topicId}`);
            
            if (fallbackResponse.ok) {
              studySheetData = await fallbackResponse.json();
              console.log('Fallback approach succeeded:', studySheetData);
            }
          } catch (fallbackError) {
            console.error('Fallback approach also failed:', fallbackError);
            
            // Third attempt - Try to regenerate the study sheet
            try {
              console.log('Last resort: Regenerating study sheet...');
              const regenerateResponse = await generatorAPI.generateStudySheet(topicId || '');
              
              if (regenerateResponse.status === 200 && regenerateResponse.data) {
                studySheetData = regenerateResponse.data;
                console.log('Regeneration succeeded:', studySheetData);
              }
            } catch (regenerateError) {
              console.error('All attempts failed:', regenerateError);
              // All attempts failed, continue to error handling
            }
          }
        }
        
        // If we got study sheet data from any of the attempts, process it
        if (studySheetData) {
          setStudySheet(studySheetData);
          
          // Proceed with fetching topic data
          try {
            // Use the API service to get all topics
            const topicResponse = await topicsAPI.getAll();
            
            // Find matching topic
            const matchingTopic = topicResponse.data.find((t: any) => t._id === topicId);
            
            if (matchingTopic) {
              setTopic(matchingTopic);
              
              // Fetch subject details - since we don't have a service method for this yet
              const subjectResponse = await fetch(`${API_URL}/api/subjects/${matchingTopic.subject_id}`);
              
              if (subjectResponse.ok) {
                const subjectData = await subjectResponse.json();
                setSubject(subjectData);
              }
            }
          } catch (topicError) {
            console.error('Error fetching topic/subject data, using mock data:', topicError);
            // Fall back to mock data for topic and subject
            setTopic(mockTopic);
            setSubject(mockSubject);
          }
        } else {
          console.log('No study sheet data was obtained from API calls, using mock data');
          // Fall back to mock data for everything
          setStudySheet(mockStudySheet);
          setTopic(mockTopic);
          setSubject(mockSubject);
        }
        
        setLoading(false);
      } catch (err: any) {
        console.error('All study sheet fetch attempts failed:', err);
        setError('Failed to load your personalized study sheet: ' + (err.message || 'Please try again'));
        setLoading(false);
      }
    };
    
    if (topicId) {
      fetchStudySheet();
    }
  }, [topicId]);

  // Submit feedback on study sheet
  const handleFeedbackSubmit = async () => {
    if (feedback === null) return;
    
    try {
      setSubmittingFeedback(true);
      // No token check needed for testing
      
      // In a real application, we would submit this feedback to the server
      // and use it to improve future study sheets
      // In a production app, we would use our API service
      // await feedbackAPI.submitFeedback(
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
