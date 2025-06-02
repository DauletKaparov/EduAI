import os
import asyncio
from pymongo import MongoClient
from datetime import datetime
from bson import ObjectId
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB connection settings
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
DB_NAME = os.getenv('DB_NAME', 'eduai_db')

# Connect to MongoDB
client = MongoClient(MONGO_URI)
db = client[DB_NAME]

def create_sample_data():
    print('Creating sample data for EduAI platform...')
    
    # Create a sample subject
    subject = {
        'name': 'Computer Science',
        'description': 'Study of computers and computational systems',
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }
    
    # Insert subject
    subject_id = db.subjects.insert_one(subject).inserted_id
    print(f'Created subject: Computer Science (ID: {subject_id})')
    
    # Create sample topics
    topics = [
        {
            'name': 'Python Programming',
            'description': 'Introduction to Python programming language',
            'subject_id': str(subject_id),
            'subject_name': 'Computer Science',
            'difficulty': 3.0,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        },
        {
            'name': 'Data Structures',
            'description': 'Introduction to fundamental data structures',
            'subject_id': str(subject_id),
            'subject_name': 'Computer Science',
            'difficulty': 4.0,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
    ]
    
    # Insert topics
    topic_ids = []
    for topic in topics:
        topic_id = db.topics.insert_one(topic).inserted_id
        topic_ids.append(topic_id)
        print(f'Created topic: {topic["name"]} (ID: {topic_id})')
    
    # Create sample content for Python Programming
    python_contents = [
        {
            'title': 'Introduction to Python',
            'body': 'Python is a high-level, interpreted programming language known for its readability and simplicity. It was created by Guido van Rossum and first released in 1991. Python supports multiple programming paradigms, including procedural, object-oriented, and functional programming.\n\nPython is designed to be highly readable with its notable use of significant whitespace. Its syntax allows programmers to express concepts in fewer lines of code than might be used in languages such as C++ or Java. Python provides constructs intended to enable clear programs on both small and large scales.\n\nPython features a dynamic type system and automatic memory management. It supports multiple programming paradigms, including object-oriented, imperative, functional and procedural, and has a large and comprehensive standard library.',
            'type': 'explanation',
            'topic_id': str(topic_ids[0]),
            'difficulty': 2.0,
            'key_terms': ['Python', 'interpreted language', 'programming paradigms', 'whitespace'],
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        },
        {
            'title': 'Python Syntax Basics',
            'body': 'Python syntax is designed to be readable and straightforward. Here are the key elements of Python syntax:\n\n1. **Indentation**: Python uses indentation to define code blocks, rather than curly braces or keywords. Indentation is typically four spaces.\n\n2. **Variables and Data Types**: Python is dynamically typed, meaning you don\'t need to declare variable types. Common data types include integers, floating-point numbers, strings, lists, tuples, and dictionaries.\n\n3. **Comments**: Use the # character to start a comment.\n\n4. **Functions**: Define functions using the `def` keyword, followed by the function name and parameters.\n\n5. **Control Structures**: Python has typical control structures like if/else statements, for and while loops, and try/except blocks for exception handling.',
            'type': 'explanation',
            'topic_id': str(topic_ids[0]),
            'difficulty': 3.0,
            'key_terms': ['indentation', 'variables', 'data types', 'functions', 'control structures'],
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        },
        {
            'title': 'Hello World Example',
            'body': '```python\n# This is a simple Hello World program in Python\nprint("Hello, World!")\n```\n\nTo run this program, save it as `hello.py` and execute it using the Python interpreter by typing `python hello.py` in your terminal. The output will be:\n\n```\nHello, World!\n```',
            'type': 'example',
            'topic_id': str(topic_ids[0]),
            'difficulty': 1.0,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        },
        {
            'title': 'Basic Function Example',
            'body': '```python\n# Define a function to calculate the area of a rectangle\ndef calculate_area(length, width):\n    area = length * width\n    return area\n\n# Call the function with length=5 and width=3\nrectangle_area = calculate_area(5, 3)\nprint(f"The area of the rectangle is {rectangle_area} square units")\n```\n\nOutput:\n```\nThe area of the rectangle is 15 square units\n```',
            'type': 'example',
            'topic_id': str(topic_ids[0]),
            'difficulty': 2.5,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
    ]
    
    # Create sample content for Data Structures
    ds_contents = [
        {
            'title': 'Introduction to Data Structures',
            'body': 'Data structures are specialized formats for organizing and storing data to perform operations efficiently. They are essential components in computer science and software development.\n\nData structures provide a way to manage large amounts of data efficiently for uses such as large databases and internet indexing services. Different types of data structures are suited to different kinds of applications, and some are highly specialized to specific tasks.\n\nEfficient data structures are key to designing efficient algorithms, and can significantly impact the performance of software or systems. In most cases, proper data structure selection can make the difference between a program running in milliseconds versus hours.',
            'type': 'explanation',
            'topic_id': str(topic_ids[1]),
            'difficulty': 3.0,
            'key_terms': ['data structures', 'efficiency', 'algorithms', 'performance'],
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        },
        {
            'title': 'Arrays and Lists',
            'body': 'Arrays and lists are among the most fundamental data structures. An array is a collection of elements identified by index or key. Lists are similar but typically offer dynamic sizing and additional operations.\n\nArrays store elements in contiguous memory locations, resulting in easily calculable addresses for the elements. This makes accessing an array element very efficient. However, the size of an array is fixed, making insertion and deletion operations potentially inefficient due to the need to shift elements.\n\nIn contrast, lists (such as linked lists) allow for efficient insertion and deletion operations, but may require more memory due to the storage of additional pointers. Lists also typically have less efficient random access than arrays.',
            'type': 'explanation',
            'topic_id': str(topic_ids[1]),
            'difficulty': 4.0,
            'key_terms': ['array', 'list', 'linked list', 'contiguous memory', 'pointers'],
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        },
        {
            'title': 'Array Implementation in Python',
            'body': '```python\n# Using a Python list as an array\nmy_array = [10, 20, 30, 40, 50]\n\n# Accessing elements\nprint(my_array[0])  # Output: 10\nprint(my_array[2])  # Output: 30\n\n# Modifying elements\nmy_array[1] = 25\nprint(my_array)  # Output: [10, 25, 30, 40, 50]\n\n# Length of array\nprint(len(my_array))  # Output: 5\n\n# Adding elements\nmy_array.append(60)\nprint(my_array)  # Output: [10, 25, 30, 40, 50, 60]\n\n# Removing elements\nmy_array.pop(2)  # Remove element at index 2\nprint(my_array)  # Output: [10, 25, 40, 50, 60]\n```',
            'type': 'example',
            'topic_id': str(topic_ids[1]),
            'difficulty': 3.0,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
    ]
    
    # Insert all content
    content_ids = []
    for content in python_contents + ds_contents:
        content_id = db.contents.insert_one(content).inserted_id
        content_ids.append(content_id)
        print(f'Created content: {content["title"]} (ID: {content_id})')
    
    print('\nSample data creation complete!')
    print(f'Created 1 subject, {len(topics)} topics, and {len(content_ids)} content items')
    print('\nYou can now run the test_study_sheet.py script to generate study sheets!')

if __name__ == '__main__':
    create_sample_data()
