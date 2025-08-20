-- Seed default RuleTemplates
INSERT INTO "RuleTemplate" (id, code, name, description, "paramsSchema", "createdAt", "updatedAt") VALUES
-- Rest and work pattern rules
('550e8400-e29b-41d4-a716-446655440001', 'MIN_REST_HOURS', 'Minimum Rest Hours', 'Minimum hours of rest required between shifts', '{"type": "object", "properties": {"hours": {"type": "integer", "minimum": 8, "maximum": 24}}, "required": ["hours"]}', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'MAX_CONSEC_NIGHTS', 'Maximum Consecutive Nights', 'Maximum number of consecutive night shifts allowed', '{"type": "object", "properties": {"nights": {"type": "integer", "minimum": 1, "maximum": 7}}, "required": ["nights"]}', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'ONE_SHIFT_PER_DAY', 'One Shift Per Day', 'Whether staff can only work one shift per day', '{"type": "object", "properties": {"enabled": {"type": "boolean"}}, "required": ["enabled"]}', NOW(), NOW()),

-- Contract and fairness rules
('550e8400-e29b-41d4-a716-446655440004', 'WEEKLY_CONTRACT_LIMITS', 'Weekly Contract Limits', 'Maximum hours per week based on contract', '{"type": "object", "properties": {"maxHoursPerWeek": {"type": "integer", "minimum": 20, "maximum": 80}}, "required": ["maxHoursPerWeek"]}', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'WEEKEND_FAIRNESS', 'Weekend Fairness', 'Fair distribution of weekend shifts among staff', '{"type": "object", "properties": {"maxWeekendsPerMonth": {"type": "integer", "minimum": 1, "maximum": 8}}, "required": ["maxWeekendsPerMonth"]}', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440006', 'PREFERENCES', 'Staff Preferences', 'Respect staff preferences for shifts and time off', '{"type": "object", "properties": {"weight": {"type": "integer", "minimum": 1, "maximum": 10}}, "required": ["weight"]}', NOW(), NOW());
