import React, { useRef, useState } from 'react';

export default function TrainingVideoPlayer({ videoUrl, title, onComplete }) {
  const videoRef = useRef(null);
  const [maxTimeWatched, setMaxTimeWatched] = useState(0);
  const [completed, setCompleted] = useState(false);

  // Track the furthest point the user has watched normally
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const currentTime = videoRef.current.currentTime;
    if (currentTime > maxTimeWatched) {
      setMaxTimeWatched(currentTime);
    }
  };

  // Prevent skipping ahead
  const handleSeeking = () => {
    if (!videoRef.current) return;
    const currentTime = videoRef.current.currentTime;
    // If they try to drag the scrubber past the furthest they've watched (plus a 1s buffer), force them back
    if (currentTime > maxTimeWatched + 1) {
      videoRef.current.currentTime = maxTimeWatched;
    }
  };

  // When the video finishes
  const handleEnded = () => {
    setCompleted(true);
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-slate-800">{title}</h2>
      
      <div className="relative pt-[56.25%] bg-black rounded overflow-hidden shadow-inner">
        {/* 16:9 Aspect Ratio Container */}
        <video
          ref={videoRef}
          src={videoUrl}
          className="absolute top-0 left-0 w-full h-full"
          controls
          controlsList="nodownload noplaybackrate" // Hides download and speed controls
          disablePictureInPicture
          onTimeUpdate={handleTimeUpdate}
          onSeeking={handleSeeking}
          onEnded={handleEnded}
        >
          Your browser does not support the video tag.
        </video>
      </div>

      <div className="mt-4 p-4 bg-slate-50 border-l-4 border-amber-500 rounded text-sm text-slate-700 font-medium">
        <p>
          <strong className="text-amber-700 uppercase tracking-wide text-xs">Regulatory Compliance Notice:</strong><br/>
          Fast-forwarding is disabled on this training module. By law, you must watch this video in its entirety. The required certification exam will unlock automatically once playback is complete.
        </p>
      </div>

      {completed && (
        <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 font-semibold text-center">
          ✅ Video completed. You may now proceed to the certification exam.
        </div>
      )}
    </div>
  );
}
