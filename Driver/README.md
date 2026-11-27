# FreshFold Driver

The driver app: OTP login, document upload, today's pickups and deliveries, and earnings.

## Run it

Start the backend:

```bash
cd Backend
npm install
npm run seed:driver   # demo drivers and jobs, run once
npm run dev           # http://localhost:5000
```

Then the app, in a second terminal:

```bash
cd Driver
npm install
npm run dev           # http://localhost:5174
```

## Demo accounts

| Mobile number | Driver | State |
| --- | --- | --- |
| 99887 76655 | Ravi Kumar | Approved, has jobs |
| 99887 76656 | Sameer Khan | One document left |

- Login OTP: `1234` (demo mode, on only with `npm run dev`)
- Customer OTPs: `7305` for delivery FF-1042, `1234` for the pickups

Run `npm run seed:driver` again to reset the demo data. It only replaces these two accounts and their jobs.

## Approving a driver

There is no admin panel yet. After checking the uploaded files in `Backend/uploads`:

```bash
cd Backend
npm run driver:approve -- 9988776656
```

The script prints the file paths and approves the account.

## API

All routes are under `/api/driver`. Everything except `auth/otp`, `auth/login` and `auth/register` needs `Authorization: Bearer <token>`.

| Method and path | Purpose |
| --- | --- |
| `POST auth/otp` | Send a login OTP |
| `POST auth/login`, `auth/register`, `auth/logout` | Sessions |
| `GET me` | Profile and document status |
| `PATCH me/vehicle`, `me/online` | Vehicle details, online switch |
| `POST me/documents/:type` | Upload `licence`, `identity` or `registration` |
| `GET jobs/dashboard`, `jobs/:id` | Today's jobs, one job |
| `POST jobs/:id/accept`, `decline` | Answer a new request |
| `POST jobs/:id/complete` | Photo, customer OTP and count or cash |
| `POST jobs/:id/missed` | Report a job that could not be done |
| `GET history` | Earnings, cash to deposit, completed jobs |

## Before production

- Connect an SMS provider in `Backend/src/utils/otp.js`. Without one, logins fail unless demo mode is on.
- Move uploads to durable storage; they are saved on the server's disk.
- Create jobs from real customer orders. Today they come only from the seed script.
- Set `VITE_API_URL` to the backend's address when building the app.
