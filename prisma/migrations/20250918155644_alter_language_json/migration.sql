ALTER TABLE video_info
    ALTER COLUMN language TYPE JSONB
        USING language::jsonb;
