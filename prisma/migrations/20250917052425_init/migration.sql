CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateTable
CREATE TABLE "public"."customers"
(
    "id"        UUID         NOT NULL DEFAULT uuid_generate_v4(),
    "name"      VARCHAR(255) NOT NULL,
    "email"     VARCHAR(255) NOT NULL,
    "image_url" VARCHAR(255) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."invoices"
(
    "id"          UUID         NOT NULL DEFAULT uuid_generate_v4(),
    "customer_id" UUID         NOT NULL,
    "amount"      INTEGER      NOT NULL,
    "status"      VARCHAR(255) NOT NULL,
    "date"        DATE         NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."revenue"
(
    "month"   VARCHAR(4) NOT NULL,
    "revenue" INTEGER    NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "invoices_customer_id_date_amount_status_key" ON "public"."invoices" ("customer_id", "date", "amount", "status");

-- CreateIndex
CREATE UNIQUE INDEX "revenue_month_key" ON "public"."revenue" ("month");


-- ani_info 表
CREATE TABLE IF NOT EXISTS ani_info
(
    id           BIGSERIAL PRIMARY KEY,
    title        TEXT        NOT NULL,
    update_count TEXT,
    update_info  TEXT,
    image_url    TEXT        NOT NULL,
    detail_url   TEXT        NOT NULL,
    update_time  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    platform     TEXT        NOT NULL,
    CONSTRAINT uniq_ani_info UNIQUE (title, platform, update_count)
);

COMMENT ON TABLE ani_info IS '番剧信息表';
COMMENT ON COLUMN ani_info.id IS '主键 ID';
COMMENT ON COLUMN ani_info.title IS '番剧标题';
COMMENT ON COLUMN ani_info.update_count IS '更新集数（如 第10集）';
COMMENT ON COLUMN ani_info.update_info IS '更新描述（如 已完结）';
COMMENT ON COLUMN ani_info.image_url IS '封面图片 URL';
COMMENT ON COLUMN ani_info.detail_url IS '详情页 URL';
COMMENT ON COLUMN ani_info.update_time IS '信息更新时间（插入时自动写入）';
COMMENT ON COLUMN ani_info.platform IS '所属平台（如 bilibili、iqiyi 等）';

-- ani_collect 表
CREATE TABLE IF NOT EXISTS ani_collect
(
    id           BIGSERIAL PRIMARY KEY,
    user_id      TEXT                 DEFAULT '',
    ani_item_id  BIGINT      NOT NULL,
    ani_title    TEXT        NOT NULL,
    collect_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_watched   BOOLEAN     NOT NULL DEFAULT FALSE,
    CONSTRAINT uniq_ani_collect UNIQUE (user_id, ani_item_id)
);

COMMENT ON TABLE ani_collect IS '用户收藏表';
COMMENT ON COLUMN ani_collect.id IS '主键 ID';
COMMENT ON COLUMN ani_collect.user_id IS '用户 ID';
COMMENT ON COLUMN ani_collect.ani_item_id IS '关联番剧 ID';
COMMENT ON COLUMN ani_collect.ani_title IS '收藏时的番剧标题';
COMMENT ON COLUMN ani_collect.collect_time IS '收藏时间';
COMMENT ON COLUMN ani_collect.is_watched IS '是否已观看';

-- ani_watch_history 表
CREATE TABLE IF NOT EXISTS ani_watch_history
(
    id           BIGSERIAL PRIMARY KEY,
    user_id      TEXT                 DEFAULT '',
    ani_item_id  BIGINT      NOT NULL,
    watched_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_ani_watch UNIQUE (user_id, ani_item_id)
);

COMMENT ON TABLE ani_watch_history IS '观看历史表';
COMMENT ON COLUMN ani_watch_history.id IS '主键 ID';
COMMENT ON COLUMN ani_watch_history.user_id IS '用户 ID';
COMMENT ON COLUMN ani_watch_history.ani_item_id IS '关联番剧 ID';
COMMENT ON COLUMN ani_watch_history.watched_time IS '观看时间';

-- user_info 表
CREATE TABLE IF NOT EXISTS user_info
(
    id           BIGSERIAL PRIMARY KEY,
    email        VARCHAR(255) UNIQUE,
    username     VARCHAR(100) UNIQUE,
    password     TEXT,
    display_name VARCHAR(255),
    avatar_url   TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE user_info IS '系统用户表，存储应用内的用户主体信息';

-- user_identities 表
CREATE TABLE IF NOT EXISTS user_identities
(
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT       NOT NULL,
    provider         VARCHAR(50)  NOT NULL,
    provider_uid     VARCHAR(255) NOT NULL,
    access_token     TEXT,
    token_expires_at TIMESTAMPTZ,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_identities_provider_provider_uid_key UNIQUE (provider, provider_uid)
);

COMMENT ON TABLE user_identities IS '用户身份表，存储第三方登录账号与系统用户的映射关系';

-- refresh_tokens 表
CREATE TABLE IF NOT EXISTS refresh_tokens
(
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT      NOT NULL,
    token      TEXT        NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked    BOOLEAN     NOT NULL DEFAULT FALSE
);

COMMENT ON TABLE refresh_tokens IS '刷新 Token 表，用于长时间会话管理';

-- video_info 表
CREATE TABLE IF NOT EXISTS video_info
(
    id            UUID        NOT NULL DEFAULT gen_random_uuid(),
    title         VARCHAR(255),
    rating        JSONB,
    pic           JSONB,
    is_new        BOOLEAN,
    uri           TEXT,
    episodes_info TEXT,
    card_subtitle TEXT,
    type          VARCHAR(128),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT video_info_pkey PRIMARY KEY (id),
    CONSTRAINT uniq_video_info UNIQUE (title, episodes_info)
);

COMMENT ON TABLE video_info IS '视频信息表';

-- ========================================================
-- 3. 创建索引
-- ========================================================
CREATE INDEX IF NOT EXISTS idx_ani_info_update_time ON ani_info (update_time);
CREATE INDEX IF NOT EXISTS idx_ani_collect_item_time ON ani_collect (ani_item_id, collect_time);
CREATE INDEX IF NOT EXISTS idx_ani_collect_title ON ani_collect (ani_title);
CREATE INDEX IF NOT EXISTS idx_ani_watch_history_item_time ON ani_watch_history (ani_item_id, watched_time);
CREATE INDEX IF NOT EXISTS idx_ani_watch_history_time ON ani_watch_history (watched_time);

-- ========================================================
-- 4. 创建触发器（更新 is_watched 状态）
-- ========================================================
DO
$$
    BEGIN
        IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_after_insert_watch') THEN
            DROP TRIGGER trg_after_insert_watch ON ani_watch_history;
        END IF;

        IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trg_after_insert_watch_func') THEN
            DROP FUNCTION trg_after_insert_watch_func() CASCADE;
        END IF;
    END;
$$;

CREATE OR REPLACE FUNCTION trg_after_insert_watch_func()
    RETURNS TRIGGER AS
$$
BEGIN
    UPDATE ani_collect
    SET is_watched = TRUE
    WHERE user_id = NEW.user_id
      AND ani_item_id = NEW.ani_item_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_after_insert_watch
    AFTER INSERT
    ON ani_watch_history
    FOR EACH ROW
EXECUTE FUNCTION trg_after_insert_watch_func();

-- ========================================================
-- 5. 添加外键（检查是否存在）
-- ========================================================

DO
$$
    BEGIN
        IF NOT EXISTS (SELECT 1
                       FROM information_schema.table_constraints
                       WHERE table_name = 'ani_collect'
                         AND constraint_name = 'fk_ani_item') THEN
            ALTER TABLE ani_collect
                ADD CONSTRAINT fk_ani_item FOREIGN KEY (ani_item_id)
                    REFERENCES ani_info (id) ON DELETE CASCADE;
        END IF;

        IF NOT EXISTS (SELECT 1
                       FROM information_schema.table_constraints
                       WHERE table_name = 'ani_watch_history'
                         AND constraint_name = 'fk_ani_watch') THEN
            ALTER TABLE ani_watch_history
                ADD CONSTRAINT fk_ani_watch FOREIGN KEY (ani_item_id)
                    REFERENCES ani_info (id) ON DELETE CASCADE;
        END IF;

        IF NOT EXISTS (SELECT 1
                       FROM information_schema.table_constraints
                       WHERE table_name = 'refresh_tokens'
                         AND constraint_name = 'refresh_tokens_user_id_fkey') THEN
            ALTER TABLE refresh_tokens
                ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id)
                    REFERENCES user_info (id) ON DELETE CASCADE;
        END IF;

        IF NOT EXISTS (SELECT 1
                       FROM information_schema.table_constraints
                       WHERE table_name = 'user_identities'
                         AND constraint_name = 'user_identities_user_id_fkey') THEN
            ALTER TABLE user_identities
                ADD CONSTRAINT user_identities_user_id_fkey FOREIGN KEY (user_id)
                    REFERENCES user_info (id) ON DELETE CASCADE;
        END IF;
    END;
$$;

--- video info表
CREATE TABLE IF NOT EXISTS video_info
(
    id            UUID        NOT NULL DEFAULT gen_random_uuid(),
    title         VARCHAR(255),
    rating        JSONB,
    pic           JSONB,
    is_new        BOOLEAN,
    uri           TEXT,
    episodes_info TEXT,
    card_subtitle TEXT,
    type          VARCHAR(128),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT video_info_pkey PRIMARY KEY (id),
    CONSTRAINT uniq_video_info UNIQUE (title, episodes_info)
);

COMMENT ON TABLE video_info IS '视频信息表';
COMMENT ON COLUMN video_info.id IS '主键 UUID';
COMMENT ON COLUMN video_info.title IS '视频标题';
COMMENT ON COLUMN video_info.rating IS '评分信息，JSON 格式';
COMMENT ON COLUMN video_info.pic IS '图片信息，JSON 格式';
COMMENT ON COLUMN video_info.is_new IS '是否最新';
COMMENT ON COLUMN video_info.uri IS '视频链接';
COMMENT ON COLUMN video_info.episodes_info IS '剧集信息';
COMMENT ON COLUMN video_info.card_subtitle IS '副标题信息';
COMMENT ON COLUMN video_info.type IS '类型（如 动漫、电视剧、电影 等）';
COMMENT ON COLUMN video_info.created_at IS '创建时间';
COMMENT ON COLUMN video_info.updated_at IS '更新时间';
