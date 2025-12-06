'use client';
import React from 'react';

interface place {
    data: number
}

export default function LeaderboardSlot({data}: place) {
    return (
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'left'}}>
            <div style={{margin: '0 12px', fontSize: '36px'}}>{data}</div>
            <div style={{margin: '0 12px'}}>
                <div style={{fontSize: '16px'}}>My Name</div>
                <div style={{fontSize: '12px'}}>My Score</div>
            </div>
        </div>
    );
}