'use client';
import React, { useEffect, useState } from 'react'
import { userAgent } from 'next/server';

interface track {
  trackId: number | null
  instrumentName: string | undefined
}

interface Score {
  id: number;
  userId: number;
  trackId: number;
  createdAt: string;
  instrument: string;
  value: number;
  hits: number;
  total: number;
  user: {
    id: number;
    username: string;
  };
};

export default function LeaderboardPanel({trackId, instrumentName}: track) {
    const [scores, setScores] = useState<Score[]>([]);

    const fetchScores = async () => {
        try {
            const res = await fetch(`/api/scoresAll?trackId=${trackId}&instrument=${instrumentName}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await res.json();

            if (res.ok) {
                setScores(data.scores.slice(0, 5));
                console.log(JSON.stringify(scores));
            }
        }
        catch (error) {
            console.error('Failed to fetch leaderboard:', error);
        }
    }

    useEffect(() => {
        if (trackId && instrumentName) {
            fetchScores();
        }
    }, [trackId, instrumentName]);

    return (
        <div style={{padding: 12, background: '#fff', color: '#111', borderRadius: 6, boxShadow: '0 6px 18px rgba(0,0,0,0.15)', minWidth: 175}}>
            {scores.map(
                ((score: Score, i) => (
                    <div style={{display: 'flex', alignItems: 'left'}} key={score.id}>
                    <div style={{margin: '0 12px', fontSize: '36px'}}>{i+1}</div>
                    <div style={{margin: '0 12px'}}>
                        <div style={{fontSize: '16px'}}>{score.user.username}</div>
                        <div style={{fontSize: '12px'}}>{score.value}</div>
                    </div>
                </div>
                ))
            )}
        </div>
    );
}