import React, { useEffect, useRef } from 'react';
import './BackgroundVideo.css';

/**
 * BackgroundVideo Component
 * 
 * Provides a responsive, seamless background video layer:
 * - morning-scene.mp4 for the light/bright theme
 * - evening-scene.mp4 for the dark theme
 * - Crossfades smoothly between themes without reloading or flashing
 * - Stays behind all UI elements (z-index: 0, pointer-events: none)
 * - Autoplays, loops, and remains muted with mobile playsInline support
 */
export default function BackgroundVideo({ theme = 'light' }) {
  const morningVideoRef = useRef(null);
  const eveningVideoRef = useRef(null);

  // Ensure autoplay works reliably across browsers and theme switches
  useEffect(() => {
    const playVideo = (ref) => {
      if (ref.current) {
        ref.current.muted = true;
        const playPromise = ref.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Autoplay policy fallback: silent catch to avoid unhandled rejections
          });
        }
      }
    };

    if (theme === 'light') {
      playVideo(morningVideoRef);
    } else {
      playVideo(eveningVideoRef);
    }
  }, [theme]);

  // Initial playback start for both to keep buffer ready for instant crossfade
  useEffect(() => {
    const startInitialPlayback = () => {
      [morningVideoRef, eveningVideoRef].forEach((ref) => {
        if (ref.current) {
          ref.current.muted = true;
          const promise = ref.current.play();
          if (promise !== undefined) {
            promise.catch(() => {});
          }
        }
      });
    };

    startInitialPlayback();
  }, []);

  return (
    <div className="bg-video-container" aria-hidden="true">
      {/* Light Theme Video (Morning Scene) */}
      <video
        ref={morningVideoRef}
        className={`bg-video ${theme === 'light' ? 'video-active' : 'video-inactive'}`}
        src="/morning-scene.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      />

      {/* Dark Theme Video (Evening Scene) */}
      <video
        ref={eveningVideoRef}
        className={`bg-video ${theme === 'dark' ? 'video-active' : 'video-inactive'}`}
        src="/evening-scene.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      />

      {/* Dynamic Ambient Readability Overlay */}
      <div className="bg-video-scrim" />
    </div>
  );
}
