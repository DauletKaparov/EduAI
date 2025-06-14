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

  const fetchInitialData = async () => {
    setLoading(true);
    setError('');

    try {
      // Try to fetch education systems from API
      const response = await axios.get(`${API_URL}/api/education-systems`);
      if (response.data) {
        setEducationSystems(response.data);
      }
    } catch (err) {
      console.log('Using mock education systems data');
      setEducationSystems(mockEducationSystems);
    }

    try {
      // Try to fetch subjects from API
      const response = await axios.get(`${API_URL}/api/subjects`);
      if (response.data) {
        setSubjects(response.data);
      }
    } catch (err) {
      console.log('Using mock subjects data');
      setSubjects(mockSubjects);
    }

    try {
      // Try to fetch topics from API
      const response = await axios.get(`${API_URL}/api/topics`);
      if (response.data) {
        setTopics(response.data);
      }
    } catch (err) {
      console.log('Using mock topics data');
      setTopics(mockTopics);
    }

    setLoading(false);
  };

  useEffect(() => {
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
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  const validateCurrentStep = (): boolean => {
    if (step === 1) {
      // Validate education system and grade
      if (!educationSystem) {
        setError('Please select an education system');
        return false;
      }
      if (!grade) {
        setError('Please select a grade level');
        return false;
      }
    } else if (step === 2) {
      // Validate subject and topic
      if (!subject) {
        setError('Please select a subject');
        return false;
      }
      if (!topic) {
        setError('Please enter a topic');
        return false;
      }
    }

    setError('');
    return true;
  };

  const handleStepAction = () => {
    if (step < 3) {
      if (validateCurrentStep()) {
        handleNextStep();
      }
    } else {
      handleGenerateStudySheet();
    }
  };

  const handleGenerateStudySheet = async () => {
    if (!validateCurrentStep()) {
      return;
    }

    setGeneratingSheet(true);
    setError('');

    try {
      // Get subject and education system names for logging
      const subjectName = subjects.find(s => s._id === subject)?.name || subject;
      const educationSystemName = educationSystems.find(es => es.id === educationSystem)?.name || educationSystem;
      const gradeName = grades.find(g => g.id === grade)?.name || grade;

      console.log(`Generating study sheet for ${subjectName} - ${topic} (${educationSystemName}, ${gradeName})`);

      // Prepare request payload
      const payload = {
        education_system: educationSystemName,
        grade: gradeName,
        subject: subjectName,
        topic: topic,
        knowledge_level: knowledgeLevel,
        additional_info: additionalInfo,
        use_textbooks: useTextbooks,
      };

      // Call API to generate study sheet
      const response = await generatorAPI.generateEnhancedStudySheet(payload);

      if (response.data) {
        console.log('Study sheet generated successfully');
        // Navigate to the study sheet page
        navigate(`/study-sheet/${response.data.sheet_id}`, {
          state: {
            content: response.data.content,
            topic: topic,
            subject: subjectName,
          }
        });
      }
    } catch (err: any) {
      console.error('Error generating study sheet', err);
      setError(err.response?.data?.detail || 'Failed to generate study sheet. Please try again.');
    } finally {
      setGeneratingSheet(false);
    }
  };

  // Render content based on current step
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="educationSystem" className="block text-sm font-medium text-gray-700">
                Education System
              </label>
              <select
                id="educationSystem"
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
                  {educationSystems.find((es) => es.id === educationSystem)?.description}
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
              <input
                type="text"
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={!subject}
                placeholder="Enter your topic (e.g., Algebra, French Revolution, Photosynthesis)"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              />
              <p className="mt-2 text-sm text-gray-500">
                Be specific about what you want to learn about this topic
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="knowledgeLevel" className="block text-sm font-medium text-gray-700">
                Knowledge Level (1-10)
              </label>
              <div className="mt-1 flex items-center">
                <input
                  type="range"
                  id="knowledgeLevel"
                  min="1"
                  max="10"
                  value={knowledgeLevel}
                  onChange={(e) => setKnowledgeLevel(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="ml-3 text-sm font-medium text-gray-700">{knowledgeLevel}</span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {knowledgeLevel <= 3
                  ? 'Beginner: Basic concepts and introductory content'
                  : knowledgeLevel <= 7
                  ? 'Intermediate: Moderate depth and some advanced concepts'
                  : 'Advanced: In-depth and comprehensive coverage'}
              </p>
            </div>

            <div>
              <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700">
                Additional Information (Optional)
              </label>
              <textarea
                id="additionalInfo"
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                rows={3}
                placeholder="Any specific areas to focus on or additional context..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>

            <div className="relative flex items-start">
              <div className="flex h-5 items-center">
                <input
                  id="useTextbooks"
                  type="checkbox"
                  checked={useTextbooks}
                  onChange={(e) => setUseTextbooks(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="useTextbooks" className="font-medium text-gray-700">
                  Use my uploaded textbooks
                </label>
                <p className="text-gray-500">
                  Include content from textbooks you've uploaded to enhance your study sheet
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
        <p className="mt-2 text-lg text-gray-600">
          Create a personalized study sheet by providing information about your educational needs.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-lg overflow-hidden sm:rounded-lg border border-gray-100">
        <div className="px-4 py-5 sm:p-6">
          <div className="mb-12">
            <nav aria-label="Progress">
              <ol className="flex items-center justify-center">
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
                      className={`relative w-10 h-10 flex items-center justify-center ${
                        stepNumber <= step
                          ? 'bg-primary-600 rounded-full shadow-lg'
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
                    <div className="absolute left-0 top-12 text-center w-full">
                      <span className={`text-sm font-medium ${stepNumber === step ? 'text-primary-600 font-bold' : 'text-gray-500'}`}>
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
