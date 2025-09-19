-- 先更新空值
UPDATE video_info
SET episodes_info = ''
WHERE episodes_info IS NULL;
-- 设置默认值 + 非空约束
ALTER TABLE video_info
    ALTER COLUMN episodes_info SET DEFAULT '',
    ALTER COLUMN episodes_info SET NOT NULL;