-- CreateTable
CREATE TABLE "public"."_sqlx_migrations" (
    "version" BIGINT NOT NULL,
    "description" TEXT NOT NULL,
    "installed_on" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL,
    "checksum" BYTEA NOT NULL,
    "execution_time" BIGINT NOT NULL,

    CONSTRAINT "_sqlx_migrations_pkey" PRIMARY KEY ("version")
);

-- CreateTable
CREATE TABLE "public"."ani_collect" (
    "id" BIGSERIAL NOT NULL,
    "user_id" TEXT DEFAULT '',
    "ani_item_id" BIGINT NOT NULL,
    "ani_title" TEXT NOT NULL,
    "collect_time" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_watched" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ani_collect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ani_info" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "update_count" TEXT,
    "update_info" TEXT,
    "image_url" TEXT NOT NULL,
    "detail_url" TEXT NOT NULL,
    "update_time" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "platform" TEXT NOT NULL,

    CONSTRAINT "ani_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ani_watch_history" (
    "id" BIGSERIAL NOT NULL,
    "user_id" TEXT DEFAULT '',
    "ani_item_id" BIGINT NOT NULL,
    "watched_time" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ani_watch_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."customers" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "image_url" VARCHAR(255) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."invoices" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "customer_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" VARCHAR(255) NOT NULL,
    "date" DATE NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."refresh_tokens" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."revenue" (
    "month" VARCHAR(4) NOT NULL,
    "revenue" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "public"."subscription_token" (
    "subscription_token" TEXT NOT NULL,
    "subscriber_id" UUID NOT NULL,

    CONSTRAINT "subscription_token_pkey" PRIMARY KEY ("subscription_token")
);

-- CreateTable
CREATE TABLE "public"."subscriptions" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subscribed_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_identities" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "provider_uid" VARCHAR(255) NOT NULL,
    "access_token" TEXT,
    "token_expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_info" (
    "id" BIGSERIAL NOT NULL,
    "email" VARCHAR(255),
    "username" VARCHAR(100),
    "password" TEXT,
    "display_name" VARCHAR(255),
    "avatar_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."video_info" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(255),
    "rating" JSONB,
    "pic" JSONB,
    "is_new" BOOLEAN,
    "uri" TEXT,
    "episodes_info" TEXT,
    "card_subtitle" TEXT,
    "type" VARCHAR(128),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_info_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_ani_collect_item_time" ON "public"."ani_collect"("ani_item_id", "collect_time");

-- CreateIndex
CREATE INDEX "idx_ani_collect_title" ON "public"."ani_collect"("ani_title");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_ani_collect" ON "public"."ani_collect"("user_id", "ani_item_id");

-- CreateIndex
CREATE INDEX "idx_ani_info_update_time" ON "public"."ani_info"("update_time");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_ani_info" ON "public"."ani_info"("title", "platform", "update_count");

-- CreateIndex
CREATE INDEX "idx_ani_watch_history_item_time" ON "public"."ani_watch_history"("ani_item_id", "watched_time");

-- CreateIndex
CREATE INDEX "idx_ani_watch_history_time" ON "public"."ani_watch_history"("watched_time");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_ani_watch" ON "public"."ani_watch_history"("user_id", "ani_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_customer_id_date_amount_status_key" ON "public"."invoices"("customer_id", "date", "amount", "status");

-- CreateIndex
CREATE UNIQUE INDEX "revenue_month_key" ON "public"."revenue"("month");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_email_key" ON "public"."subscriptions"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_identities_provider_provider_uid_key" ON "public"."user_identities"("provider", "provider_uid");

-- CreateIndex
CREATE UNIQUE INDEX "user_info_email_key" ON "public"."user_info"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_info_username_key" ON "public"."user_info"("username");

-- CreateIndex
CREATE UNIQUE INDEX "video_info_title_key" ON "public"."video_info"("title");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_video_info" ON "public"."video_info"("title", "episodes_info");

-- AddForeignKey
ALTER TABLE "public"."ani_collect" ADD CONSTRAINT "fk_ani_item" FOREIGN KEY ("ani_item_id") REFERENCES "public"."ani_info"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."ani_watch_history" ADD CONSTRAINT "fk_ani_watch" FOREIGN KEY ("ani_item_id") REFERENCES "public"."ani_info"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_info"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."subscription_token" ADD CONSTRAINT "subscription_token_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "public"."subscriptions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."user_identities" ADD CONSTRAINT "user_identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_info"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
