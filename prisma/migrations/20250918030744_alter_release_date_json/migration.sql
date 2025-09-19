ALTER TABLE video_info
    ALTER COLUMN release_date TYPE JSONB USING release_date::jsonb;
