'use client';
import React from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function ProfilePanel() {
  const { user, loading, logout } = useAuth();

  return (
    <div style={{ padding: 12, background: '#fff', color: '#111', borderRadius: 6, boxShadow: '0 6px 18px rgba(0,0,0,0.15)', minWidth: 300 }}>
      <h3 style={{ marginTop: 0 }}>My Profile</h3>
      
      {loading ? (
        <p>Loading...</p>
      ) : user ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Username</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{user.username}</div>
          </div>
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
        <p>Not logged in</p>
      )}
    </div>
  );
}
