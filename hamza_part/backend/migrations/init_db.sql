-- Copy of migration content (expanded for 4-player Parchisi)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  profile_picture VARCHAR(500),
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  player2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  player3_id UUID REFERENCES users(id) ON DELETE CASCADE,
  player4_id UUID REFERENCES users(id) ON DELETE CASCADE,
  score1 INT NOT NULL DEFAULT 0,
  score2 INT NOT NULL DEFAULT 0,
  score3 INT DEFAULT NULL,
  score4 INT DEFAULT NULL,
  winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  player_count INT NOT NULL DEFAULT 2,
  duration INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_wins INT DEFAULT 0,
  total_losses INT DEFAULT 0,
  level INT DEFAULT 1,
  xp INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches(created_at);
CREATE INDEX IF NOT EXISTS idx_matches_player1_id ON matches(player1_id);
CREATE INDEX IF NOT EXISTS idx_matches_player2_id ON matches(player2_id);
CREATE INDEX IF NOT EXISTS idx_matches_player3_id ON matches(player3_id);
CREATE INDEX IF NOT EXISTS idx_matches_player4_id ON matches(player4_id);
CREATE INDEX IF NOT EXISTS idx_matches_winner_id ON matches(winner_id);
CREATE INDEX IF NOT EXISTS idx_matches_player_count ON matches(player_count);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_timestamp ON user_activity(timestamp);

-- Trigger function: auto-update user_stats after a match is inserted
CREATE OR REPLACE FUNCTION update_stats_after_match()
RETURNS TRIGGER AS $$
DECLARE
  p_ids UUID[];
  p_scores INT[];
  max_score INT;
  w_id UUID;
  i INT;
BEGIN
  p_ids := ARRAY[NEW.player1_id, NEW.player2_id];
  p_scores := ARRAY[NEW.score1, NEW.score2];

  IF NEW.player3_id IS NOT NULL THEN
    p_ids := p_ids || NEW.player3_id;
    p_scores := p_scores || COALESCE(NEW.score3, 0);
  END IF;

  IF NEW.player4_id IS NOT NULL THEN
    p_ids := p_ids || NEW.player4_id;
    p_scores := p_scores || COALESCE(NEW.score4, 0);
  END IF;

  max_score := p_scores[1];
  w_id := p_ids[1];
  FOR i IN 2..array_length(p_ids, 1) LOOP
    IF p_scores[i] > max_score THEN
      max_score := p_scores[i];
      w_id := p_ids[i];
    END IF;
  END LOOP;

  UPDATE matches SET winner_id = w_id WHERE id = NEW.id;

  FOR i IN 1..array_length(p_ids, 1) LOOP
    IF p_ids[i] = w_id THEN
      INSERT INTO user_stats (user_id, total_wins, total_losses, level, xp)
      VALUES (p_ids[i], 1, 0, 1, 10)
      ON CONFLICT (user_id) DO UPDATE SET
        total_wins = user_stats.total_wins + 1,
        xp = user_stats.xp + 10,
        level = GREATEST(1, (user_stats.xp + 10) / 100 + 1),
        updated_at = CURRENT_TIMESTAMP;
    ELSE
      INSERT INTO user_stats (user_id, total_wins, total_losses, level, xp)
      VALUES (p_ids[i], 0, 1, 1, 3)
      ON CONFLICT (user_id) DO UPDATE SET
        total_losses = user_stats.total_losses + 1,
        xp = user_stats.xp + 3,
        level = GREATEST(1, (user_stats.xp + 3) / 100 + 1),
        updated_at = CURRENT_TIMESTAMP;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_stats_after_match ON matches;
CREATE TRIGGER trg_update_stats_after_match
  AFTER INSERT ON matches
  FOR EACH ROW
  EXECUTE FUNCTION update_stats_after_match();

-- Insert Dummy Data (4 users)
INSERT INTO users (id, email, username) VALUES
('11111111-1111-1111-1111-111111111111', 'user1@example.com', 'UserOne'),
('22222222-2222-2222-2222-222222222222', 'user2@example.com', 'UserTwo'),
('33333333-3333-3333-3333-333333333333', 'user3@example.com', 'UserThree'),
('44444444-4444-4444-4444-444444444444', 'user4@example.com', 'UserFour')
ON CONFLICT (email) DO NOTHING;

-- Disable trigger temporarily for seed data (stats are manually seeded below)
ALTER TABLE matches DISABLE TRIGGER trg_update_stats_after_match;

-- Sample 2-player matches
INSERT INTO matches (player1_id, player2_id, score1, score2, winner_id, player_count, duration, created_at) VALUES
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 11, 5, '11111111-1111-1111-1111-111111111111', 2, 300, NOW() - INTERVAL '1 day'),
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 8, 11, '11111111-1111-1111-1111-111111111111', 2, 420, NOW() - INTERVAL '2 days'),
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 11, 9, '11111111-1111-1111-1111-111111111111', 2, 380, NOW() - INTERVAL '3 days'),
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 11, 7, '22222222-2222-2222-2222-222222222222', 2, 350, NOW() - INTERVAL '4 days'),
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 11, 3, '11111111-1111-1111-1111-111111111111', 2, 250, NOW() - INTERVAL '5 days');

-- Sample 4-player matches
INSERT INTO matches (player1_id, player2_id, player3_id, player4_id, score1, score2, score3, score4, winner_id, player_count, duration, created_at) VALUES
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 10, 5, 8, 3, '11111111-1111-1111-1111-111111111111', 4, 600, NOW() - INTERVAL '6 hours'),
('33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 12, 7, 9, 11, '33333333-3333-3333-3333-333333333333', 4, 720, NOW() - INTERVAL '12 hours');

-- Re-enable trigger
ALTER TABLE matches ENABLE TRIGGER trg_update_stats_after_match;

-- Seed user stats (manually to match seed matches above)
INSERT INTO user_stats (user_id, total_wins, total_losses) VALUES
('11111111-1111-1111-1111-111111111111', 5, 2),
('22222222-2222-2222-2222-222222222222', 2, 5),
('33333333-3333-3333-3333-333333333333', 1, 1),
('44444444-4444-4444-4444-444444444444', 0, 2)
ON CONFLICT (user_id) DO NOTHING;

-- Sample user activity
INSERT INTO user_activity (user_id, action, timestamp) VALUES
('11111111-1111-1111-1111-111111111111', 'login', NOW() - INTERVAL '1 hour'),
('11111111-1111-1111-1111-111111111111', 'match_played', NOW() - INTERVAL '1 day'),
('22222222-2222-2222-2222-222222222222', 'login', NOW() - INTERVAL '2 hours'),
('22222222-2222-2222-2222-222222222222', 'match_played', NOW() - INTERVAL '2 days'),
('33333333-3333-3333-3333-333333333333', 'login', NOW() - INTERVAL '3 hours'),
('33333333-3333-3333-3333-333333333333', 'match_played', NOW() - INTERVAL '6 hours'),
('44444444-4444-4444-4444-444444444444', 'login', NOW() - INTERVAL '4 hours'),
('44444444-4444-4444-4444-444444444444', 'match_played', NOW() - INTERVAL '6 hours'),
('11111111-1111-1111-1111-111111111111', 'login', NOW() - INTERVAL '3 days'),
('11111111-1111-1111-1111-111111111111', 'match_played', NOW() - INTERVAL '3 days'),
('22222222-2222-2222-2222-222222222222', 'login', NOW() - INTERVAL '4 days');
