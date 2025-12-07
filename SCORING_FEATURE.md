# Score Saving Feature

## Overview
The app now automatically saves scores to the database when a song completes successfully without interruption.

## How It Works

### 1. Validity Tracking
The system tracks whether a play session is valid by monitoring:
- ✓ Play was started
- ✗ No pauses during playback
- ✗ No manual stops
- ✗ No instrument/track changes

### 2. Song Completion Detection
When alphaTab's `playerFinished` event fires, the system:
1. Checks if the play session was valid
2. Calculates the percentage score (hits/total × 100)
3. Records the duration
4. Saves to the database via `/api/scores`

### 3. Database Schema
Each saved score includes:
- `userId` - Who played
- `trackId` - Which song (mapped from file path)
- `instrument` - Which track/instrument
- `value` - Percentage score (0-100)
- `hits` - Number of notes hit correctly
- `total` - Total notes in the song
- `duration` - How long the playback lasted (seconds)
- `createdAt` - When the score was achieved

## API Endpoints

### POST `/api/scores`
Save a new score (requires authentication).

**Request:**
```json
{
  "trackId": 3,
  "instrument": "Bass",
  "value": 85,
  "hits": 120,
  "total": 141,
  "duration": 180.5
}
```

**Response:**
```json
{
  "success": true,
  "score": { /* saved score object */ }
}
```

### GET `/api/scores?trackId=3`
Retrieve user's scores (requires authentication).

**Response:**
```json
{
  "scores": [
    {
      "id": 1,
      "value": 85,
      "hits": 120,
      "total": 141,
      "duration": 180.5,
      "instrument": "Bass",
      "createdAt": "2025-11-30T...",
      "track": {
        "id": 3,
        "songName": "Aeroplane",
        "artist": "Red Hot Chili Peppers"
      }
    }
  ]
}
```

## Track ID Mapping
Songs are mapped to track IDs in the database:

| File | Track ID | Song | Artist |
|------|----------|------|--------|
| `Gorillaz-Feel Good Inc.-09-23-2025.gp` | 1 | Feel Good Inc. | Gorillaz |
| `Muse-Hysteria-09-20-2025.gp` | 2 | Hysteria | Muse |
| `Red Hot Chili Peppers-Aeroplane-09-11-2025.gp` | 3 | Aeroplane | Red Hot Chili Peppers |
| `Travis Scott-Sicko Mode-12-11-2024.gp` | 4 | SICKO MODE | Travis Scott |
| `Fortnite-OG Lobby Theme-12-07-2024.gp` | 5 | OG Lobby Theme | Fortnite |
| `DaBaby feat. Roddy Ricch-Rockstar-08-01-2025.gp` | 6 | Rockstar | DaBaby feat. Roddy Ricch |

## Testing

1. **Start the dev server:** `npm run dev`
2. **Login** with admin credentials (admin@admin.com / adminadmin)
3. **Play a song** from start to finish without pausing/stopping
4. **Watch for the green toast** notification: "✓ Score saved: XX%"
5. **Check the database:** Scores are saved in the `Score` table
6. **Test invalid plays:** Try pausing or stopping mid-song - no score should be saved

## Files Modified/Created

### Core Logic
- `components/usePitchScorer.ts` - Added validity tracking
- `components/TabViewer.tsx` - Added playerFinished event + data emission
- `hooks/useScoreSaver.ts` - NEW: Handles score persistence logic

### API
- `app/api/scores/route.ts` - NEW: POST/GET endpoints for scores

### Database
- `prisma/schema.prisma` - Updated Score model with metadata fields
- `seed.ts` - Added track seeding

### UI
- `components/ScoreSavedToast.tsx` - NEW: Success feedback
- `app/dashboard/DashboardClient.tsx` - Integrated score saver + toast

## Future Enhancements
- Add a leaderboard UI
- Show score history per song
- Add difficulty multipliers
- Track streaks and achievements
