import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { generatorAPI } from '../services/api';

interface EducationSystem {
  id: string;
  name: string;
  description: string;
}

interface Grade {
  id: string;
  name: string;
  education_system_id: string;
}

interface Subject {
  _id: string;
  name: string;
  description?: string;
}

interface Topic {
  _id: string;
  name: string;
  description?: string;
  subject_id: string;
}

const GenerateStudySheetPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [educationSystem, setEducationSystem] = useState('');
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [knowledgeLevel, setKnowledgeLevel] = useState(5);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [useTextbooks, setUseTextbooks] = useState(true);
  
  // Data for selection
  const [educationSystems, setEducationSystems] = useState<EducationSystem[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [filteredTopics, setFilteredTopics] = useState<Topic[]>([]);
  const [generatingSheet, setGeneratingSheet] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8003';

  // Mock data for when backend is unavailable
  const mockEducationSystems: EducationSystem[] = [
    {
      id: 'es1',
      name: 'K-12 (US)',
      description: 'United States K-12 education system'
    },
    {
      id: 'es2',
      name: 'IB (International Baccalaureate)',
      description: 'International education foundation'
    },
    {
      id: 'es3',
      name: 'UK National Curriculum',
      description: 'United Kingdom education system'
    },
    {
      id: 'es4',
      name: 'Other / Generic',
      description: 'General educational content not specific to a system'
    }
  ];

  const mockGrades: Grade[] = [
    { id: 'g1', name: 'Elementary (Grades 1-5)', education_system_id: 'es1' },
    { id: 'g2', name: 'Middle School (Grades 6-8)', education_system_id: 'es1' },
    { id: 'g3', name: 'High School (Grades 9-12)', education_system_id: 'es1' },
    { id: 'g4', name: 'PYP (Primary Years)', education_system_id: 'es2' },
    { id: 'g5', name: 'MYP (Middle Years)', education_system_id: 'es2' },
    { id: 'g6', name: 'DP (Diploma Programme)', education_system_id: 'es2' },
    { id: 'g7', name: 'Key Stage 1-2 (Primary)', education_system_id: 'es3' },
    { id: 'g8', name: 'Key Stage 3-4 (Secondary)', education_system_id: 'es3' },
    { id: 'g9', name: 'A-Levels', education_system_id: 'es3' },
    { id: 'g10', name: 'Beginner', education_system_id: 'es4' },
    { id: 'g11', name: 'Intermediate', education_system_id: 'es4' },
    { id: 'g12', name: 'Advanced', education_system_id: 'es4' }
  ];

  const mockSubjects = [
    {
      _id: 's1',
      name: 'Mathematics',
      description: 'Study of numbers, quantities, and shapes'
    },
    {
      _id: 's2',
      name: 'Physics',
      description: 'Science of matter, energy, and their interactions'
    },
    {
      _id: 's3',
      name: 'Computer Science',
      description: 'Study of computation, automation, and information'
    },
    {
      _id: 's4',
      name: 'Biology',
      description: 'Study of living organisms and their interactions'
    },
    {
      _id: 's5',
      name: 'Chemistry',
      description: 'Study of substances, their properties, structure, and reactions'
    },
    {
      _id: 's6',
      name: 'History',
      description: 'Study of past events and human affairs'
    },
    {
      _id: 's7',
      name: 'Literature',
      description: 'Study of written works with artistic merit'
    }
  ];

  const mockTopics = [
    {
      _id: 't1',
      name: 'Algebra',
      description: 'Branch of mathematics dealing with symbols',
      subject_id: 's1',
    },
    {
      _id: 't2',
      name: 'Calculus',
      description: 'Study of continuous change and functions',
      subject_id: 's1',
    },
    {
      _id: 't3',
      name: 'Geometry',
      description: 'Study of shapes, sizes, and properties of space',
      subject_id: 's1',
    },
    {
      _id: 't4',
      name: 'Quantum Mechanics',
      description: 'Theory describing nature at the atomic scale',
      subject_id: 's2',
    },
    {
      _id: 't5',
      name: 'Mechanics',
      description: 'Study of motion and forces',
      subject_id: 's2',
    },
    {
      _id: 't6',
      name: 'Data Structures',
      description: 'Methods of organizing data for efficient access',
      subject_id: 's3',
    },
    {
      _id: 't7',
      name: 'Algorithms',
      description: 'Step-by-step procedures for calculations and problem-solving',
      subject_id: 's3',
    },
    {
      _id: 't8',
      name: 'Genetics',
      description: 'Study of genes, heredity, and genetic variation',
      subject_id: 's4',
    },
    {
      _id: 't9',
      name: 'Organic Chemistry',
      description: 'Study of carbon compounds and their reactions',
      subject_id: 's5',
    },
    {
      _id: 't10',
      name: 'World War II',
      description: 'Global war from 1939 to 1945',
      subject_id: 's6',
    },
    {
      _id: 't11',
      name: 'Shakespeare',
      description: 'Works of William Shakespeare',
      subject_id: 's7',
    }
  ];

  // Load education systems and subjects
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError('');

      try {
        // Check if we're using admin user
        const token = localStorage.getItem('token');
        const isAdminUser = token === 'admin-dev-token';

        if (isAdminUser) {
          setEducationSystems(mockEducationSystems);
          setSubjects(mockSubjects);
          setTopics(mockTopics);
          setLoading(false);
          return;
        }

        // Try to fetch real data
        try {
          // Fetch education systems
          const educationSystemsResponse = await axios.get(`${API_URL}/api/education-systems`);
          setEducationSystems(educationSystemsResponse.data);

          // Fetch subjects
          const subjectsResponse = await axios.get(`${API_URL}/api/test/subjects`);
          setSubjects(subjectsResponse.data);

          // Fetch topics
          const topicsResponse = await axios.get(`${API_URL}/api/test/topics`);
          setTopics(topicsResponse.data);
        } catch (apiError) {
          console.error('API calls failed, using mock data:', apiError);
          // Fall back to mock data
          setEducationSystems(mockEducationSystems);
          setSubjects(mockSubjects);
          setTopics(mockTopics);
        }
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to load necessary data. Using default options.');
        // Use mock data as fallback
        setEducationSystems(mockEducationSystems);
        setSubjects(mockSubjects);
        setTopics(mockTopics);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [API_URL]);

  // Filter grades based on selected education system
  useEffect(() => {
    if (educationSystem) {
      const filteredGrades = mockGrades.filter(g => g.education_system_id === educationSystem);
      setGrades(filteredGrades);
    } else {
      setGrades([]);
    }
  }, [educationSystem]);

  // Filter topics based on selected subject
  useEffect(() => {
    if (subject) {
      const filtered = topics.filter(t => t.subject_id === subject);
      setFilteredTopics(filtered);
    } else {
      setFilteredTopics([]);
    }
  }, [subject, topics]);

  const handleNextStep = () => {
    setStep(prevStep => prevStep + 1);
  };

  const handlePrevStep = () => {
    setStep(prevStep => prevStep - 1);
  };

  const validateCurrentStep = (): boolean => {
    setError('');

    switch (step) {
      case 1:
        if (!educationSystem) {
          setError('Please select an education system');
          return false;
        }
        if (!grade) {
          setError('Please select a grade level');
          return false;
        }
        break;
      case 2:
        if (!subject) {
          setError('Please select a subject');
          return false;
        }
        if (!topic) {
          setError('Please select a topic');
          return false;
        }
        break;
      default:
        break;
    }

    return true;
  };

  const handleStepAction = () => {
    if (!validateCurrentStep()) return;

    if (step < 3) {
      handleNextStep();
    } else {
      handleGenerateStudySheet();
    }
  };

  const handleGenerateStudySheet = async () => {
    setGeneratingSheet(true);
    setError('');

    try {
      // Check if we're using admin user with mock data
      const token = localStorage.getItem('token');
      const isAdminUser = token === 'admin-dev-token';
      const isMockTopic = topic.startsWith('t');

      if (isAdminUser && isMockTopic) {
        console.log('Using mock study sheet generation for admin user');
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        // Navigate to the generated study sheet
        navigate(`/study-sheet/${topic}`);
        return;
      }

      // Prepare generation parameters
      const generationParams = {
        topic_id: topic,
        knowledge_level: knowledgeLevel,
        education_system: educationSystems.find(es => es.id === educationSystem)?.name || '',
        grade: grades.find(g => g.id === grade)?.name || '',
        additional_info: additionalInfo,
        use_textbooks: useTextbooks
      };

      console.log('Generating study sheet with params:', generationParams);

      // First, try enhanced generation with all parameters
      try {
        const response = await axios.post(
          `${API_URL}/api/generate/enhanced-study-sheet`, 
          generationParams,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.status === 200 && response.data) {
          navigate(`/study-sheet/${topic}`);
          return;
        }
      } catch (enhancedError) {
        console.error('Enhanced generation failed:', enhancedError);
        
        // Fall back to standard generation
        try {
          const fallbackResponse = await generatorAPI.generateStudySheet(topic);
          
          if (fallbackResponse.status === 200 && fallbackResponse.data) {
            navigate(`/study-sheet/${topic}`);
            return;
          }
        } catch (fallbackError) {
          console.error('Fallback generation also failed:', fallbackError);
          throw new Error('All generation methods failed');
        }
      }
    } catch (err) {
      console.error('Study sheet generation error:', err);
      setError('Failed to generate study sheet. Please try again.');
      
      // If using admin, force navigation anyway
      if (localStorage.getItem('token') === 'admin-dev-token') {
        console.log('Forcing navigation for admin user despite errors');
        setTimeout(() => {
          navigate(`/study-sheet/${topic}`);
        }, 1000);
      }
    } finally {
      setGeneratingSheet(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="education-system" className="block text-sm font-medium text-gray-700">
                Education System
              </label>
              <select
                id="education-system"
                value={educationSystem}
                onChange={(e) => setEducationSystem(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="">Select an education system</option>
                {educationSystems.map((system) => (
                  <option key={system.id} value={system.id}>
                    {system.name}
                  </option>
                ))}
              </select>
              {educationSystem && (
                <p className="mt-2 text-sm text-gray-500">
                  {educationSystems.find((system) => system.id === educationSystem)?.description}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="grade" className="block text-sm font-medium text-gray-700">
                Grade Level
              </label>
              <select
                id="grade"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                disabled={!educationSystem}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="">Select a grade level</option>
                {grades.map((gradeItem) => (
                  <option key={gradeItem.id} value={gradeItem.id}>
                    {gradeItem.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                Subject
              </label>
              <select
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="">Select a subject</option>
                {subjects.map((subjectItem) => (
                  <option key={subjectItem._id} value={subjectItem._id}>
                    {subjectItem.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="topic" className="block text-sm font-medium text-gray-700">
                Topic
              </label>
              <select
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={!subject}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="">Select a topic</option>
                {filteredTopics.map((topicItem) => (
                  <option key={topicItem._id} value={topicItem._id}>
                    {topicItem.name}
                  </option>
                ))}
              </select>
              {topic && (
                <p className="mt-2 text-sm text-gray-500">
                  {filteredTopics.find((t) => t._id === topic)?.description}
                </p>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="knowledge-level" className="block text-sm font-medium text-gray-700">
                Knowledge Level (1-10): {knowledgeLevel}
              </label>
              <input
                type="range"
                id="knowledge-level"
                min="1"
                max="10"
                value={knowledgeLevel}
                onChange={(e) => setKnowledgeLevel(parseInt(e.target.value))}
                className="mt-1 block w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Beginner</span>
                <span>Intermediate</span>
                <span>Advanced</span>
              </div>
            </div>

            <div>
              <label htmlFor="additional-info" className="block text-sm font-medium text-gray-700">
                Additional Information (Optional)
              </label>
              <textarea
                id="additional-info"
                rows={3}
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Any specific areas you want to focus on, learning goals, or preferences for the study sheet."
                className="mt-1 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border border-gray-300 rounded-md"
              />
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="use-textbooks"
                  name="use-textbooks"
                  type="checkbox"
                  checked={useTextbooks}
                  onChange={(e) => setUseTextbooks(e.target.checked)}
                  className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="use-textbooks" className="font-medium text-gray-700">
                  Use Uploaded Textbooks
                </label>
                <p className="text-gray-500">
                  The system will use knowledge from your uploaded textbooks to generate a more accurate and relevant study sheet.
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Generate Study Sheet</h1>
        <p className="mt-2 text-sm text-gray-500">
          Create a personalized study sheet by providing information about your educational needs.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="mb-8">
            <nav aria-label="Progress">
              <ol className="flex items-center">
                {[1, 2, 3].map((stepNumber) => (
                  <li
                    key={stepNumber}
                    className={`relative ${stepNumber !== 3 ? 'pr-8 sm:pr-20' : ''}`}
                  >
                    <div
                      className="absolute inset-0 flex items-center"
                      aria-hidden="true"
                      style={{ display: stepNumber === 3 ? 'none' : undefined }}
                    >
                      <div
                        className={`h-0.5 w-full ${
                          stepNumber < step ? 'bg-primary-600' : 'bg-gray-200'
                        }`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (stepNumber < step) {
                          setStep(stepNumber);
                        }
                      }}
                      className={`relative w-8 h-8 flex items-center justify-center ${
                        stepNumber <= step
                          ? 'bg-primary-600 rounded-full'
                          : 'bg-white border-2 border-gray-300 rounded-full'
                      }`}
                    >
                      <span
                        className={`text-sm font-semibold ${
                          stepNumber <= step ? 'text-white' : 'text-gray-500'
                        }`}
                      >
                        {stepNumber}
                      </span>
                    </button>
                    <div className="hidden sm:block absolute left-0 top-10 text-center w-full">
                      <span className="text-sm font-medium text-gray-500">
                        {stepNumber === 1 ? 'Education System' : stepNumber === 2 ? 'Subject & Topic' : 'Preferences'}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </nav>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <svg className="animate-spin h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : (
            <div className="mt-8">
              {renderStepContent()}

              <div className="mt-8 pt-5 border-t border-gray-200 flex justify-between">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  disabled={step === 1}
                  className={`px-4 py-2 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                    step === 1
                      ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleStepAction}
                  disabled={generatingSheet}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                    generatingSheet ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {generatingSheet ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : step < 3 ? (
                    'Next'
                  ) : (
                    'Generate Study Sheet'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GenerateStudySheetPage;
