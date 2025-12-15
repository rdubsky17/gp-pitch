'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

interface Track {
  id: number;
  songName: string;
  artist?: string;
  source: 'library' | 'upload';
};

interface Score {
  id: number;
  userId: number;
  trackId: number;
  createdAt: string;
  instrument: string;
  value: number;
  hits: number;
  total: number;
  track: {
    id: number;
    songName: string;
    artist: string;
  };
};

export default function ProfilePanel() {
  const { user, loading, logout } = useAuth();
  const [viewScoresModal, setViewScoresModal] = useState(false);
  const [scoresTab, setScoresTab] = useState<'lastScores' | 'scoresBySong'>('lastScores'); // for tabs in score modal

  const [scores, setScores] = useState<Score[]>([]); // scores for all songs
  const [tracks, setTracks] = useState<Track[]>([]); // for all user tracks including defaults

  const [songScores, setSongScores] = useState<Score[]>([]); // scores for one song
  const [selectedSong, setSelectedSong] = useState<number | null>(null); // id number of selected song

  // Fetch user scores when scores modal is opened
  useEffect(() => {
    if (viewScoresModal && scoresTab === 'lastScores') {
      fetchScores();
    }
  }, [viewScoresModal, scoresTab]);

  // Fetch user scores and store last 20 scores in "scores"
  const fetchScores = async () => {
    try {
      const res = await fetch('/api/scores');
      const data = await res.json();

      if (res.ok) {
        setScores(data.scores.slice(0, 20)); // last 20 scores
      }
    } 
    catch (error) {
      console.error('Failed to fetch scores:', error);
    }    
  };

  // Fetch user songs when "Scores by Song" tab is opened
  useEffect(() => {
    if (viewScoresModal && scoresTab === 'scoresBySong') {
      fetchUserSongs();
    }
  }, [viewScoresModal, scoresTab]);

  // Fetch user songs from database (both library and uploads)
  const fetchUserSongs = async () => {
    try {
      const res = await fetch('/api/tracks');
      
      if (res.ok) {
        const data = await res.json();
        const allTracks = data.tracks || [];
        
        // Map to Track format with source indication
        const mappedTracks = allTracks.map((t: any) => ({
          id: t.id,
          songName: t.songName,
          artist: t.artist,
          source: t.isUserUpload ? ('upload' as const) : ('library' as const),
        }));
        
        setTracks(mappedTracks);
      }
    } catch (error) {
      console.error('Failed to fetch tracks:', error);
    }
  };

  // Fetch scores for one selected song by trackId
  const fetchScoresForSong = async (trackId: number) => {
    try {
      const res = await fetch(`/api/scores?trackId=${trackId}`);
      const data = await res.json();
  
      if (res.ok) {
        setSongScores(data.scores || []);
      }
    } catch (err) {
      console.error('Failed to load song scores:', err);
    }
  };

  // Click on song handler (for better UI)
  const handleSongClick = (trackId: number) => {
    if (selectedSong === trackId) {
      setSelectedSong(null);
      setSongScores([]);
    } else {
      setSelectedSong(trackId);
      fetchScoresForSong(trackId);
    }
  }

  return (
    <>
    <div style={{ padding: 12, background: '#fff', color: '#111', 
                  borderRadius: 6, boxShadow: '0 6px 18px rgba(0,0,0,0.15)', 
                  minWidth: 300 }}>

    {loading ? (
        <p>Loading...</p>
      ) : user ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{fontWeight: 700, textAlign: 'center', fontSize: 20, paddingTop: 10}}>Hello, {user.username}!</div>
          </div>

          {/* View Scores button */}
          <button 
            onClick={() => setViewScoresModal(true)}
            style={{ 
              marginTop: 8, 
              padding: '8px 16px', 
              borderRadius: 6, 
              background: '#10b981', 
              color: '#fff', 
              border: 'none', 
              cursor: 'pointer',
              fontWeight: 600
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
          >
            View Your Scores
          </button>

          {/* Logout button */}
          <button 
            onClick={logout}
            style={{ 
              marginTop: 8, 
              padding: '8px 16px', 
              borderRadius: 6, 
              background: '#ef4444', 
              color: '#fff', 
              border: 'none', 
              cursor: 'pointer',
              fontWeight: 600
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
          >
            Logout
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>Guest Mode</div>
            <p>{"You're viewing as a guest. Sign in to save scores, track progress, and access all features."}</p>
            <Link
              href="/login"
              style={{
                flex: 1,
                padding: '8px 12px',
                color: 'blue',
                textAlign: 'center',
                fontSize: 13
              }}
            >
              Sign In
            </Link>
        </div>
      )}
    </div>

    {/* View Scores Modal (centered) */}
    {viewScoresModal && (
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
        onClick={() => setViewScoresModal(false)}
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
          maxWidth: 900,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp 0.3s ease-out',
        }}
      >
      {/* Header */}
      <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#111' }}>View Your Scores</h2>
          <button
            onClick={() => setViewScoresModal(false)}
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

        {/* Last Scores button */}
        <button
          onClick={() => setScoresTab('lastScores')}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: scoresTab === 'lastScores' ? '#3b82f6' : '#f3f4f6',
            color: scoresTab === 'lastScores' ? '#fff' : '#666',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Last Scores
        </button>

        {/* Scores by Songs button */}
        <button
          onClick={() => setScoresTab('scoresBySong')}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: scoresTab === 'scoresBySong' ? '#3b82f6' : '#f3f4f6',
            color: scoresTab === 'scoresBySong' ? '#fff' : '#666',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Scores by Song
        </button>

      </div>
    </div>

    {/* Content */}
    <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 24px' }}>
      {scoresTab === 'lastScores' ? (
        <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingTop: 16 }}>
        {scores.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#666' }}>
            No scores found
          </div>
        ) : (
          <table
            style={{
              width: '100%',
              color: '#000', 
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#f3f3f3' }}>
                <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>Song</th>
                <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>Artist</th>
                <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>Instrument</th>
                <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>Score</th>
                <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>Hits</th>
                <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((score, idx) => (
                <tr key={score.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{score.track.songName}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{score.track.artist}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{score.instrument}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{score.value}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{score.hits} / {score.total}</td>
                  <td style={{ padding: '8px', textAlign: 'center'}}>{new Date(score.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        </div>
      ) : 
      (
        <div>
          {tracks.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#666' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎵</div>
              <div style={{ fontSize: 16 }}>No songs found</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 8, paddingTop: 16 }}>
              {tracks.map(track => (
                <div key={`${track.source}-${track.id}`}>
                  {/* Song block */}
                  <div
                    onClick={() => handleSongClick(track.id) }
                    style={{
                      padding: '16px 20px',
                      borderRadius: 10,
                      background: '#f9fafb',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      border: '2px solid transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedSong !== track.id) {
                        e.currentTarget.style.background = '#f3f4f6';
                        e.currentTarget.style.borderColor = '#e5e7eb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedSong !== track.id) {
                        e.currentTarget.style.background = '#f9fafb';
                        e.currentTarget.style.borderColor = 'transparent';
                      }
                    }}
                  >
                  
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#111' }}>
                    {track.songName}
                  </div>
                </div>

                {/* Show table if this is the selected song */}
                {selectedSong === track.id && (
                  <div style={{ marginBottom: 20 }}>
                    {songScores.length === 0 ? (
                      <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>
                        No scores for this song
                      </div>
                      ) : (
                        <table style={{ width: '100%', color: '#000' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#f3f3f3' }}>
                              <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>Instrument</th>
                              <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>Score</th>
                              <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>Hits</th>
                              <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>Date</th>
                            </tr>
                          </thead>

                          <tbody>
                            {songScores.map(score => (
                              <tr key={score.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                                <td style={{ padding: '8px', textAlign: 'center' }}>{score.instrument}</td>
                                <td style={{ padding: '8px', textAlign: 'center' }}>{score.value}</td>
                                <td style={{ padding: '8px', textAlign: 'center' }}>{score.hits} / {score.total}</td>
                                <td style={{ padding: '8px', textAlign: 'center' }}>
                                  {new Date(score.createdAt).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
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
