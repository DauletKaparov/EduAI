import logging
from typing import List, Dict, Any, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import nltk
from nltk.tokenize import sent_tokenize
from datetime import datetime
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ContentGenerator:
    """AI-powered content generation for educational materials."""
    
    def __init__(self):
        """Initialize the content generator."""
        self.vectorizer = TfidfVectorizer(stop_words='english')
        
        # Download NLTK resources if needed
        try:
            nltk.data.find('tokenizers/punkt')
        except LookupError:
            nltk.download('punkt')
    
    async def generate_study_sheet(self, 
                                  topic_id: str, 
                                  user_knowledge_level: float = 5.0,
                                  contents: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Generate a personalized study sheet for a topic.
        
        Args:
            topic_id: ID of the topic
            user_knowledge_level: User's knowledge level (1-10)
            contents: Optional list of pre-fetched content
            
        Returns:
            Generated study sheet
        """
        if not contents or len(contents) == 0:
            logger.error("No content available for study sheet generation")
            return {
                "title": "Study Sheet Unavailable",
                "content": "We don't have enough content to generate a study sheet for this topic yet.",
                "error": True
            }
        
        # Filter content by difficulty level appropriate for the user
        difficulty_range = 2.0  # Allow content within this range of user's level
        matching_content = [
            c for c in contents 
            if abs(c.get("difficulty", 5.0) - user_knowledge_level) <= difficulty_range
        ]
        
        # If no matching content, use all available content
        if not matching_content:
            matching_content = contents
        
        # Sort content by type and relevance
        explanations = [c for c in matching_content if c.get("type") == "explanation"]
        examples = [c for c in matching_content if c.get("type") == "example"]
        
        # Create study sheet structure
        study_sheet = {
            "title": f"Personalized Study Sheet",
            "topic_id": topic_id,
            "sections": [],
            "created_at": datetime.utcnow(),
            "difficulty_level": user_knowledge_level
        }
        
        # Add introduction section
        if explanations:
            intro = self._create_introduction(explanations)
            study_sheet["sections"].append({
                "title": "Introduction",
                "content": intro,
                "type": "explanation"
            })
        
        # Add key concepts section
        if explanations:
            key_concepts = self._extract_key_concepts(explanations)
            study_sheet["sections"].append({
                "title": "Key Concepts",
                "content": key_concepts,
                "type": "explanation"
            })
        
        # Add detailed explanations
        for i, explanation in enumerate(explanations[:3]):  # Limit to 3 explanations
            study_sheet["sections"].append({
                "title": explanation.get("title", f"Concept {i+1}"),
                "content": self._format_content(explanation.get("body", "")),
                "type": "explanation"
            })
        
        # Add examples
        if examples:
            study_sheet["sections"].append({
                "title": "Examples",
                "content": self._compile_examples(examples),
                "type": "example"
            })
        
        # Add practice questions
        questions = self._generate_practice_questions(explanations, examples)
        if questions:
            study_sheet["sections"].append({
                "title": "Practice Questions",
                "content": questions,
                "type": "practice"
            })
        
        # Add summary
        if explanations:
            summary = self._create_summary(explanations)
            study_sheet["sections"].append({
                "title": "Summary",
                "content": summary,
                "type": "explanation"
            })
        
        return study_sheet
    
    def _create_introduction(self, explanations: List[Dict[str, Any]]) -> str:
        """Create an introduction from available explanations."""
        # Use the first paragraph from the most basic explanation
        sorted_explanations = sorted(explanations, key=lambda x: x.get("difficulty", 5.0))
        
        if not sorted_explanations:
            return "Introduction unavailable."
        
        explanation = sorted_explanations[0]
        body = explanation.get("body", "")
        
        # Extract first paragraph
        paragraphs = body.split("\n\n")
        intro_paragraph = paragraphs[0] if paragraphs else body
        
        # Limit introduction length
        sentences = sent_tokenize(intro_paragraph)
        intro = " ".join(sentences[:3])
        
        return intro
    
    def _extract_key_concepts(self, explanations: List[Dict[str, Any]]) -> str:
        """Extract and format key concepts from explanations."""
        all_key_terms = []
        
        # Collect key terms from all explanations
        for explanation in explanations:
            terms = explanation.get("key_terms", [])
            all_key_terms.extend(terms)
        
        # Count term frequency
        term_counts = {}
        for term in all_key_terms:
            term_counts[term] = term_counts.get(term, 0) + 1
        
        # Sort by frequency
        sorted_terms = sorted(term_counts.items(), key=lambda x: x[1], reverse=True)
        
        # Create definitions for top terms
        key_concepts = []
        for term, _ in sorted_terms[:8]:  # Limit to top 8 terms
            # Find sentences containing this term
            definition = self._find_term_definition(term, explanations)
            key_concepts.append(f"**{term.title()}**: {definition}")
        
        return "\n\n".join(key_concepts)
    
    def _find_term_definition(self, term: str, explanations: List[Dict[str, Any]]) -> str:
        """Find the best definition sentence for a term."""
        term_lower = term.lower()
        best_sentence = f"Important concept in this topic."
        
        for explanation in explanations:
            body = explanation.get("body", "")
            sentences = sent_tokenize(body)
            
            for sentence in sentences:
                if term_lower in sentence.lower():
                    # Score the sentence based on length and position
                    score = len(sentence)
                    if sentence == sentences[0]:
                        score += 100  # Prefer first sentence
                    
                    # Replace current best if this is better
                    if len(best_sentence) < 10 or score > len(best_sentence):
                        best_sentence = sentence
        
        return best_sentence
    
    def _format_content(self, content: str) -> str:
        """Format content for better readability."""
        # Ensure paragraphs are properly separated
        formatted = re.sub(r'\n{3,}', '\n\n', content)
        
        # Break very long paragraphs
        paragraphs = formatted.split("\n\n")
        formatted_paragraphs = []
        
        for p in paragraphs:
            if len(p) > 500:
                sentences = sent_tokenize(p)
                mid_point = len(sentences) // 2
                p1 = " ".join(sentences[:mid_point])
                p2 = " ".join(sentences[mid_point:])
                formatted_paragraphs.append(p1)
                formatted_paragraphs.append(p2)
            else:
                formatted_paragraphs.append(p)
        
        return "\n\n".join(formatted_paragraphs)
    
    def _compile_examples(self, examples: List[Dict[str, Any]]) -> str:
        """Compile examples into a cohesive section."""
        # Sort examples by difficulty
        sorted_examples = sorted(examples, key=lambda x: x.get("difficulty", 5.0))
        
        formatted_examples = []
        for i, example in enumerate(sorted_examples[:3]):  # Limit to 3 examples
            title = example.get("title", f"Example {i+1}")
            content = example.get("body", "").strip()
            
            formatted_examples.append(f"### {title}\n\n{content}")
        
        return "\n\n".join(formatted_examples)
    
    def _generate_practice_questions(self, 
                                    explanations: List[Dict[str, Any]], 
                                    examples: List[Dict[str, Any]]) -> str:
        """Generate practice questions based on content."""
        # For MVP, generate simple questions based on key terms
        questions = []
        
        # Collect key terms
        all_key_terms = []
        for explanation in explanations:
            terms = explanation.get("key_terms", [])
            all_key_terms.extend(terms)
        
        # Generate fill-in-the-blank questions
        for i, term in enumerate(all_key_terms[:5]):  # Limit to 5 questions
            definition = self._find_term_definition(term, explanations)
            
            # Replace the term with a blank in the definition
            question_text = definition.replace(term, "________")
            
            questions.append(f"{i+1}. {question_text}")
            questions.append(f"   Answer: {term}")
            questions.append("")
        
        # Generate true/false questions
        content_text = ""
        for explanation in explanations:
            content_text += explanation.get("body", "") + " "
        
        sentences = sent_tokenize(content_text)
        statement_candidates = [s for s in sentences if 10 < len(s) < 150]
        
        if statement_candidates:
            # Select random statements for true/false questions
            import random
            selected = random.sample(statement_candidates, min(3, len(statement_candidates)))
            
            for i, statement in enumerate(selected):
                questions.append(f"{len(questions)//3 + 1}. True or False: {statement}")
                questions.append("   Answer: True")  # For MVP, all are true
                questions.append("")
        
        return "\n".join(questions)
    
    def _create_summary(self, explanations: List[Dict[str, Any]]) -> str:
        """Create a summary of the topic."""
        # For MVP, use the last paragraph of the first explanation
        if not explanations:
            return "Summary unavailable."
        
        explanation = explanations[0]
        body = explanation.get("body", "")
        
        paragraphs = body.split("\n\n")
        if len(paragraphs) > 1:
            return paragraphs[-1]
        elif paragraphs:
            sentences = sent_tokenize(paragraphs[0])
            if len(sentences) > 3:
                return " ".join(sentences[-3:])
            return paragraphs[0]
        
        return "Summary unavailable."
    
    def generate_personalized_questions(self, 
                                       content: List[Dict[str, Any]], 
                                       user_level: float,
                                       num_questions: int = 5) -> List[Dict[str, Any]]:
        """
        Generate personalized practice questions.
        
        Args:
            content: Content to base questions on
            user_level: User knowledge level (1-10)
            num_questions: Number of questions to generate
            
        Returns:
            List of question objects
        """
        questions = []
        
        # Filter content by difficulty appropriate for user
        appropriate_content = [
            c for c in content 
            if abs(c.get("difficulty", 5.0) - user_level) <= 2.0
        ]
        
        if not appropriate_content:
            appropriate_content = content
        
        # Extract key terms for fill-in-the-blank questions
        key_terms = []
        for c in appropriate_content:
            key_terms.extend(c.get("key_terms", []))
        
        # Generate questions
        question_count = 0
        
        # Fill-in-the-blank questions from key terms
        for term in key_terms:
            if question_count >= num_questions:
                break
                
            definition = self._find_term_definition(term, appropriate_content)
            if len(definition) > 20:
                question_text = definition.replace(term, "________")
                
                questions.append({
                    "text": question_text,
                    "type": "fill_blank",
                    "options": [],
                    "correct_answer": term,
                    "explanation": definition,
                    "difficulty": user_level
                })
                
                question_count += 1
        
        return questions
