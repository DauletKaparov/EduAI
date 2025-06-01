from typing import Dict, Any, List
import re
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords
from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Download necessary NLTK resources if needed
try:
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('punkt')
    nltk.download('stopwords')

class ContentProcessor:
    """Processes educational content for storage and analysis."""
    
    def __init__(self):
        self.stop_words = set(stopwords.words('english'))
        self.vectorizer = TfidfVectorizer(stop_words='english')
        
    def preprocess(self, content: Dict[str, Any]) -> Dict[str, Any]:
        """
        Preprocess content for storage.
        
        Args:
            content: Raw content dictionary
            
        Returns:
            Processed content dictionary
        """
        processed = content.copy()
        
        # Process explanations
        if "explanations" in processed:
            for i, explanation in enumerate(processed["explanations"]):
                # Clean and normalize text
                explanation["content"] = self._clean_text(explanation["content"])
                
                # Extract key terms
                explanation["key_terms"] = self._extract_key_terms(explanation["content"])
                
                # Calculate readability metrics
                explanation["readability"] = self._calculate_readability(explanation["content"])
                
                processed["explanations"][i] = explanation
                
        # Process examples similarly
        if "examples" in processed:
            for i, example in enumerate(processed["examples"]):
                example["content"] = self._clean_text(example["content"])
                processed["examples"][i] = example
                
        # Calculate overall difficulty
        processed["difficulty_score"] = self._calculate_difficulty(processed)
        
        return processed
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text."""
        if not text:
            return ""
            
        # Remove HTML tags
        text = re.sub(r'<.*?>', '', text)
        
        # Remove citation brackets common in Wikipedia [1], [2], etc.
        text = re.sub(r'\[\d+\]', '', text)
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
    
    def _extract_key_terms(self, text: str, max_terms: int = 10) -> List[str]:
        """Extract key terms from text using TF-IDF."""
        if not text or len(text) < 50:
            return []
            
        # Tokenize and prepare text
        tokens = word_tokenize(text.lower())
        filtered_tokens = [w for w in tokens if w.isalnum() and w not in self.stop_words and len(w) > 2]
        
        # If text is too short, return basic tokens
        if len(filtered_tokens) < 10:
            return filtered_tokens[:max_terms]
            
        # Use TF-IDF for longer texts
        try:
            tfidf_matrix = self.vectorizer.fit_transform([text])
            feature_names = self.vectorizer.get_feature_names_out()
            
            # Get top terms
            importance = zip(feature_names, tfidf_matrix.toarray()[0])
            sorted_importance = sorted(importance, key=lambda x: x[1], reverse=True)
            
            return [term for term, score in sorted_importance[:max_terms]]
        except Exception as e:
            logger.error(f"Error extracting key terms: {str(e)}")
            # Fallback if TF-IDF fails
            return filtered_tokens[:max_terms]
    
    def _calculate_readability(self, text: str) -> Dict[str, float]:
        """Calculate readability metrics."""
        metrics = {
            "flesch_reading_ease": 0,
            "sentence_count": 0,
            "word_count": 0,
            "avg_word_length": 0,
            "avg_sentence_length": 0
        }
        
        if not text or len(text) < 50:
            return metrics
            
        try:
            # Basic metrics
            sentences = sent_tokenize(text)
            words = word_tokenize(text)
            
            # Filter out non-words
            words = [w for w in words if w.isalnum()]
            
            metrics["sentence_count"] = len(sentences)
            metrics["word_count"] = len(words)
            
            if words:
                metrics["avg_word_length"] = sum(len(word) for word in words) / len(words)
                
            if sentences:
                metrics["avg_sentence_length"] = len(words) / len(sentences)
                
            # Flesch Reading Ease (simplified)
            if metrics["sentence_count"] > 0 and metrics["word_count"] > 0:
                metrics["flesch_reading_ease"] = 206.835 - (1.015 * metrics["avg_sentence_length"]) - (84.6 * metrics["avg_word_length"])
                
                # Clamp to valid range
                metrics["flesch_reading_ease"] = max(0, min(100, metrics["flesch_reading_ease"]))
        except Exception as e:
            logger.error(f"Error calculating readability: {str(e)}")
            
        return metrics
    
    def _calculate_difficulty(self, content: Dict[str, Any]) -> float:
        """Calculate overall content difficulty on a scale of 1-10."""
        difficulty = 5.0  # Default medium difficulty
        
        # Use readability metrics if available
        if "explanations" in content and content["explanations"]:
            readability = content["explanations"][0].get("readability", {})
            if readability:
                # Convert Flesch score to difficulty (higher Flesch = easier = lower difficulty)
                flesch = readability.get("flesch_reading_ease", 50)
                
                # Flesch is typically 0-100, higher means easier
                # Convert to 1-10 scale where 10 is most difficult
                if flesch > 0:
                    difficulty = 10 - (flesch / 10)
                    
                # Clamp to valid range
                difficulty = max(1, min(10, difficulty))
                
        # Adjust based on metadata if available
        metadata_difficulty = None
        if "explanations" in content and content["explanations"]:
            metadata = content["explanations"][0].get("metadata", {})
            if "difficulty" in metadata:
                # Convert text difficulty to numeric
                difficulty_map = {
                    "beginner": 2.5,
                    "easy": 3.5,
                    "medium": 5.0,
                    "intermediate": 6.5,
                    "advanced": 8.5,
                    "expert": 9.5
                }
                metadata_difficulty = difficulty_map.get(str(metadata["difficulty"]).lower(), None)
                
        # Combine metrics if we have both
        if metadata_difficulty is not None:
            difficulty = (difficulty + metadata_difficulty) / 2
            
        return round(difficulty, 1)
    
    def create_db_content(self, raw_content: Dict[str, Any], topic_id: str) -> List[Dict[str, Any]]:
        """
        Convert raw scraped content into database content entries.
        
        Args:
            raw_content: Raw content from scraper
            topic_id: ID of the topic this content belongs to
            
        Returns:
            List of content entries ready for database insertion
        """
        db_contents = []
        
        # Process each explanation into a separate content entry
        if "explanations" in raw_content:
            for explanation in raw_content["explanations"]:
                content_entry = {
                    "topic_id": topic_id,
                    "type": "explanation",
                    "title": explanation.get("title", "Untitled"),
                    "body": explanation.get("content", ""),
                    "source": raw_content.get("source", "Unknown"),
                    "source_url": raw_content.get("url", None),
                    "difficulty": self._calculate_difficulty({"explanations": [explanation]}),
                    "key_terms": explanation.get("key_terms", []),
                    "readability": explanation.get("readability", {}),
                    "metadata": explanation.get("metadata", {}),
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
                db_contents.append(content_entry)
        
        # Process examples
        if "examples" in raw_content:
            for example in raw_content["examples"]:
                content_entry = {
                    "topic_id": topic_id,
                    "type": "example",
                    "title": example.get("title", "Example"),
                    "body": example.get("content", ""),
                    "source": raw_content.get("source", "Unknown"),
                    "source_url": raw_content.get("url", None),
                    "difficulty": raw_content.get("difficulty_score", 5.0),
                    "key_terms": [],
                    "readability": {},
                    "metadata": {},
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
                db_contents.append(content_entry)
        
        return db_contents
