-- Fix 1: Restrict profiles table to owner-only access
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;

CREATE POLICY "Authenticated users can view profiles"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Fix 2: Add UPDATE policy for media_assets
CREATE POLICY "Users can update own media"
ON media_assets FOR UPDATE
USING (auth.uid() = user_id);

-- Fix 3: Add database-level input validation constraints
ALTER TABLE projects 
  ADD CONSTRAINT title_not_empty CHECK (char_length(trim(title)) > 0),
  ADD CONSTRAINT title_max_length CHECK (char_length(title) <= 100),
  ADD CONSTRAINT description_max_length CHECK (description IS NULL OR char_length(description) <= 500);

ALTER TABLE characters
  ADD CONSTRAINT name_not_empty CHECK (char_length(trim(name)) > 0),
  ADD CONSTRAINT name_max_length CHECK (char_length(name) <= 100),
  ADD CONSTRAINT age_reasonable CHECK (age IS NULL OR (age >= 0 AND age <= 200));

ALTER TABLE episodes
  ADD CONSTRAINT title_not_empty CHECK (char_length(trim(title)) > 0),
  ADD CONSTRAINT title_max_length CHECK (char_length(title) <= 200),
  ADD CONSTRAINT episode_number_positive CHECK (episode_number > 0);