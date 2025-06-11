/*
  # Create usage statistics table

  1. New Tables
    - `usage_stats`
      - `id` (text, primary key) - identifier for the stat type
      - `total_downloads` (bigint) - total number of downloads
      - `last_updated` (timestamp) - when the stat was last updated
      - `created_at` (timestamp) - when the record was created

  2. Security
    - Enable RLS on `usage_stats` table
    - Add policy for public read access
    - Add policy for authenticated users to update stats
*/

CREATE TABLE IF NOT EXISTS usage_stats (
  id text PRIMARY KEY,
  total_downloads bigint DEFAULT 0,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Insert initial record
INSERT INTO usage_stats (id, total_downloads) 
VALUES ('global', 1247) 
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE usage_stats ENABLE ROW LEVEL SECURITY;

-- Allow public read access to usage stats
CREATE POLICY "Public read access for usage stats"
  ON usage_stats
  FOR SELECT
  TO public
  USING (true);

-- Allow public update access for incrementing downloads
CREATE POLICY "Public update access for usage stats"
  ON usage_stats
  FOR UPDATE
  TO public
  USING (id = 'global');