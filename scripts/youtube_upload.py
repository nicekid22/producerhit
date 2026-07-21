#!/usr/bin/env python3
"""
YouTube Upload Script for ProducerHit
Uploads video files to YouTube using OAuth2
"""

import os
import sys
import json
import time
import httpx
from pathlib import Path
from datetime import datetime

# Load environment
ENV_PATH = r"C:\Users\dylar\Documents\ProducerKit AI - Cursor 2\.env"
with open(ENV_PATH, 'r') as f:
    for line in f:
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            key, val = line.split('=', 1)
            os.environ[key.strip()] = val.strip()

# YouTube OAuth2 credentials
YOUTUBE_CLIENT_ID = os.environ.get('YOUTUBE_CLIENT_ID')
YOUTUBE_CLIENT_SECRET = os.environ.get('YOUTUBE_CLIENT_SECRET')
YOUTUBE_REFRESH_TOKEN = os.environ.get('YOUTUBE_REFRESH_TOKEN')

YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"
YOUTUBE_UPLOAD_URL = "https://www.googleapis.com/upload/youtube/v3/videos"

def get_access_token():
    """Get fresh access token using refresh token"""
    print("🔑 Getting access token...")
    
    data = {
        "client_id": YOUTUBE_CLIENT_ID,
        "client_secret": YOUTUBE_CLIENT_SECRET,
        "refresh_token": YOUTUBE_REFRESH_TOKEN,
        "grant_type": "refresh_token"
    }
    
    with httpx.Client() as client:
        resp = client.post("https://oauth2.googleapis.com/token", data=data, timeout=30)
        resp.raise_for_status()
        token_data = resp.json()
        
        access_token = token_data.get("access_token")
        if not access_token:
            raise Exception("No access token received")
        
        print(f"  ✅ Access token obtained (expires in {token_data.get('expires_in', '?')}s)")
        return access_token

def upload_video(video_path: str, title: str, description: str, tags: list, category_id: str = "10"):
    """Upload video to YouTube"""
    print(f"📤 Uploading video: {video_path}")
    
    access_token = get_access_token()
    
    # Video metadata
    metadata = {
        "snippet": {
            "title": title,
            "description": description,
            "tags": tags,
            "categoryId": category_id,
            "defaultLanguage": "fr",
            "defaultAudioLanguage": "fr"
        },
        "status": {
            "privacyStatus": "public",
            "selfDeclaredMadeForKids": False,
            "embeddable": True,
            "publicStatsViewable": True
        }
    }
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "video/mp4"
    }
    
    # Upload in chunks
    file_size = os.path.getsize(video_path)
    print(f"  📦 File size: {file_size / (1024*1024):.1f} MB")
    
    with httpx.Client() as client:
        # Initialize resumable upload
        init_headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json; charset=UTF-8",
            "X-Upload-Content-Type": "video/mp4",
            "X-Upload-Content-Length": str(file_size)
        }
        
        init_resp = client.post(
            f"{YOUTUBE_UPLOAD_URL}?uploadType=resumable&part=snippet,status",
            headers=init_headers,
            json=metadata,
            timeout=30
        )
        init_resp.raise_for_status()
        
        upload_url = init_resp.headers.get("Location")
        if not upload_url:
            raise Exception("No upload URL received")
        
        print(f"  🔗 Upload URL obtained")
        
        # Upload file
        with open(video_path, "rb") as f:
            upload_resp = client.put(
                upload_url,
                headers={"Content-Type": "video/mp4"},
                content=f,
                timeout=300
            )
            upload_resp.raise_for_status()
            
            result = upload_resp.json()
            video_id = result.get("id")
            
            if not video_id:
                raise Exception("No video ID in response")
            
            video_url = f"https://www.youtube.com/watch?v={video_id}"
            print(f"  ✅ Video uploaded: {video_url}")
            
            return {
                "video_id": video_id,
                "url": video_url,
                "title": title
            }

def main():
    if len(sys.argv) < 2:
        print("Usage: python youtube_upload.py <video_path> [title] [description]")
        sys.exit(1)
    
    video_path = sys.argv[1]
    title = sys.argv[2] if len(sys.argv) > 2 else "ProducerHit - Nouvelle Vidéo"
    description = sys.argv[3] if len(sys.argv) > 3 else "Vidéo générée par ProducerHit 🎵\n\nhttps://www.producerhit.com"
    
    if not os.path.exists(video_path):
        print(f"❌ Video not found: {video_path}")
        sys.exit(1)
    
    tags = ["producerhit", "music", "ai", "producer", "beat", "karaoke", "storytelling"]
    
    try:
        result = upload_video(video_path, title, description, tags)
        print(f"\n✅ Upload successful!")
        print(f"URL: {result['url']}")
        
        # Save result
        result_path = Path("youtube_upload_result.json")
        with open(result_path, "w") as f:
            json.dump(result, f, indent=2)
        
    except Exception as e:
        print(f"❌ Upload failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
