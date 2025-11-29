
-- Insert initial weekly and monthly challenges with categories and rewards
INSERT INTO challenges (name, duration, completion_goal, bonus_reward, category, start_date, end_date, is_active, created_at, updated_at) VALUES
  ('Most Steps This Week', 7, 'Accumulate the highest number of steps this week', '150 XP', 'Fitness', datetime('now'), datetime('now', '+7 days'), 1, datetime('now'), datetime('now')),
  ('Best Trick Competition', 30, 'Perform the best trick and get votes from the community', '300 XP', 'Training', datetime('now'), datetime('now', '+30 days'), 1, datetime('now'), datetime('now')),
  ('Weekly Best Playtime Photo', 7, 'Submit the best playtime photo of your pet', '100 XP', 'Social', datetime('now'), datetime('now', '+7 days'), 1, datetime('now'), datetime('now')),
  ('Monthly Fitness Challenge', 30, 'Complete daily fitness tasks for the whole month', '500 XP', 'Fitness', datetime('now'), datetime('now', '+30 days'), 1, datetime('now'), datetime('now'));
