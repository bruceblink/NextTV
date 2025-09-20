## 怎么运行

### 1. 本地开发运行

在项目根目录运行下列命令

```bash
# 添加配置文件
cp .env.example .env
# 启动数据库
docker-compose -f docker/docker-compose.yml -p next-tv up -d postgresql
# 安装pnpm
npm i g pnpm
# 安装依赖
pnpm i
# 迁移和初始化数据库
npm run db:generate 
npm run db:migrate 
npm run db:seed
# 启动应用
pnpm dev
```

### 2. 服务器部署运行

修改服务端的数据库链接地址，即.env中的`DATABASE_URL=`的值

然后点击下面按钮一键部署，更新.env配置为生产配置即可：

更新Vercel的`Build Command`的值为下面命令(如果没有值则添加为下面命令)：

`npm run vercel-build`

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/bruceblink/nextTV)

### 默认的登录密码，大家记得自己更改

    email: 'user@nextmail.com',
    password: '123456',

登录用户的配置在[placeholder-data.ts](app/lib/placeholder-data.ts)