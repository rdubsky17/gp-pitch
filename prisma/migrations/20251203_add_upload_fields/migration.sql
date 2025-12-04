-- Add new columns to Track table
ALTER TABLE Track ADD COLUMN filePath TEXT NOT NULL DEFAULT '';
ALTER TABLE Track ADD COLUMN isUserUpload INTEGER NOT NULL DEFAULT 0;
ALTER TABLE Track ADD COLUMN uploadedBy INTEGER;

-- Update existing tracks with file paths from songs.json
UPDATE Track SET filePath = '/songs/Gorillaz-Feel Good Inc.-09-23-2025.gp' WHERE id = 1;
UPDATE Track SET filePath = '/songs/Muse-Hysteria-09-20-2025.gp' WHERE id = 2;
UPDATE Track SET filePath = '/songs/Red Hot Chili Peppers-Aeroplane-09-11-2025.gp' WHERE id = 3;
UPDATE Track SET filePath = '/songs/Travis Scott-Sicko Mode-12-11-2024.gp' WHERE id = 4;
UPDATE Track SET filePath = '/songs/Fortnite-OG Lobby Theme-12-07-2024.gp' WHERE id = 5;
UPDATE Track SET filePath = '/songs/DaBaby feat. Roddy Ricch-Rockstar-08-01-2025.gp' WHERE id = 6;
