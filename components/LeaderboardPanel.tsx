'use client';
import React from 'react'
import LeaderboardSlot from './LeaderboardSlot';

export default function LeaderboardPanel() {
    return (
        <div style={{padding: 12, background: '#fff', color: '#111', borderRadius: 6, boxShadow: '0 6px 18px rgba(0,0,0,0.15)', minWidth: 175}}>
            <LeaderboardSlot data={1}/>
            <LeaderboardSlot data={2}/>
            <LeaderboardSlot data={3}/>
            <LeaderboardSlot data={4}/>
            <LeaderboardSlot data={5}/>
        </div>
    );
}