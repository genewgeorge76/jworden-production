# Media Ingest CLI

CLI to pull work photos from Dropbox, Google Photos, or Google Drive and organize them into timestamp + location folders for gallery workflows.

## What it does

- Pulls media from Dropbox, Google Photos, Google Drive, or ingests from a local folder.
- Organizes files under:
  - `public/work/imported/YYYY/MM/DD/location-token/`
- Generates:
  - `public/work/imported/ingest-manifest.json`
  - `public/work/imported/project-import.json`

Use `project-import.json` to seed/update project gallery records.

## Actions

- `organize-local`
- `pull-dropbox`
- `pull-google-photos`
- `pull-google-drive`
- `check-setup`

## Examples

### 0) Verify setup first

`npm run media:doctor -- -Json`

### 1) Organize local image dump

`npm run media:ingest -- -Action organize-local -InputDir .\incoming\job-photos -Json`

### 2) Pull from Dropbox

`npm run media:dropbox -- -DropboxToken YOUR_DROPBOX_TOKEN -DropboxPath "/Work Photos" -MaxItems 500 -Json`

### 3) Pull from Google Photos (all library)

`npm run media:gphotos -- -GooglePhotosToken YOUR_GOOGLE_TOKEN -MaxItems 500 -Json`

### 4) Pull from Google Photos album

`npm run media:gphotos -- -GooglePhotosToken YOUR_GOOGLE_TOKEN -GoogleAlbumId YOUR_ALBUM_ID -MaxItems 300 -Json`

### 5) Pull from Google Drive

`npm run media:gdrive -- -GoogleDriveToken YOUR_GOOGLE_TOKEN -MaxItems 500 -Json`

### 6) Pull from one Google Drive folder

`npm run media:gdrive -- -GoogleDriveToken YOUR_GOOGLE_TOKEN -GoogleDriveFolderId YOUR_FOLDER_ID -MaxItems 500 -Json`

## Key options

- `-OutputRoot`: Defaults to `public/work/imported`
- `-ManifestFile`: Custom manifest path
- `-ExportProjectsJson`: Custom project import JSON path
- `-LocationKeywords`: Comma list used for location token matching
- `-IncludeVideos`: Include `.mp4/.mov/.m4v`
- `-DryRun`: Simulate without writing files

## Notes
## Environment variable names

- `DROPBOX_ACCESS_TOKEN`
- `DROPBOX_PATH`
- `GOOGLE_PHOTOS_ACCESS_TOKEN`
- `GOOGLE_PHOTOS_ALBUM_ID`
- `GOOGLE_DRIVE_ACCESS_TOKEN`
- `GOOGLE_DRIVE_FOLDER_ID`

- Dropbox requires a valid OAuth access token with file read scope.
- Google Photos requires an OAuth access token for Photos Library API.
- Google Drive requires an OAuth access token with Drive file read access. Use `GOOGLE_DRIVE_FOLDER_ID` to keep the import scoped to one work-photo folder.
- EXIF timestamp is used when available; otherwise file modified time is used.
- GPS EXIF is converted into a geo token when no keyword location match is found.
