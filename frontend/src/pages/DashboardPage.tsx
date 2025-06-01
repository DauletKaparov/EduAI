import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

interface Subject {
  _id: string;
  name: string;
  description: string;
}

interface Topic {
  _id: string;
  name: string;
  description: string;
  subject_id: string;
  difficulty: number;
}

interface Progress {
  _id: string;
  topic_id: string;
  mastery_level: number;
  questions_answered: number;
  correct_answers: number;
  last_accessed: string;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [recentTopics, setRecentTopics] = useState<Topic[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        // Fetch subjects
        const subjectsResponse = await axios.get(`${API_URL}/api/subjects`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Fetch user progress
        const progressResponse = await axios.get(`${API_URL}/api/users/me/progress`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setSubjects(subjectsResponse.data.slice(0, 4)); // Limit to 4 subjects
        setProgress(progressResponse.data);
        
        // Get recent topics based on progress
        if (progressResponse.data.length > 0) {
          // Sort progress by last_accessed
          const sortedProgress = [...progressResponse.data].sort(
            (a, b) => new Date(b.last_accessed).getTime() - new Date(a.last_accessed).getTime()
          );
          
          // Get the topic IDs
          const topicIds = sortedProgress.slice(0, 3).map(p => p.topic_id);
          
          // Fetch topic details
          const topicPromises = topicIds.map(id => 
            axios.get(`${API_URL}/api/topics/${id}`, {
              headers: { Authorization: `Bearer ${token}` }
            })
          );
          
          const topicResponses = await Promise.all(topicPromises);
          setRecentTopics(topicResponses.map(res => res.data));
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [API_URL, user]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {user?.username}!
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here's your personalized learning dashboard
        </p>
      </div>
      
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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Topics */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Topics</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Continue where you left off</p>
              </div>
              <Link to="/subjects" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                View all
              </Link>
            </div>
            <div className="border-t border-gray-200">
              {recentTopics.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {recentTopics.map((topic) => {
                    const topicProgress = progress.find(p => p.topic_id === topic._id);
                    return (
                      <li key={topic._id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                        <Link to={`/topics/${topic._id}`} className="block">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-primary-600 truncate">{topic.name}</p>
                            <div className="ml-2 flex-shrink-0 flex">
                              <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                {topicProgress ? `${Math.round(topicProgress.mastery_level * 10)}% mastery` : 'New'}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 flex justify-between">
                            <div className="sm:flex">
                              <p className="flex items-center text-sm text-gray-500">
                                {topic.description.substring(0, 100)}
                                {topic.description.length > 100 ? '...' : ''}
                              </p>
                            </div>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="px-4 py-5 sm:px-6 text-center">
                  <p className="text-sm text-gray-500">You haven't studied any topics yet.</p>
                  <Link to="/subjects" className="mt-2 inline-block text-sm font-medium text-primary-600 hover:text-primary-500">
                    Explore subjects
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Learning Progress */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Your Learning Progress</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Track your knowledge growth</p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              {progress.length > 0 ? (
                <div className="space-y-6">
                  {progress.slice(0, 3).map((p) => {
                    const topic = recentTopics.find(t => t._id === p.topic_id) || { name: 'Unknown Topic' };
                    return (
                      <div key={p._id} className="space-y-2">
                        <div className="flex justify-between">
                          <p className="text-sm font-medium text-gray-900">{typeof topic === 'object' ? topic.name : topic}</p>
                          <p className="text-sm text-gray-500">{Math.round(p.mastery_level * 100)}%</p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-primary-600 h-2.5 rounded-full" 
                            style={{ width: `${Math.round(p.mastery_level * 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500">
                          {p.questions_answered} questions answered | Last studied: {new Date(p.last_accessed).toLocaleDateString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-gray-500">No progress data available yet.</p>
                  <p className="mt-1 text-sm text-gray-500">Start learning to track your progress!</p>
                </div>
              )}
            </div>
          </div>

          {/* Popular Subjects */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg lg:col-span-2">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Popular Subjects</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Explore subjects to study</p>
              </div>
              <Link to="/subjects" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                View all
              </Link>
            </div>
            <div className="border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
                {subjects.map((subject) => (
                  <Link
                    key={subject._id}
                    to={`/subjects?selected=${subject._id}`}
                    className="block bg-gray-50 hover:bg-gray-100 rounded-lg p-4 border border-gray-200"
                  >
                    <h3 className="text-md font-medium text-gray-900">{subject.name}</h3>
                    <p className="mt-2 text-sm text-gray-500 line-clamp-2">{subject.description}</p>
                    <div className="mt-4 flex items-center">
                      <span className="text-xs font-medium text-primary-600">Explore topics →</span>
                    </div>
                  </Link>
                ))}
                {subjects.length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <p className="text-sm text-gray-500">No subjects available yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
