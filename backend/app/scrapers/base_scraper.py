import requests
from abc import ABC, abstractmethod
from bs4 import BeautifulSoup
from typing import Dict, List, Any, Optional
import logging
import time
import os
from datetime import datetime

class BaseScraper(ABC):
    """Base class for all educational content scrapers."""
    
    def __init__(self, rate_limit: int = 1):
        """
        Initialize the scraper.
        
        Args:
            rate_limit: Requests per second
        """
        self.session = requests.Session()
        self.rate_limit = rate_limit
        self.logger = logging.getLogger(f"{self.__class__.__name__}")
        self.last_request_time = 0
    
    def get_page(self, url: str) -> Optional[BeautifulSoup]:
        """
        Get and parse a web page.
        
        Args:
            url: URL to scrape
            
        Returns:
            BeautifulSoup object or None if failed
        """
        # Implement rate limiting
        current_time = time.time()
        time_since_last_request = current_time - self.last_request_time
        if time_since_last_request < (1.0 / self.rate_limit):
            time.sleep((1.0 / self.rate_limit) - time_since_last_request)
        
        try:
            response = self.session.get(
                url, 
                headers={
                    "User-Agent": "EduAI Research Bot (educational purposes)",
                    "Accept": "text/html,application/xhtml+xml,application/xml",
                    "Accept-Language": "en-US,en;q=0.9"
                },
                timeout=10
            )
            response.raise_for_status()
            self.last_request_time = time.time()
            return BeautifulSoup(response.text, "html.parser")
        except Exception as e:
            self.logger.error(f"Error fetching {url}: {str(e)}")
            return None
    
    @abstractmethod
    def get_topics(self) -> List[Dict[str, Any]]:
        """Get available topics from the source."""
        pass
    
    @abstractmethod
    def get_content(self, topic_id: str) -> Dict[str, Any]:
        """Get content for a specific topic."""
        pass
    
    @abstractmethod
    def extract_metadata(self, content: Any) -> Dict[str, Any]:
        """Extract metadata from content."""
        pass
    
    def clean_text(self, text: str) -> str:
        """Clean extracted text."""
        if not text:
            return ""
        # Remove extra whitespace
        text = ' '.join(text.split())
        return text
    
    def save_content(self, content: Dict[str, Any], filename: str = None) -> str:
        """
        Save scraped content to a file.
        
        Args:
            content: Content dictionary to save
            filename: Optional filename, if None will generate one
            
        Returns:
            Path to saved file
        """
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            source = content.get("source", "unknown").lower().replace(" ", "_")
            filename = f"{source}_{timestamp}.json"
        
        data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
        os.makedirs(data_dir, exist_ok=True)
        
        import json
        filepath = os.path.join(data_dir, filename)
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(content, f, ensure_ascii=False, indent=2)
        
        return filepath
