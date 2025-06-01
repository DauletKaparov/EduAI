from typing import List, Dict, Any
import numpy as np
from sklearn.neighbors import NearestNeighbors
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class PersonalizationEngine:
    """Engine for personalizing educational content based on user profiles."""
    
    def __init__(self):
        """Initialize the personalization engine."""
        self.model = NearestNeighbors(n_neighbors=5, algorithm='ball_tree')
        self.content_vectors = []
        self.content_ids = []
    
    def train(self, contents: List[Dict[str, Any]]):
        """
        Train the recommendation model with available content.
        
        Args:
            contents: List of content objects
        """
        if not contents:
            logger.warning("No content available for training personalization engine")
            return
        
        # Extract features for each content
        feature_vectors = []
        content_ids = []
        
        for content in contents:
            # Create feature vector
            features = self._extract_content_features(content)
            if features is not None:
                feature_vectors.append(features)
                content_ids.append(str(content.get("_id")))
        
        if not feature_vectors:
            logger.warning("No valid features extracted for personalization")
            return
            
        # Train model
        try:
            feature_array = np.array(feature_vectors)
            self.model.fit(feature_array)
            self.content_vectors = feature_array
            self.content_ids = content_ids
            logger.info(f"Personalization engine trained with {len(content_ids)} content items")
        except Exception as e:
            logger.error(f"Error training personalization model: {str(e)}")
    
    def _extract_content_features(self, content: Dict[str, Any]) -> np.ndarray:
        """
        Extract feature vector from content.
        
        Args:
            content: Content object
            
        Returns:
            Feature vector as numpy array
        """
        try:
            # Features:
            # 1. Difficulty (normalized to 0-1)
            # 2. Content type (one-hot: explanation=1,0,0, example=0,1,0, resource=0,0,1)
            # 3. Readability score (normalized to 0-1)
            # 4. Content length (normalized to 0-1)
            
            features = np.zeros(6)
            
            # Difficulty
            difficulty = content.get("difficulty", 5.0)
            features[0] = difficulty / 10.0
            
            # Content type
            content_type = content.get("type", "explanation")
            if content_type == "explanation":
                features[1] = 1.0
            elif content_type == "example":
                features[2] = 1.0
            elif content_type == "resource":
                features[3] = 1.0
            
            # Readability
            readability = content.get("readability", {})
            flesch_score = readability.get("flesch_reading_ease", 50.0)
            features[4] = flesch_score / 100.0
            
            # Length
            body = content.get("body", "")
            max_length = 10000  # Normalization factor
            features[5] = min(len(body) / max_length, 1.0)
            
            return features
            
        except Exception as e:
            logger.error(f"Error extracting content features: {str(e)}")
            return None
    
    def get_user_profile(self, user_data: Dict[str, Any]) -> np.ndarray:
        """
        Generate a user profile vector based on user data.
        
        Args:
            user_data: User information including preferences and history
            
        Returns:
            User profile vector
        """
        profile = np.zeros(6)
        
        # User knowledge level (normalized to 0-1)
        knowledge_level = user_data.get("preferences", {}).get("knowledge_level", 5.0)
        profile[0] = knowledge_level / 10.0
        
        # Content type preferences
        preferences = user_data.get("preferences", {})
        profile[1] = preferences.get("prefer_explanations", 0.6)  # Default preference for explanations
        profile[2] = preferences.get("prefer_examples", 0.3)      # Default preference for examples
        profile[3] = preferences.get("prefer_resources", 0.1)     # Default preference for resources
        
        # Readability preference (higher means preference for easier content)
        profile[4] = 1.0 - (knowledge_level / 10.0)  # Inverse of knowledge level
        
        # Length preference (default to medium length)
        profile[5] = preferences.get("prefer_length", 0.5)  # 0=short, 1=long
        
        return profile
    
    def recommend_content(self, 
                         user_data: Dict[str, Any], 
                         n_recommendations: int = 5,
                         topic_id: str = None) -> List[str]:
        """
        Recommend content based on user profile.
        
        Args:
            user_data: User information
            n_recommendations: Number of recommendations to return
            topic_id: Optional topic ID to filter recommendations
            
        Returns:
            List of content IDs
        """
        if not self.content_vectors.any() or not self.content_ids:
            logger.warning("Personalization engine not trained")
            return []
        
        # Generate user profile
        user_profile = self.get_user_profile(user_data)
        user_profile = user_profile.reshape(1, -1)
        
        # Find nearest neighbors
        try:
            distances, indices = self.model.kneighbors(user_profile, n_neighbors=min(n_recommendations*2, len(self.content_ids)))
            
            # Get content IDs
            recommended_ids = [self.content_ids[idx] for idx in indices[0]]
            
            return recommended_ids[:n_recommendations]
        except Exception as e:
            logger.error(f"Error generating recommendations: {str(e)}")
            return []
    
    def update_user_profile(self, 
                           user_data: Dict[str, Any], 
                           interaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update user profile based on interaction data.
        
        Args:
            user_data: Current user data
            interaction_data: User interaction with content
            
        Returns:
            Updated user data
        """
        updated_user = user_data.copy()
        preferences = updated_user.get("preferences", {}).copy()
        
        # Initialize preferences if not present
        if not preferences:
            preferences = {
                "knowledge_level": 5.0,
                "prefer_explanations": 0.6,
                "prefer_examples": 0.3,
                "prefer_resources": 0.1,
                "prefer_length": 0.5
            }
        
        # Update based on content interactions
        content_type = interaction_data.get("content_type")
        rating = interaction_data.get("rating", 3)  # 1-5 rating
        time_spent = interaction_data.get("time_spent", 0)  # seconds
        
        # Adjust content type preferences
        if content_type == "explanation":
            preferences["prefer_explanations"] = min(1.0, preferences.get("prefer_explanations", 0.6) + (rating - 3) * 0.05)
        elif content_type == "example":
            preferences["prefer_examples"] = min(1.0, preferences.get("prefer_examples", 0.3) + (rating - 3) * 0.05)
        elif content_type == "resource":
            preferences["prefer_resources"] = min(1.0, preferences.get("prefer_resources", 0.1) + (rating - 3) * 0.05)
        
        # Normalize content type preferences to sum to 1
        total = preferences.get("prefer_explanations", 0.6) + preferences.get("prefer_examples", 0.3) + preferences.get("prefer_resources", 0.1)
        if total > 0:
            preferences["prefer_explanations"] = preferences.get("prefer_explanations", 0.6) / total
            preferences["prefer_examples"] = preferences.get("prefer_examples", 0.3) / total
            preferences["prefer_resources"] = preferences.get("prefer_resources", 0.1) / total
        
        # Adjust knowledge level based on content difficulty and rating
        difficulty = interaction_data.get("content_difficulty", 5.0)
        if rating >= 4 and difficulty > preferences.get("knowledge_level", 5.0):
            # User understood difficult content, increase knowledge level
            preferences["knowledge_level"] = min(10.0, preferences.get("knowledge_level", 5.0) + 0.2)
        elif rating <= 2 and difficulty <= preferences.get("knowledge_level", 5.0):
            # User struggled with easier content, decrease knowledge level
            preferences["knowledge_level"] = max(1.0, preferences.get("knowledge_level", 5.0) - 0.2)
        
        # Adjust length preference based on time spent
        content_length = interaction_data.get("content_length", 0)
        if content_length > 0 and time_spent > 0:
            # Time spent per character
            time_per_char = time_spent / content_length
            if time_per_char > 0.1:  # User spent time reading thoroughly
                # Prefer shorter content
                preferences["prefer_length"] = max(0.0, preferences.get("prefer_length", 0.5) - 0.05)
            elif time_per_char < 0.02:  # User skimmed quickly
                # Prefer longer content
                preferences["prefer_length"] = min(1.0, preferences.get("prefer_length", 0.5) + 0.05)
        
        updated_user["preferences"] = preferences
        return updated_user
