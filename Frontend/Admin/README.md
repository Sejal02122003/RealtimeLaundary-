# FreshFold Admin

The admin panel: dashboard, orders, customers, drivers, services and pricing, referral network, finance, reports and notifications.

## Run it

Start the backend:

```bash
cd Backend
npm install
npm run seed:demo                            # demo data, run once
npm run admin:create -- you@example.com      # asks for a password (10+ characters)
npm run dev                                  # http://localhost:5000
```

Then the frontend, in a second terminal. One server runs all three apps:

```bash
cd Frontend
npm install
npm run dev
```

Open http://localhost:5173/admin/.

Run `admin:create` again with the same email to reset a password.

`seed:demo` writes to the database in `Backend/.env`. Running it again replaces the demo records only. It refuses to run when `NODE_ENV` is `production`.

## How it connects to the driver app

| Admin does | Driver sees or does | Order becomes |
| --- | --- | --- |
| Assigns a pickup driver | New request | Pickup assigned |
| | Declines, or reports missed | Booking confirmed, unassigned |
| | Confirms pickup with photo and OTP | Picked up |
| Marks it ready, assigns a delivery driver | New request | Ready for delivery |
| | Accepts | Out for delivery |
| | Completes with photo and OTP | Delivered |

## Referral commissions

Nothing is calculated until the rules are saved on the Referral network page. After that, each delivered order creates pending commissions up the sponsor chain. Approving one adds it to the member's wallet.

## What is not connected

- **Customer app:** it does not use this backend yet, so new orders, sign-ups, refund requests and withdrawal requests come only from the demo data. Prices, slots, offers and order rules saved here do not reach it.
- **Push notifications:** messages and the automatic switches are saved, but nothing is delivered to phones.
- **Payments:** approving a withdrawal updates the wallet and records the payout. Send the money separately.
- **Driver distance:** drivers do not share a location, so the assign list shows only their open jobs.

## API

All routes are under `/api/admin`. Everything except `auth/login` needs `Authorization: Bearer <token>`. The route files are in `Backend/src/routes/admin`.

Set `VITE_API_URL` to the backend's address when building the panel for deployment.
