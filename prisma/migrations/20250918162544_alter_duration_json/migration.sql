ALTER TABLE video_info
    ALTER COLUMN duration TYPE jsonb
        USING to_jsonb(duration);
