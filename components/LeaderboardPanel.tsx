'use client';
import React, { useEffect, useState } from 'react'
import LeaderboardSlot from './LeaderboardSlot';
import { Score } from '@/app/generated/prisma';
import { userAgent } from 'next/server';

interface track {
  trackId: number | null
  instrumentName: string | undefined
}

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
        fetchScores();
    })

    return (
        <div style={{padding: 12, background: '#fff', color: '#111', borderRadius: 6, boxShadow: '0 6px 18px rgba(0,0,0,0.15)', minWidth: 175}}>
            {scores.map(
                ((score: Score, i) => (
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'left'}}>
                    <div style={{margin: '0 12px', fontSize: '36px'}}>{i}</div>
                    <div style={{margin: '0 12px'}}>
                        <div style={{fontSize: '16px'}}>My Name</div>
                        <div style={{fontSize: '12px'}}>My Score</div>
                    </div>
                </div>
                ))
            )}
        </div>
    );
}