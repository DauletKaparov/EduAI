import time
from typing import Dict, List, Any
from .base_scraper import BaseScraper

class KhanAcademyScraper(BaseScraper):
    """Scraper for Khan Academy content."""
    
    BASE_URL = "https://www.khanacademy.org"
    SUBJECTS_URL = f"{BASE_URL}/subjects"
    
    def __init__(self, rate_limit: int = 1):
        super().__init__(rate_limit)
    
    def get_subjects(self) -> List[Dict[str, Any]]:
        """Get all available subjects."""
        subjects = []
        soup = self.get_page(self.SUBJECTS_URL)
        if not soup:
            return subjects
            
        # Extract subject links
        # Note: This is an approximation and will need to be adjusted based on Khan Academy's actual HTML structure
        subject_elements = soup.select(".subject-card, .domain-card")
        for element in subject_elements:
            link = element.find("a")
            if link and "href" in link.attrs:
                url = link["href"]
                name = link.text.strip()
                subjects.append({
                    "name": name,
                    "url": self.BASE_URL + url if not url.startswith("http") else url,
                    "source": "Khan Academy"
                })
                
            # Respect rate limiting
            time.sleep(1/self.rate_limit)
            
        return subjects
    
    def get_topics(self) -> List[Dict[str, Any]]:
        """Get topics for all subjects."""
        topics = []
        subjects = self.get_subjects()
        
        for subject in subjects:
            soup = self.get_page(subject["url"])
            if not soup:
                continue
                
            # Extract topic links
            topic_elements = soup.select(".topic-card, .subject-card")
            for element in topic_elements:
                link = element.find("a")
                if link and "href" in link.attrs:
                    url = link["href"]
                    name = link.text.strip()
                    topics.append({
                        "name": name,
                        "url": self.BASE_URL + url if not url.startswith("http") else url,
                        "subject": subject["name"],
                        "source": "Khan Academy"
                    })
                    
                # Respect rate limiting
                time.sleep(1/self.rate_limit)
                
        return topics
    
    def get_content(self, topic_url: str) -> Dict[str, Any]:
        """Get content for a specific topic."""
        content = {
            "explanations": [],
            "examples": [],
            "exercises": [],
            "source": "Khan Academy",
            "url": topic_url
        }
        
        soup = self.get_page(topic_url)
        if not soup:
            return content
            
        # Extract article content
        article = soup.select_one("article, .article-content, .tutorial-content")
        if article:
            # Extract paragraphs
            paragraphs = article.find_all("p")
            explanation = "\n\n".join([self.clean_text(p.text) for p in paragraphs])
            
            # Extract headings
            headings = article.find_all(["h1", "h2", "h3"])
            title = headings[0].text.strip() if headings else ""
            
            content["explanations"].append({
                "title": title,
                "content": explanation,
                "metadata": self.extract_metadata(article)
            })
            
        # Extract examples and exercises (simplified)
        example_sections = soup.select(".example, .worked-example")
        for example in example_sections:
            content["examples"].append({
                "title": example.find("h3").text.strip() if example.find("h3") else "Example",
                "content": self.clean_text(example.text)
            })
            
        return content
    
    def extract_metadata(self, content: Any) -> Dict[str, Any]:
        """Extract metadata from content."""
        metadata = {
            "difficulty": "unknown",
            "tags": [],
            "prerequisites": []
        }
        
        # Extract difficulty if available
        difficulty_elem = content.select_one(".difficulty-level, .skill-level")
        if difficulty_elem:
            metadata["difficulty"] = difficulty_elem.text.strip()
            
        # Extract tags
        tag_elems = content.select(".tag, .topic-tag")
        metadata["tags"] = [tag.text.strip() for tag in tag_elems]
        
        return metadata
