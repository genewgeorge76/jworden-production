import React, { useEffect, useRef, useState } from 'react';
import { Camera, Upload, X, ChevronDown } from 'lucide-react';

interface GalleryPhoto {
  id: number;
  url: string;
  filename: string;
  caption: string | null;
  project_type: string | null;
  city: string | null;
  state_code: string | null;
  is_before: boolean | null;
  is_featured: boolean;
  created_at: string;
}

const PROJECT_TYPES = [
  'Asphalt Paving', 'Sealcoating', 'Crack Filling', 'Parking Lot',
  'Driveway', 'Road Construction', 'Resurfacing', 'Line Striping',
];

export function GalleryPage() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<GalleryPhoto | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const apiBase = import.meta.env.VITE_API_BASE_URL || '';

  useEffect(() => {
    document.title = 'Project Gallery | J. Worden & Sons';
  }, []);

  const load = (type?: string) => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '100', is_public: 'true' });
    if (type) params.set('project_type', type);
    fetch(`${apiBase}/api/v1/gallery/?${params}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setPhotos(d.images || []))
      .catch(() => setPhotos([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(filterType || undefined); }, [filterType]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const masterKey = prompt('Enter master key to upload:');
    if (!masterKey) return;
    setUploading(true);
    setUploadMsg(null);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const r = await fetch(`${apiBase}/api/v1/gallery/upload`, {
        method: 'POST',
        headers: { 'X-Master-Key': masterKey },
        body: fd,
      });
      if (r.ok) {
        setUploadMsg('Photo uploaded!');
        load(filterType || undefined);
      } else {
        setUploadMsg('Upload failed.');
      }
    } catch {
      setUploadMsg('Upload error.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="bg-zinc-950 min-h-screen py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 text-yellow-400 text-xs font-semibold mb-3">
              <Camera size={12} /> Project Gallery
            </div>
            <h1 className="text-3xl font-black text-white mb-2">Our Work</h1>
            <p className="text-zinc-400 text-sm max-w-xl">
              Browse completed asphalt paving, sealcoating, and construction projects across Virginia.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter */}
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="appearance-none bg-zinc-900 border border-zinc-700 text-white text-sm rounded-lg px-4 py-2 pr-8 focus:outline-none focus:border-yellow-500"
              >
                <option value="">All Projects</option>
                {PROJECT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            </div>
            {/* Upload trigger */}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <Upload size={14} />
              {uploading ? 'Uploading…' : 'Upload Photo'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </div>
        </div>

        {uploadMsg && (
          <div className={`mb-6 px-4 py-3 rounded-lg text-sm font-medium ${uploadMsg.includes('!') ? 'bg-green-900/50 text-green-300 border border-green-700' : 'bg-red-900/50 text-red-300 border border-red-700'}`}>
            {uploadMsg}
          </div>
        )}

        {/* Masonry grid */}
        {loading ? (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-zinc-900 rounded-xl animate-pulse" style={{ height: `${140 + (i % 3) * 60}px` }} />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-20">
            <Camera size={48} className="mx-auto text-zinc-700 mb-4" />
            <p className="text-zinc-500 text-sm">No photos yet. Upload the first project photo.</p>
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="break-inside-avoid cursor-pointer group relative rounded-xl overflow-hidden border border-zinc-800 hover:border-yellow-500/50 transition-all"
                onClick={() => setSelected(photo)}
              >
                <img
                  src={photo.url}
                  alt={photo.caption || photo.project_type || 'Project photo'}
                  className="w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                {photo.is_featured && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded">
                    Featured
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  {photo.caption && <p className="text-white text-xs font-medium line-clamp-2">{photo.caption}</p>}
                  {photo.city && <p className="text-zinc-400 text-[10px] mt-0.5">{photo.city}{photo.state_code ? `, ${photo.state_code}` : ''}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <button className="absolute top-4 right-4 text-white hover:text-yellow-400" onClick={() => setSelected(null)}>
            <X size={28} />
          </button>
          <div className="max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={selected.url} alt={selected.caption || ''} className="w-full max-h-[80vh] object-contain rounded-xl" />
            <div className="mt-3 text-center">
              {selected.caption && <p className="text-white text-sm font-medium">{selected.caption}</p>}
              <p className="text-zinc-500 text-xs mt-1">
                {[selected.project_type, selected.city, selected.state_code].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
