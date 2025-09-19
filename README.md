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
# 启动应用
pnpm dev
```

启动成功没有报错则打开浏览器访问 http://localhost:3000/seed, 初始化本地数据库(首次运行才需要这个操作)

### 2. 服务器部署运行

修改服务端的数据库链接地址，即.env中的`DATABASE_URL=`的值，更新为你服务端的地址，然后点击下面按钮一键部署，更新.env配置为生产配置即可：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/bruceblink/nextTV)

### 默认的登录密码，大家记得自己更改

    email: 'user@nextmail.com',
    password: '123456',

登录用户的配置在[placeholder-data.ts](app/lib/placeholder-data.ts)