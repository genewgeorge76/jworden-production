import os
import sys
from pathlib import Path

# Add the project root to the python path
project_root = Path(__file__).resolve().parent.parent
sys.path.append(str(project_root))

from app.database import SessionLocal, create_all_tables
from app.models import Tenant, User
from app.routers.auth import get_password_hash

def bootstrap_hq():
    create_all_tables()
    db = SessionLocal()
    
    try:
        # Check if HQ exists
        hq_tenant = db.query(Tenant).filter(Tenant.tenant_id == "default").first()
        
        if not hq_tenant:
            print("Creating J. Worden HQ Tenant...")
            hq_tenant = Tenant(
                tenant_id="default",
                company_name="J. Worden & Sons Asphalt Paving",
                industry="Asphalt Paving",
                subscription_tier="max",
                contact_email="gene@thewordenstandard.com",
                is_active=1
            )
            db.add(hq_tenant)
            db.flush()
        
        # Check if Super Admin user exists
        hq_user = db.query(User).filter(User.email == "gene@thewordenstandard.com").first()
        
        if not hq_user:
            print("Creating Gene as Super Admin User...")
            hq_user = User(
                tenant_id="default",
                email="gene@thewordenstandard.com",
                hashed_password=get_password_hash("WordenHQ2026!"),  # They can change this later
                full_name="Gene Worden",
                role="admin",
                is_active=1
            )
            db.add(hq_user)
            
        db.commit()
        print("Successfully bootstrapped J. Worden HQ. You can log in with gene@thewordenstandard.com")
        
    except Exception as e:
        db.rollback()
        print(f"Error bootstrapping HQ: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    bootstrap_hq()
