/*
  # Create increment downloads function

  1. Functions
    - `increment_downloads()` - Atomically increments the download counter and returns new value

  2. Security
    - Function is security definer to allow public access
    - Updates the global usage stats record
*/

CREATE OR REPLACE FUNCTION increment_downloads()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count bigint;
BEGIN
  -- Atomically increment and return new value
  UPDATE usage_stats 
  SET 
    total_downloads = total_downloads + 1,
    last_updated = now()
  WHERE id = 'global'
  RETURNING total_downloads INTO new_count;
  
  -- If no record exists, create it
  IF new_count IS NULL THEN
    INSERT INTO usage_stats (id, total_downloads)
    VALUES ('global', 1)
    RETURNING total_downloads INTO new_count;
  END IF;
  
  RETURN new_count;
END;
$$;

-- Grant execute permission to public
GRANT EXECUTE ON FUNCTION increment_downloads() TO public;