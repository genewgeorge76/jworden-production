import React, { useEffect } from 'react';
import { AIPhotoInspector } from '../components/AIPhotoInspector';

export function PhotoInspectPage() {
  useEffect(() => {
    document.title = 'AI Photo Inspector | J. Worden & Sons';
  }, []);

  return (
    <div className="bg-zinc-950 min-h-screen">
      <AIPhotoInspector />
    </div>
  );
}
