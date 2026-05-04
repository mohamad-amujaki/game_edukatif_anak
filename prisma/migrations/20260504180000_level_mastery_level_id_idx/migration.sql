-- Optimize lookups by level (e.g. analytics / joins from LevelDefinition)
CREATE INDEX IF NOT EXISTS "LevelMastery_levelId_idx" ON "LevelMastery"("levelId");
