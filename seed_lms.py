import asyncio
import os
from dotenv import load_dotenv
load_dotenv()

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.routers.lms import _generate_course_bg

async def seed_courses():
    topics = [
        {"topic": "Drone Operations & Topographical Mapping", "category": "Technology", "difficulty": "intermediate"},
        {"topic": "First Aid & Field Triage", "category": "Safety", "difficulty": "beginner"},
        {"topic": "The Worden Standard OS SaaS System", "category": "Software", "difficulty": "beginner"},
        {"topic": "Subcontractor Protocols and Site Etiquette", "category": "Operations", "difficulty": "beginner"},
        {"topic": "Asphalt Paving Engineering", "category": "Engineering", "difficulty": "advanced"},
        {"topic": "Concrete Pouring and Curing", "category": "Engineering", "difficulty": "intermediate"},
        {"topic": "Construction Estimating and Bidding", "category": "Business", "difficulty": "advanced"},
        {"topic": "Roofing Safety Protocols", "category": "Safety", "difficulty": "intermediate"},
        {"topic": "OSHA 10-Hour Compliance", "category": "Safety", "difficulty": "beginner"},
        {"topic": "General Construction Fundamentals", "category": "Operations", "difficulty": "beginner"},
    ]
    
    db: Session = SessionLocal()
    
    for t in topics:
        print(f"Generating course: {t['topic']}...")
        try:
            await _generate_course_bg(t['topic'], t['category'], t['difficulty'], "default", db)
            print(f"Successfully generated {t['topic']}")
        except Exception as e:
            print(f"Failed on {t['topic']}: {e}")
            
    db.close()
    print("All seeding complete.")

if __name__ == "__main__":
    asyncio.run(seed_courses())
