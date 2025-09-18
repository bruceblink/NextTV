ALTER TABLE video_info
    ADD COLUMN original_title VARCHAR(255),
    ADD COLUMN intro TEXT,
    ADD COLUMN genres JSONB;
