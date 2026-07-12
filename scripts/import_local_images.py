import os
import base64
import uuid
import requests
import mimetypes
from datetime import datetime, timezone
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, DateTime, Text

MAPBOX_TOKEN = "YOUR_MAPBOX_TOKEN_HERE"

# DB Setup
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'jworden_leads.db')
engine = create_engine(f"sqlite:///{DB_PATH}")
Session = sessionmaker(bind=engine)
session = Session()

Base = declarative_base()

class GalleryImage(Base):
    __tablename__ = "gallery_images"
    id = Column(String(36), primary_key=True)
    filename = Column(String(255), nullable=False)
    job_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    mime_type = Column(String(50), nullable=False)
    data_uri = Column(Text, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

def get_exif_data(image):
    exif_data = {}
    try:
        info = image._getexif()
        if info:
            for tag, value in info.items():
                decoded = TAGS.get(tag, tag)
                if decoded == "GPSInfo":
                    gps_data = {}
                    for t in value:
                        sub_decoded = GPSTAGS.get(t, t)
                        gps_data[sub_decoded] = value[t]
                    exif_data[decoded] = gps_data
                else:
                    exif_data[decoded] = value
    except Exception as e:
        pass
    return exif_data

def get_lat_lon(exif_data):
    if "GPSInfo" in exif_data:
        gps_info = exif_data["GPSInfo"]
        
        def convert_to_degrees(value):
            try:
                d = float(value[0])
                m = float(value[1])
                s = float(value[2])
                return d + (m / 60.0) + (s / 3600.0)
            except:
                return None
            
        lat = None
        lon = None
        
        if "GPSLatitude" in gps_info and "GPSLatitudeRef" in gps_info:
            lat = convert_to_degrees(gps_info["GPSLatitude"])
            if lat is not None and gps_info["GPSLatitudeRef"] != "N":
                lat = -lat
                
        if "GPSLongitude" in gps_info and "GPSLongitudeRef" in gps_info:
            lon = convert_to_degrees(gps_info["GPSLongitude"])
            if lon is not None and gps_info["GPSLongitudeRef"] != "E":
                lon = -lon
                
        if lat and lon:
            return lat, lon
    return None, None

def get_address_from_mapbox(lat, lng):
    url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{lng},{lat}.json?access_token={MAPBOX_TOKEN}"
    try:
        res = requests.get(url)
        data = res.json()
        if "features" in data and len(data["features"]) > 0:
            return data["features"][0]["place_name"]
    except Exception as e:
        pass
    return None

def ingest_images():
    files_to_import = [
        r"C:\Users\genew\Downloads\irs w9 for planned parenthood\driveway paving new kent.jpg",
        r"C:\Users\genew\Downloads\irs w9 for planned parenthood\great big driveway paving photo.JPG",
        r"C:\Users\genew\Downloads\all-repos\spacexgeminijworden\public\cvs-asphalt-paving.jpg",
        r"C:\Users\genew\Downloads\all-repos\spacexgeminijworden\public\parking-lot-pave-richmond.jpg",
        r"C:\Users\genew\Downloads\all-repos\spacexgeminijworden\public\asphalt-paving-with-paver.jpg"
    ]
    
    for f in files_to_import:
        if not os.path.exists(f):
            print(f"Skipping missing file: {f}")
            continue
            
        filename = os.path.basename(f)
        mime_type, _ = mimetypes.guess_type(filename)
        if not mime_type:
            mime_type = "image/jpeg"
            
        print(f"\nProcessing {filename}...")
        
        # 1. Extract EXIF GPS
        job_name = "Imported Local Archive"
        description = "Recovered from local computer archive"
        lat, lon = None, None
        
        try:
            image = Image.open(f)
            exif_data = get_exif_data(image)
            lat, lon = get_lat_lon(exif_data)
        except Exception as e:
            print(f"  -> Failed to read EXIF: {e}")
            
        if lat and lon:
            print(f"  -> Found GPS Coordinates: {lat}, {lon}")
            address = get_address_from_mapbox(lat, lon)
            if address:
                print(f"  -> Mapbox Geocoded Address: {address}")
                job_name = address
                description = f"Imported photo from {address}. GPS: {lat}, {lon}"
            else:
                description = f"Imported photo. GPS: {lat}, {lon}"
        else:
            print("  -> No GPS data found in image.")
            # Fallback to guessing from filename
            if "new kent" in filename.lower():
                job_name = "New Kent Driveway Paving"
            elif "cvs" in filename.lower():
                job_name = "CVS Commercial Paving"
            elif "richmond" in filename.lower():
                job_name = "Richmond Parking Lot Paving"
        
        # 2. Base64 Encode
        with open(f, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode("utf-8")
            data_uri = f"data:{mime_type};base64,{encoded_string}"
            
        # 3. Save to DB
        img = GalleryImage(
            id=str(uuid.uuid4()),
            filename=filename,
            job_name=job_name,
            description=description,
            mime_type=mime_type,
            data_uri=data_uri,
            uploaded_at=datetime.utcnow()
        )
        session.add(img)
        print(f"  -> Inserted into Gallery as '{job_name}'")
        
    session.commit()
    print("\nSuccessfully processed and imported all images!")

if __name__ == "__main__":
    ingest_images()
