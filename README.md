# RealtimeLaundary-

## Folders

```
Backend/               API server
Frontend/              one Vite project for all three apps
  User/src/            customer app
  Driver/src/          driver app
  Admin/src/           admin panel
  index.html           page for User
  driver.html          page for Driver
  admin.html           page for Admin
  vite.config.js
  package.json
  .env                 copy from .env.example
```

## Run it

Backend, in one terminal:

```bash
cd Backend
npm install
npm run dev
```

Frontend, in a second terminal:

```bash
cd Frontend
npm install
npm run dev
```

| App | Address | Notes |
| --- | --- | --- |
| Customer | http://localhost:5173 | |
| Driver | http://localhost:5173/driver/ | [Driver notes](Frontend/Driver/README.md) |
| Admin | http://localhost:5173/admin/ | [Admin notes](Frontend/Admin/README.md) |

The API runs on http://localhost:5000.

## Deploying

`npm run build` in `Frontend` writes all three apps to `Frontend/dist`. Set up the
host to answer:

| Address | With the file |
| --- | --- |
| `/driver` and everything under it | `driver.html` |
| `/admin` and everything under it | `admin.html` |
| any other page address | `index.html` |
