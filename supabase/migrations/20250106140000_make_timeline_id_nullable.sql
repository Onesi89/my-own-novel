-- Migration: Make timeline_id nullable in stories table
-- Purpose: Support both Google Timeline-based stories and direct route selection stories
-- Date: 2025-01-06

-- Make timeline_id nullable to support stories created without timeline data
ALTER TABLE stories ALTER COLUMN timeline_id DROP NOT NULL;

-- Add a comment to document the purpose
COMMENT ON COLUMN stories.timeline_id IS 'References timelines table. NULL for stories created from direct route selection, populated for stories from Google Timeline data.';