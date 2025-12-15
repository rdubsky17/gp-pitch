"use client";
import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import SettingsPanel from './SettingsPanel';
import ProfilePanel from './ProfilePanel';
import LeaderboardPanel from './LeaderboardPanel';

export default function TopRibbon() {
  const pathname = usePathname();
  const hideOnLogin = pathname === '/login' || pathname === '/signup' || pathname === '/reset-password';

  const [showSettings, setShowSettings] = useState(false);
  const [showSongModal, setShowSongModal] = useState(false);
  const [showInstruments, setShowInstruments] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [songTab, setSongTab] = useState<'library' | 'uploads'>('library');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const instrumentRef = useRef<HTMLDivElement | null>(null);
  const leaderRef = useRef<HTMLDivElement | null>(null);

  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('idle');
  const [freq, setFreq] = useState(0);
  const [scoreState, setScoreState] = useState<{ hits: number; total: number }>({ hits: 0, total: 0 });
  const [liveState, setLiveState] = useState<{ err: number; ok: boolean; target: number | null }>({ err: 0, ok: false, target: null });
  const [isPlaying, setIsPlaying] = useState(false);
  const [tracks, setTracks] = useState<Array<{ idx: number; name: string }>>([]);
  const [currentTrack, setCurrentTrack] = useState<number | null>(null);
  const [audioOn, setAudioOn] = useState(false);
  const [librarySongs, setLibrarySongs] = useState<Array<{ id: number; songName: string; artist: string; filePath: string; isUserUpload: boolean }>>([]);
  const [userUploads, setUserUploads] = useState<Array<{ id: number; songName: string; artist: string; filePath: string }>>([]);
  const [currentTrackId, setCurrentTrackId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [currentFile, setCurrentFile] = useState<string>('');

  // Listen for pitch status events from PitchMeter
  // Re-run when `hideOnLogin` changes so listeners are attached after navigation
  useEffect(() => {
    if (hideOnLogin) return;
    const onStatus = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      setRunning(Boolean(d.running));
      setStatus(typeof d.status === 'string' ? d.status : '');
      setFreq(typeof d.freq === 'number' ? d.freq : 0);
    };
    window.addEventListener('pitch-status', onStatus as EventListener);
    const onTab = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      if (d.score) setScoreState(d.score);
      if (d.live) setLiveState(d.live);
      if (typeof d.isPlaying === 'boolean') setIsPlaying(d.isPlaying);
      if (Array.isArray(d.tracks)) setTracks(d.tracks);
      if (typeof d.trackIdx === 'number') setCurrentTrack(d.trackIdx);
      if (typeof d.currentFile === 'string') setCurrentFile(d.currentFile);
    };
    window.addEventListener('tab-status', onTab as EventListener);
    // fetch all tracks from database
    (async () => {
      try {
        const res = await fetch('/api/tracks');
        if (res.ok) {
          const data = await res.json();
          const allTracks = Array.isArray(data.tracks) ? data.tracks : [];
          // Separate library songs from user uploads
          setLibrarySongs(allTracks.filter((t: any) => !t.isUserUpload));
        }
      } catch (e) {
        console.warn('Failed to load tracks', e);
      }
    })();
    return () => {
      window.removeEventListener('pitch-status', onStatus as EventListener);
      window.removeEventListener('tab-status', onTab as EventListener);
    };
  }, [hideOnLogin]);

  // Fetch user uploads when uploads tab is opened
  useEffect(() => {
    if (showSongModal && songTab === 'uploads') {
      fetchUserUploads();
    }
  }, [showSongModal, songTab]);

  const fetchUserUploads = async () => {
    try {
      const res = await fetch('/api/uploads');
      if (res.ok) {
        const data = await res.json();
        setUserUploads(data.tracks || []);
      }
    } catch (error) {
      console.error('Failed to fetch uploads:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 200KB)
    if (file.size > 200 * 1024) {
      setUploadError('File too large. Maximum size is 200KB.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Check upload limit (max 5 songs)
    if (userUploads.length >= 5) {
      setUploadError('Upload limit reached. Maximum 5 songs allowed.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('songName', file.name.replace(/\.[^/.]+$/, '')); // remove extension
      formData.append('artist', 'Unknown Artist');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Refresh uploads list
      await fetchUserUploads();
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      setUploadError(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteUpload = async (trackId: number) => {
    if (!confirm('Are you sure you want to delete this song?')) return;

    try {
      const res = await fetch(`/api/uploads?id=${trackId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchUserUploads();
      }
    } catch (error) {
      console.error('Failed to delete upload:', error);
    }
  };

  useEffect(() => {
    if (hideOnLogin) return;

    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
      if (instrumentRef.current && !instrumentRef.current.contains(e.target as Node)) {
        setShowInstruments(false);
      }
      if (leaderRef.current && !leaderRef.current.contains(e.target as Node)) {
        setShowLeaderboard(false);
      }
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, [hideOnLogin]);

  // If we're on the login page, don't render anything (hooks ran but effects were noop)
  if (hideOnLogin) return null;

  return (
    <>
      <div style={{ height: 'var(--top-ribbon-h, 50px)' }} />
      <div style={{ position: 'fixed', left: 0, right: 0, top: 0, zIndex: 1100, background: 'black', color: '#fff', boxShadow: '0 8px 24px rgba(2,6,23,0.6)', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minHeight: '50px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, zIndex: 1200, flexShrink: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: 0.6, background: 'linear-gradient(135deg,#6ee7b7,#3b82f6)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', whiteSpace: 'nowrap'}}>Guitar Tabs</div>

          {/* Song selection button - opens centered modal */}
          <button 
            onClick={() => setShowSongModal(true)} 
            style={{ 
              padding: '8px 12px', 
              borderRadius: 10, 
              background: 'rgba(255, 255, 255, 0.1)', 
              backdropFilter: 'blur(10px)',
              color: '#fff', 
              border: '1px solid rgba(255, 255, 255, 0.2)', 
              fontSize: 13, 
              fontWeight: 600, 
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Songs
          </button>

          {/* Instrument selection dropdown (mimics song selection style) */}
          <div style={{ position: 'relative' }} ref={instrumentRef}>
            <button 
              onClick={() => setShowInstruments(v => !v)} 
              style={{ 
                padding: '8px 12px', 
                borderRadius: 10, 
                background: 'rgba(255, 255, 255, 0.1)', 
                backdropFilter: 'blur(10px)',
                color: '#fff', 
                border: '1px solid rgba(255, 255, 255, 0.2)', 
                fontSize: 13, 
                fontWeight: 600, 
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                maxWidth: '150px',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {currentTrack !== null && tracks.length > 0 
                ? tracks.find(t => t.idx === currentTrack)?.name || 'Instrument'
                : 'Instrument'}
            </button>
            {showInstruments && (
              <div style={{ position: 'absolute', left: 0, top: 'calc(100% + 8px)', background: '#fff', color: '#111', borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.15)', minWidth: 200, maxHeight: 300, overflow: 'auto', zIndex: 1300 }}>
                {tracks.length === 0 ? (
                  <div style={{ padding: 12, color: '#666', fontSize: 13 }}>No instruments available</div>
                ) : (
                  tracks.map(t => (
                    <div 
                      key={t.idx} 
                      style={{ 
                        padding: '10px 14px', 
                        cursor: 'pointer', 
                        fontSize: 13,
                        background: currentTrack === t.idx ? '#f3f4f6' : 'transparent',
                        fontWeight: currentTrack === t.idx ? 600 : 400,
                        borderBottom: '1px solid #f3f4f6'
                      }}
                      onClick={() => {
                        setCurrentTrack(t.idx);
                        window.dispatchEvent(new CustomEvent('select-track', { detail: { idx: t.idx } }));
                        setShowInstruments(false);
                      }}
                    >
                      {t.name}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Score + Intonation - now using flex instead of absolute positioning */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#fff', fontSize: 13, flex: '1 1 auto', justifyContent: 'center', minWidth: 0 }}>
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.1)', 
            backdropFilter: 'blur(10px)',
            padding: '8px 12px', 
            borderRadius: 10, 
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap'
          }}>
            <strong style={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600 }}>Score:</strong>
            <span style={{ 
              fontVariantNumeric: 'tabular-nums', 
              fontSize: 14, 
              fontWeight: 700,
              color: '#fff'
            }}>{scoreState.hits}/{scoreState.total}</span>
            <span style={{ 
              fontSize: 11, 
              color: 'rgba(255, 255, 255, 0.6)'
            }}>({scoreState.total > 0 ? Math.round((scoreState.hits / scoreState.total) * 100) : 0}%)</span>
          </div>
          <div style={{ 
            background: liveState.ok ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', 
            backdropFilter: 'blur(10px)',
            padding: '8px 12px', 
            borderRadius: 10, 
            border: `1px solid ${liveState.ok ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap'
          }}>
            <strong style={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600 }}>Intonation:</strong>
            {liveState.target !== null && (
              <>
                <span style={{ 
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: 14,
                  fontWeight: 700,
                  color: liveState.ok ? '#10b981' : '#ef4444',
                  display: 'inline-block',
                  minWidth: '40px',
                  textAlign: 'right'
                }}>{liveState.err > 0 ? '+' : ''}{Math.round(liveState.err)}</span>
                <span style={{ 
                  fontSize: 13, 
                  color: 'rgba(255, 255, 255, 0.7)'
                }}>cents</span>
              </>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center', zIndex: 1200, flexShrink: 0 }}>
          {/* Transport + audio toggle: Start/Stop -> Pause -> Audio */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              onClick={() => {
                const shouldStop = Boolean(isPlaying);
                if (shouldStop) {
                  window.dispatchEvent(new CustomEvent('stop-alpha'));
                  window.dispatchEvent(new CustomEvent('stop-pitch-meter'));
                } else {
                  window.dispatchEvent(new CustomEvent('start-pitch-meter'));
                  window.dispatchEvent(new CustomEvent('play-alpha'));
                }
              }}
              aria-pressed={Boolean(isPlaying)}
              style={{ padding: '8px 12px', borderRadius: 10, background: isPlaying ? '#ef4444' : '#10b981', border: 'none', color: '#fff', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}
            >{isPlaying ? 'Stop' : 'Start'}</button>

            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('pause-alpha'))} 
              style={{ 
                padding: '8px 12px', 
                borderRadius: 10, 
                background: 'rgba(255, 255, 255, 0.1)', 
                backdropFilter: 'blur(10px)',
                color: '#fff', 
                border: '1px solid rgba(255, 255, 255, 0.2)', 
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 13,
                whiteSpace: 'nowrap'
              }}
            >Pause</button>
          </div>
          {/* keep settings/profile/leaderboard compact on the right side */}
          <div style={{ position: 'relative' }} ref={ref}>
            <button 
              onClick={() => setShowSettings(v => !v)} 
              aria-haspopup="true" 
              style={{ 
                padding: '8px 12px', 
                borderRadius: 10, 
                background: 'rgba(255, 255, 255, 0.1)', 
                backdropFilter: 'blur(10px)',
                color: '#fff', 
                border: '1px solid rgba(255, 255, 255, 0.2)', 
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 13,
                whiteSpace: 'nowrap'
              }}
            >Settings</button>
            {showSettings && (
              <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)' }}>
                <SettingsPanel />
              </div>
            )}
          </div>

          {/* Profile button */}
          <div style={{ position: 'relative' }} ref={profileRef}>
            <button 
              onClick={() => setShowProfile(v => !v)} 
              aria-haspopup="true" 
              style={{ 
                padding: '8px 12px', 
                borderRadius: 10, 
                background: 'rgba(255, 255, 255, 0.1)', 
                backdropFilter: 'blur(10px)',
                color: '#fff', 
                border: '1px solid rgba(255, 255, 255, 0.2)', 
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 13,
                whiteSpace: 'nowrap'
              }}
            >Profile</button>
            {showProfile && (
              <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 1300 }}>
                <ProfilePanel />
              </div>
            )}
          </div>
          <div style={{position: 'relative'}} ref={leaderRef}>
            <button 
              onClick={() => setShowLeaderboard(v => !v)} 
              aria-haspopup="true"
              style={{ 
                padding: '8px 12px', 
                borderRadius: 10, 
                background: 'rgba(255, 255, 255, 0.1)', 
                backdropFilter: 'blur(10px)',
                color: '#fff', 
                border: '1px solid rgba(255, 255, 255, 0.2)', 
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 13,
                whiteSpace: 'nowrap'
              }}
            >Leaderboard</button>
            {showLeaderboard && (
              <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 1300 }}>
                <LeaderboardPanel trackId={currentTrackId} instrumentName={tracks.find(t => t.idx === currentTrack)?.name}/>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Song Selection Modal (centered) */}
      {showSongModal && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              zIndex: 9998,
              animation: 'fadeIn 0.2s ease-out',
            }}
            onClick={() => setShowSongModal(false)}
          />

          {/* Modal */}
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: '#fff',
              borderRadius: 16,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              zIndex: 9999,
              width: '90%',
              maxWidth: 600,
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideUp 0.3s ease-out',
            }}
          >
            {/* Header */}
            <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#111' }}>Select a Song</h2>
                <button
                  onClick={() => setShowSongModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 24,
                    cursor: 'pointer',
                    color: '#666',
                    padding: 0,
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 6,
                  }}
                >
                  ×
                </button>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setSongTab('library')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: 'none',
                    background: songTab === 'library' ? '#3b82f6' : '#f3f4f6',
                    color: songTab === 'library' ? '#fff' : '#666',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Song Library
                </button>
                <button
                  onClick={() => setSongTab('uploads')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: 'none',
                    background: songTab === 'uploads' ? '#3b82f6' : '#f3f4f6',
                    color: songTab === 'uploads' ? '#fff' : '#666',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  My Uploads
                </button>
              </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 24px' }}>
              {songTab === 'library' ? (
                <div>
                  {librarySongs.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#666' }}>
                      <div style={{ fontSize: 48, marginBottom: 12 }}>🎵</div>
                      <div style={{ fontSize: 16 }}>No songs found</div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: 8, paddingTop: 16 }}>
                      {librarySongs.map((song) => (
                        <div
                          key={song.id}
                          style={{
                            padding: '16px 20px',
                            borderRadius: 10,
                            background: '#f9fafb',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            border: '2px solid transparent',
                          }}
                          onClick={() => {
                            setCurrentTrackId(song.id);
                            window.dispatchEvent(new CustomEvent('load-song', { 
                              detail: { 
                                url: song.filePath, 
                                trackId: song.id,
                                songName: song.songName,
                                artist: song.artist
                              } 
                            }));
                            setShowSongModal(false);
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#eff6ff';
                            e.currentTarget.style.borderColor = '#3b82f6';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#f9fafb';
                            e.currentTarget.style.borderColor = 'transparent';
                          }}
                        >
                          <div style={{ fontSize: 16, fontWeight: 600, color: '#111', marginBottom: 2 }}>
                            {song.songName}
                          </div>
                          <div style={{ fontSize: 13, color: '#666' }}>
                            {song.artist}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {/* Upload Button */}
                  <div style={{ padding: '16px 0', borderBottom: '1px solid #e5e7eb' }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".gp,.gp3,.gp4,.gp5,.gpx,.gtp"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                      disabled={uploading}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      style={{
                        width: '100%',
                        padding: '12px 20px',
                        borderRadius: 10,
                        background: uploading ? '#9ca3af' : '#3b82f6',
                        color: '#fff',
                        border: 'none',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: uploading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                      }}
                    >
                      {uploading ? 'Uploading...' : 'Upload Guitar Pro File'}
                    </button>
                    {uploadError && (
                      <div style={{ marginTop: 8, padding: '8px 12px', background: '#fee', color: '#c00', borderRadius: 6, fontSize: 13 }}>
                        {uploadError}
                      </div>
                    )}
                  </div>

                  {/* User Uploads List */}
                  {userUploads.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#666' }}>
                      <div style={{ fontSize: 16, marginBottom: 8 }}>No uploads yet</div>
                      <div style={{ fontSize: 13 }}>Upload your first Guitar Pro file to get started</div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: 8, paddingTop: 16 }}>
                      {userUploads.map((upload) => (
                        <div
                          key={upload.id}
                          style={{
                            padding: '16px 20px',
                            borderRadius: 10,
                            background: '#f9fafb',
                            border: '2px solid transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div
                            style={{ flex: 1, cursor: 'pointer' }}
                            onClick={() => {
                              setCurrentTrackId(upload.id);
                              window.dispatchEvent(new CustomEvent('load-song', { 
                                detail: { 
                                  url: upload.filePath, 
                                  trackId: upload.id,
                                  songName: upload.songName,
                                  artist: upload.artist
                                } 
                              }));
                              setShowSongModal(false);
                            }}
                          >
                            <div style={{ fontSize: 16, fontWeight: 600, color: '#111', marginBottom: 2 }}>
                              {upload.songName}
                            </div>
                            <div style={{ fontSize: 13, color: '#666' }}>
                              {upload.artist}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteUpload(upload.id);
                            }}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 6,
                              background: 'transparent',
                              border: '1px solid #ef4444',
                              color: '#ef4444',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <style jsx>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideUp {
              from {
                opacity: 0;
                transform: translate(-50%, -45%);
              }
              to {
                opacity: 1;
                transform: translate(-50%, -50%);
              }
            }
          `}</style>
        </>
      )}
    </>
  );
}
