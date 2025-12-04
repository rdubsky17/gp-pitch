'use client';
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function ProfilePanel() {
  const { user, loading, logout } = useAuth();
  const uploadSong = () => {
    alert("this will open a pop up window(maybe) to upload a song");
  };
  const viewScores = () => {
    alert("this will open a pop up window(maybe) to view your scores");
  };

  return (
    <div style={{ padding: 12, background: '#fff', color: '#111', borderRadius: 6, boxShadow: '0 6px 18px rgba(0,0,0,0.15)', minWidth: 300 }}>
      
      {loading ? (
        <p>Loading...</p>
      ) : user ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{fontWeight: 700, textAlign: 'center', fontSize: 20, paddingTop: 10}}>Hello, {user.username}!</div>
          </div>
          <button 
            onClick={viewScores}
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
          >
            View Your Scores
          </button>
          <button 
            onClick={uploadSong}
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
          >
            Upload Song
          </button>
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
  );
}
