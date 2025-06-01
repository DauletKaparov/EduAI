import time
from typing import Dict, List, Any, Optional
from .base_scraper import BaseScraper
import re

class WikipediaScraper(BaseScraper):
    """Scraper for Wikipedia educational content."""
    
    BASE_URL = "https://en.wikipedia.org"
    PORTAL_URL = f"{BASE_URL}/wiki/Portal:Contents/Portals"
    
    def __init__(self, rate_limit: int = 1):
        super().__init__(rate_limit)
    
    def get_subjects(self) -> List[Dict[str, Any]]:
        """Get all available educational subject portals."""
        subjects = []
        soup = self.get_page(self.PORTAL_URL)
        if not soup:
            return subjects
            
        # Get all portals from the main portal page
        portal_sections = soup.select(".hlist, .portalbox")
        
        for section in portal_sections:
            links = section.find_all("a")
            for link in links:
                if "href" in link.attrs and "/wiki/Portal:" in link["href"]:
                    url = link["href"]
                    name = link.text.strip()
                    
                    # Filter for educational subjects only
                    edu_keywords = ["education", "science", "mathematics", "history", 
                                   "literature", "language", "physics", "chemistry", 
                                   "biology", "geography", "computer", "technology"]
                    
                    if any(keyword in name.lower() for keyword in edu_keywords):
                        subjects.append({
                            "name": name,
                            "url": self.BASE_URL + url if not url.startswith("http") else url,
                            "source": "Wikipedia"
                        })
                
            # Respect rate limiting
            time.sleep(1/self.rate_limit)
            
        return subjects
    
    def get_topics(self) -> List[Dict[str, Any]]:
        """Get topics for all educational subjects."""
        topics = []
        subjects = self.get_subjects()
        
        for subject in subjects:
            soup = self.get_page(subject["url"])
            if not soup:
                continue
                
            # Find topic links in the portal
            content_div = soup.select_one("#mw-content-text")
            if not content_div:
                continue
                
            links = content_div.find_all("a")
            for link in links:
                if "href" in link.attrs and "/wiki/" in link["href"] and ":" not in link["href"]:
                    url = link["href"]
                    name = link.text.strip()
                    
                    # Skip links with non-educational terms
                    skip_terms = ["edit", "history", "talk", "user", "file:", "special:", "help:"]
                    if any(term in url.lower() for term in skip_terms) or len(name) < 3:
                        continue
                    
                    topics.append({
                        "name": name,
                        "url": self.BASE_URL + url if not url.startswith("http") else url,
                        "subject": subject["name"],
                        "source": "Wikipedia"
                    })
                    
            # Respect rate limiting
            time.sleep(1/self.rate_limit)
                
        return topics
    
    def get_content(self, topic_url: str) -> Dict[str, Any]:
        """Get educational content for a specific topic."""
        content = {
            "explanations": [],
            "examples": [],
            "references": [],
            "source": "Wikipedia",
            "url": topic_url
        }
        
        soup = self.get_page(topic_url)
        if not soup:
            return content
        
        # Get the title
        title_elem = soup.select_one("#firstHeading")
        title = title_elem.text.strip() if title_elem else "Untitled"
        
        # Get the main content
        main_content = soup.select_one("#mw-content-text")
        if not main_content:
            return content
            
        # Process each section
        sections = self._extract_sections(main_content)
        
        # Add the introduction as the first explanation
        intro_paras = []
        for p in main_content.find_all("p", recursive=False):
            if p.parent == main_content:  # Only direct children
                intro_paras.append(self.clean_text(p.text))
        
        introduction = "\n\n".join(intro_paras)
        if introduction:
            content["explanations"].append({
                "title": title,
                "content": introduction,
                "metadata": self.extract_metadata(main_content)
            })
        
        # Add each section as a separate explanation
        for section in sections:
            if section["content"]:
                content["explanations"].append({
                    "title": section["title"],
                    "content": section["content"],
                    "metadata": {"section_level": section["level"]}
                })
        
        # Extract examples (often in blockquotes or example boxes)
        example_elements = main_content.select("blockquote, .example, .thumbinner")
        for example in example_elements:
            example_text = self.clean_text(example.text)
            if example_text and len(example_text) > 50:  # Avoid tiny examples
                content["examples"].append({
                    "title": "Example",
                    "content": example_text
                })
        
        # Extract references
        references = main_content.select(".reference, .reflist li")
        for ref in references:
            ref_text = self.clean_text(ref.text)
            if ref_text:
                content["references"].append(ref_text)
        
        return content
    
    def _extract_sections(self, content_element) -> List[Dict[str, Any]]:
        """Extract sections and their content from Wikipedia article."""
        sections = []
        current_section = None
        current_content = []
        
        for element in content_element.children:
            if element.name in ["h1", "h2", "h3", "h4", "h5", "h6"]:
                # Save previous section if exists
                if current_section:
                    sections.append({
                        "title": current_section["title"],
                        "level": current_section["level"],
                        "content": "\n\n".join(current_content)
                    })
                
                # Start new section
                level = int(element.name[1])
                current_section = {
                    "title": self.clean_text(element.text),
                    "level": level
                }
                current_content = []
            elif element.name == "p" and current_section:
                para_text = self.clean_text(element.text)
                if para_text:
                    current_content.append(para_text)
            elif element.name in ["ul", "ol"] and current_section:
                list_items = element.find_all("li")
                for item in list_items:
                    item_text = self.clean_text(item.text)
                    if item_text:
                        current_content.append(f"• {item_text}")
        
        # Add the last section
        if current_section and current_content:
            sections.append({
                "title": current_section["title"],
                "level": current_section["level"],
                "content": "\n\n".join(current_content)
            })
            
        return sections
    
    def extract_metadata(self, content: Any) -> Dict[str, Any]:
        """Extract metadata from Wikipedia content."""
        metadata = {
            "categories": [],
            "tags": [],
            "summary": ""
        }
        
        # Extract categories
        category_links = content.select(".catlinks a")
        for link in category_links:
            category = self.clean_text(link.text)
            if category and "categories" not in category.lower():
                metadata["categories"].append(category)
        
        # Extract info box data as tags
        infobox = content.select_one(".infobox")
        if infobox:
            rows = infobox.select("tr")
            for row in rows:
                header = row.find("th")
                value = row.find("td")
                if header and value:
                    metadata["tags"].append(f"{header.text.strip()}: {value.text.strip()}")
        
        # Try to extract a summary from the first paragraph
        first_para = content.find("p")
        if first_para:
            summary = self.clean_text(first_para.text)
            if len(summary) > 150:
                summary = summary[:147] + "..."
            metadata["summary"] = summary
            
        return metadata
