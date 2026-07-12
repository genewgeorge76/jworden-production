"""Gallery — job photo upload, list, delete. Local filesystem + S3."""
from __future__ import annotations

import mimetypes
import os
import uuid
from pathlib import Path

import boto3
from botocore.exceptions import ClientError
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from ..config import settings
from ..core.security import verify_premium_security
from ..database import get_db
from ..models import GalleryImage

router = APIRouter(prefix='/gallery', tags=['gallery'])

ALLOWED_TYPES = {'image/jpeg', 'image/png', 'image/webp', 'image/gif'}
MAX_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB


def _s3_client():
    if not settings.s3_bucket:
        return None
    return boto3.client(
        's3',
        region_name=settings.s3_region,
        aws_access_key_id=settings.aws_access_key_id or None,
        aws_secret_access_key=settings.aws_secret_access_key or None,
    )


def _upload_to_s3(data: bytes, key: str, content_type: str) -> str:
    client = _s3_client()
    client.put_object(
        Bucket=settings.s3_bucket,
        Key=key,
        Body=data,
        ContentType=content_type,
        ACL='public-read',
    )
    return f'https://{settings.s3_bucket}.s3.{settings.s3_region}.amazonaws.com/{key}'


def _save_local(data: bytes, filename: str) -> str:
    storage = Path(settings.gallery_storage_path)
    storage.mkdir(parents=True, exist_ok=True)
    dest = storage / filename
    dest.write_bytes(data)
    return str(dest)


@router.post('/upload', dependencies=[Depends(verify_premium_security)])
async def upload_photo(
    file: UploadFile = File(...),
    caption: str | None = Form(None),
    project_type: str | None = Form(None),
    city: str | None = Form(None),
    state_code: str | None = Form(None),
    is_before: bool | None = Form(None),
    is_featured: bool = Form(False),
    db: Session = Depends(get_db),
):
    content_type = file.content_type or mimetypes.guess_type(file.filename or '')[0] or ''
    if content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=422, detail=f'File type not allowed: {content_type}')

    data = await file.read()
    if len(data) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=413, detail='File exceeds 20 MB limit')

    ext = Path(file.filename or 'photo.jpg').suffix.lower() or '.jpg'
    unique_name = f'{uuid.uuid4().hex}{ext}'
    s3_key = f'gallery/{unique_name}'

    if settings.s3_bucket:
        url = _upload_to_s3(data, s3_key, content_type)
        storage_path = s3_key
        storage_type = 's3'
    else:
        local_path = _save_local(data, unique_name)
        url = f'/gallery/files/{unique_name}'
        storage_path = local_path
        storage_type = 'local'

    img = GalleryImage(
        filename=unique_name,
        original_filename=file.filename,
        storage_path=storage_path,
        storage_type=storage_type,
        url=url,
        caption=caption,
        project_type=project_type,
        city=city,
        state_code=state_code,
        is_before=is_before,
        is_featured=is_featured,
        is_public=True,
    )
    db.add(img)
    db.commit()
    db.refresh(img)
    return {
        'id': img.id,
        'url': img.url,
        'filename': img.filename,
        'caption': img.caption,
        'project_type': img.project_type,
        'city': img.city,
        'state_code': img.state_code,
        'storage_type': img.storage_type,
        'created_at': img.created_at.isoformat(),
    }


@router.get('/', dependencies=[Depends(verify_premium_security)])
async def list_photos(
    project_type: str | None = None,
    state_code: str | None = None,
    is_featured: bool | None = None,
    is_public: bool | None = None,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    q = db.query(GalleryImage)
    if project_type:
        q = q.filter(GalleryImage.project_type == project_type)
    if state_code:
        q = q.filter(GalleryImage.state_code == state_code.upper())
    if is_featured is not None:
        q = q.filter(GalleryImage.is_featured == is_featured)
    if is_public is not None:
        q = q.filter(GalleryImage.is_public == is_public)
    images = q.order_by(GalleryImage.sort_order, GalleryImage.created_at.desc()).limit(limit).all()
    return {
        'images': [
            {'id': i.id, 'url': i.url, 'filename': i.filename,
             'caption': i.caption, 'project_type': i.project_type,
             'city': i.city, 'state_code': i.state_code,
             'is_before': i.is_before, 'is_featured': i.is_featured,
             'created_at': i.created_at.isoformat()}
            for i in images
        ],
        'total': len(images),
    }


@router.delete('/{image_id}', dependencies=[Depends(verify_premium_security)])
async def delete_photo(image_id: int, db: Session = Depends(get_db)):
    img = db.query(GalleryImage).filter(GalleryImage.id == image_id).first()
    if not img:
        raise HTTPException(status_code=404, detail='Image not found')

    if img.storage_type == 's3' and img.storage_path:
        try:
            client = _s3_client()
            if client:
                client.delete_object(Bucket=settings.s3_bucket, Key=img.storage_path)
        except ClientError:
            pass
    elif img.storage_type == 'local' and img.storage_path and os.path.exists(img.storage_path):
        try:
            os.remove(img.storage_path)
        except OSError:
            pass

    db.delete(img)
    db.commit()
    return {'deleted': image_id}
