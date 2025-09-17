--- video info表
--- 删除表
DROP TABLE IF EXISTS video_info CASCADE;
--- 建表
CREATE TABLE IF NOT EXISTS video_info
(
    id            UUID        NOT NULL DEFAULT gen_random_uuid(),
    title         VARCHAR(255) NOT NULL,
    rating        JSONB,
    pic           JSONB,
    is_new        BOOLEAN,
    uri           TEXT,
    episodes_info TEXT,
    card_subtitle TEXT,
    director      JSONB,
    screenwriter  JSONB,
    actors        JSONB,
    category      VARCHAR(128),
    type          JSONB,
    production_country JSONB,
    language      varchar(128),
    release_year  SMALLINT,
    release_date  TEXT,
    duration      INT,
    aka           VARCHAR(255),
    imdb          VARCHAR(64),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT video_info_pkey PRIMARY KEY (id),
    CONSTRAINT uniq_video_info UNIQUE (title, episodes_info)
);

COMMENT ON TABLE video_info IS '视频信息表，存储各类影片（电影、电视剧、动漫等）信息';
COMMENT ON COLUMN video_info.id IS '主键 UUID，唯一标识每条视频记录';
COMMENT ON COLUMN video_info.title IS '视频标题';
COMMENT ON COLUMN video_info.rating IS '评分信息，JSON 格式，可包含各平台评分';
COMMENT ON COLUMN video_info.pic IS '封面及相关图片信息，JSON 格式';
COMMENT ON COLUMN video_info.is_new IS '是否为最新视频，布尔值';
COMMENT ON COLUMN video_info.uri IS '视频播放链接或资源地址';
COMMENT ON COLUMN video_info.episodes_info IS '剧集信息，JSON 或文本格式，可存储集数、季数等';
COMMENT ON COLUMN video_info.card_subtitle IS '视频副标题或短描述';
COMMENT ON COLUMN video_info.director IS '导演信息，JSON 格式，支持多导演';
COMMENT ON COLUMN video_info.screenwriter IS '编剧信息，JSON 格式，支持多编剧';
COMMENT ON COLUMN video_info.actors IS '主演信息，JSON 格式，支持多演员';
COMMENT ON COLUMN video_info.category IS '视频分类，如 动漫、电视剧、电影 等';
COMMENT ON COLUMN video_info.type IS '视频类型，如 喜剧、动作、犯罪等，可多值存储 JSON';
COMMENT ON COLUMN video_info.production_country IS '制片地区/国家，JSON 格式支持多地区';
COMMENT ON COLUMN video_info.language IS '视频语言，如 中文、英语等';
COMMENT ON COLUMN video_info.release_year IS '上映年份，如 2025';
COMMENT ON COLUMN video_info.release_date IS '具体上映时间，如 2025-08-15(中国香港)';
COMMENT ON COLUMN video_info.duration IS '片长，单位为分钟';
COMMENT ON COLUMN video_info.aka IS '又名/别名，可存单个或多个备用名称';
COMMENT ON COLUMN video_info.imdb IS 'imdb编号';
COMMENT ON COLUMN video_info.created_at IS '记录创建时间';
COMMENT ON COLUMN video_info.updated_at IS '记录最后更新时间';

-- 为标题创建索引（加速模糊查询或精确查询）
CREATE INDEX IF NOT EXISTS idx_video_info_title
    ON video_info(title);

-- 为分类创建索引（加速模糊查询或精确查询）
CREATE INDEX IF NOT EXISTS idx_video_info_category
    ON video_info(category);

-- 为类型创建索引（JSON 类型，如果 type 是 JSON，需要用表达式索引，假设你查询 JSON 中的具体值）
CREATE INDEX IF NOT EXISTS idx_video_info_type
    ON video_info((type::text));

-- 为上映年份创建索引
CREATE INDEX IF NOT EXISTS idx_video_info_release_year
    ON video_info(release_year);
