-- AlterTable
ALTER TABLE video_info
    ALTER COLUMN aka TYPE JSONB
        USING aka::jsonb;

