# Laxmi Kirana Store

Neighborhood grocery shop for store pickup. Customers browse and place orders in a browser. The owner packs those orders from a protected dashboard. There is no online payment and no delivery. The customer pays at the store when they collect the bag.

The live shop and the owner tools are one Next.js application. MySQL stores products, orders, and settings. A Docker image runs that same application on a laptop and on the production server.

Repository: https://github.com/poudelef/E-commerce

## Branches

| Branch | Purpose |
| --- | --- |
| `testing` | Day-to-day work. Change the code here. |
| `main` | Production. The server runs this branch only. |

Do the work on `testing`. Merge into `main` only when the change is ready for customers.

## What you need installed

| Tool | Used for |
| --- | --- |
| Node.js 22 | Run the app without Docker, and build the image |
| npm 10 | Install JavaScript packages |
| MySQL 8 | Database when you run the app directly on Windows |
| Docker Desktop | Run the same container locally and in production |
| Git | Save and publish code |

The app itself uses Next.js 15, React 19, TypeScript, Tailwind CSS, Prisma, and MySQL 8.

## Run it on your computer

Two ways work. Use one at a time. Both want port 3000.

### Docker (same setup as production)

Stop any `npm run dev` that is already running, then from this folder:

```powershell
docker compose up --build
```

Open http://localhost:3000.

The container brings its own MySQL. That database is not the MySQL installed on Windows. Docker publishes it on port **3307** so the two do not clash. The Windows app, if you also run it, uses port 3306.

Owner login inside Docker:

- Email: `owner@laxmikirana.store`
- Password: `LaxmiOwner#2026`

Change those before real customers use the site. Set `OWNER_EMAIL`, `OWNER_PASSWORD`, `AUTH_SECRET`, and `MYSQL_ROOT_PASSWORD` in the server environment. Do not commit real passwords.

Stop the containers with Ctrl+C, or:

```powershell
docker compose down
```

`docker compose down` keeps the database and uploaded photos. `docker compose down -v` deletes them. Do not use `-v` on the production server.

### Windows, without Docker

MySQL 8 must be running. Create the database once:

```sql
CREATE DATABASE laxmi_kirana CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Copy `.env.example` to `.env` and set `DATABASE_URL`, `AUTH_SECRET`, and `OWNER_PASSWORD`.

```powershell
npm install
npm run setup
npm run dev
```

Open http://localhost:3000. The owner dashboard is http://localhost:3000/admin.

`npm run db:reset` wipes products, categories, and orders, then loads the sample catalog again. The owner password is reset to `OWNER_PASSWORD`. It does not delete the owner account.

## Temporary public link

`localhost` only opens on your computer. A Cloudflare quick tunnel gives an `https://` address so someone else can open the shop and the owner dashboard while your computer is on.

Install Cloudflare Tunnel once:

```powershell
winget install --id Cloudflare.cloudflared -e --accept-package-agreements --accept-source-agreements
```

Leave `npm run dev` or `docker compose up` running, then in a second terminal:

```powershell
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:3000
```

The terminal prints a new address each time, like `https://something.trycloudflare.com`. The owner dashboard is that address with `/admin` on the end. Products are at `/admin/products`.

Leave both terminals open and keep the computer awake. Edits made through that link save into the database the running site is using. Press Ctrl+C in the tunnel terminal when they are done. That address stops working. The next run prints a different address.

Send the owner password in a separate message. This link is the full owner login, so close the tunnel when the work is finished.

## How a customer uses the shop

1. Open the site. The header shows the store name, a search box, and the cart.
2. Browse by category, or search. Search waits 300ms, then matches the name, category, and keywords. A small typo still finds the product (`basmti` finds Basmati Rice).
3. Add an item. The button becomes a minus / quantity / plus control. Out-of-stock items cannot be added.
4. On a phone, the cart is a full page at `/cart`. On a wider screen it slides in from the side.
5. Checkout is store pickup only. The customer enters their name, a Nepal mobile number, an optional email, an optional note, and a pickup date plus time slot.
6. After they place the order they see an order number such as `LKS-000123`. The cart is cleared.
7. They can look the order up later with the order number and the same phone number. No account is required.

Prices are shown as `Rs`. Pickup times use Nepal time (`Asia/Kathmandu`). The store needs at least two hours of notice, and that lead time can be changed in owner settings.

## How the owner uses the dashboard

Sign in at `/admin`.

| Screen | What it does |
| --- | --- |
| Overview | Orders today, pending orders, orders due within 2 hours, low stock, a 7-day chart, top sellers |
| Orders | List sorted by needed-by time. Filter by status, date, and customer. Update status. Edit quantities. Print a packing slip |
| Products | Add, edit, duplicate, hide, delete. Change price and stock in the list. Import and export CSV |
| Categories | Add, rename, reorder, delete |
| Settings | Store name, address, phone, hours, lead time, slot length, tax, timezone |

Order status moves in this order: New, Confirmed, Packing, Ready for Pickup, Completed. Cancelled is separate. Cancelling an order puts the stock back.

The orders list refreshes about every 20 seconds. A new order can play a sound after the owner has clicked the page once.

## Change the code, then publish it

Do this on your computer.

```powershell
git checkout testing
git pull origin testing
```

Edit the code. Run the site and check the change. Then:

```powershell
git add .
git commit -m "Describe why the change was made"
git push origin testing
```

When that change is ready for customers, put `testing` onto `main`:

```powershell
git checkout main
git pull origin main
git merge testing
git push origin main
```

Go back to `testing` for the next change:

```powershell
git checkout testing
```

`main` on GitHub is only the saved code. The running website does not change until the server rebuilds the Docker image. That is the next section.

Never commit `.env`. It holds the database password and `AUTH_SECRET`.

## Update the live Docker site

The production server should already have this repository on the `main` branch, with Docker installed.

SSH into the server, open the project folder, and run:

```bash
git checkout main
git pull origin main
docker compose up --build -d
```

What that does:

1. `git pull` downloads the new code from `main`.
2. `docker compose up --build` builds a new image from that code and restarts the website container.
3. The MySQL container keeps the existing volume. Products, orders, and settings stay. You do not load the sample catalog over the live data.
4. On startup the app runs `prisma db push`, which adds any new tables or columns. It does not wipe rows.
5. The seed then runs. It creates the owner only if needed, and it loads sample products only when the product table is empty. A live store that already has products is left as it is. Sample customer orders are not inserted when `NODE_ENV` is `production`. Set `SEED_SAMPLE_ORDERS=true` if you want those demo orders.
6. The owner password in the database is set again from `OWNER_PASSWORD` every time the container starts. On the server, that variable must be the real owner password, not the demo one.
7. The owner sign-in cookie is marked secure only when the site is actually reached over HTTPS. Plain `http://` on the Amazon address still lets the owner sign in. When you add a domain and Caddy later, the cookie locks to HTTPS on its own. Set `COOKIE_SECURE=true` only if a proxy is terminating HTTPS and not sending `X-Forwarded-Proto`.
7. The owner sign-in cookie is marked secure only when the site is actually reached over HTTPS. Plain `http://` on the Amazon address still lets the owner sign in. When you add a domain and Caddy later, the cookie locks to HTTPS on its own. Set `COOKIE_SECURE=true` only if a proxy is terminating HTTPS and not sending `X-Forwarded-Proto`.

You do not push the image to a registry. The server builds it from the code. Uploaded photos live in the `uploads` volume, separate from the image, so a rebuild keeps them.

Check the site in a browser after the command finishes. If the new container fails, the last working image is still on the machine. Run `docker compose logs web` to read the error.

Do not run `docker compose down -v` on the server. The `-v` flag deletes the database volume and the upload volume.

## How a request moves through the app

```text
Phone or laptop browser
        |
        |  HTTP
        v
Next.js  (pages + /api routes)   port 3000
        |
        |  Prisma
        v
MySQL database "laxmi_kirana"
```

In Docker, the browser talks to the `web` container. That container talks to the `mysql` container over the Docker network. The browser never connects to MySQL.

### Shop data

The server loads active products and categories from MySQL and sends them to the browser as a catalog. The browser keeps that catalog in memory. Search, category chips, price filters, and sorting happen in the browser. The catalog refreshes when the tab gains focus and about once a minute, so a price the owner just saved shows up without a full redeploy.

### Cart

The cart is not in MySQL. The browser stores it in `localStorage` under the key `lks_cart_v1`. Each line is only a product id and a quantity. The price and the stock come from the catalog at display time. Clearing the browser storage clears the cart. A different phone has its own cart.

### Place an order

1. The customer submits checkout.
2. The browser sends `POST /api/orders` with the name, phone, notes, pickup slot, and cart lines.
3. The server checks the Nepal phone number, checks the slot is still inside store hours and after the lead time, and checks stock inside a database transaction.
4. It saves an `Order` and `OrderItem` rows. Prices are copied onto the order line, so a later price change does not rewrite old orders.
5. Stock is reduced.
6. The order number is `LKS-` plus a counter stored in store settings.
7. The browser saves the receipt in `sessionStorage` (`lks_last_order`), clears the cart, and opens `/order/confirmation`.

Anyone who later looks up the order must send `POST /api/orders/lookup` with the order number and the same phone number. The order number alone is not enough.

### Owner changes

1. The owner submits email and password to `POST /api/auth/login`.
2. The server checks the password with bcrypt. After 5 failures in 15 minutes, that email and IP are blocked until the window passes. The block list lives in memory, so a restart clears it.
3. A signed token is stored in the cookie `lks_session`. The cookie is `httpOnly`, so page scripts cannot read it. It lasts 12 hours. It is marked secure when the request arrived over HTTPS. On plain HTTP, which is the Amazon setup before you buy a domain, the cookie still works.
4. Every `/admin` page and `/api/admin` route checks that cookie. A missing or bad cookie gets a login redirect or `401`.
5. Saving a price, adding a product, or deleting one calls the matching `/api/admin/products` route, and Prisma writes the row in MySQL.
6. The shop's next catalog refresh reads that row. Customers then see the new price.

Product photos uploaded by the owner are written as files under `public/uploads`. The database stores the file path. In Docker those files are on the `uploads` volume.

### Orders the owner sees

`GET /api/admin/orders` reads orders from MySQL. The browser asks again about every 20 seconds. Status changes and item edits go to `PATCH /api/admin/orders/:id`. Stock is adjusted when a quantity changes or an order is cancelled.

## Pages

| URL | Who | Purpose |
| --- | --- | --- |
| `/` | Customer | Shop grid, filters, search |
| `/product/[slug]` | Customer | Product detail and related items |
| `/cart` | Customer | Cart page used on phones |
| `/checkout` | Customer | Pickup details and review |
| `/order/confirmation` | Customer | Receipt for the order just placed |
| `/order/lookup` | Customer | Find an order with number + phone |
| `/admin/login` | Owner | Sign in |
| `/admin` | Owner | Overview |
| `/admin/orders` | Owner | Order list |
| `/admin/orders/[id]` | Owner | One order |
| `/admin/orders/[id]/print` | Owner | Packing slip |
| `/admin/orders/today/print` | Owner | All of today's slips |
| `/admin/products` | Owner | Product list |
| `/admin/categories` | Owner | Categories |
| `/admin/settings` | Owner | Store settings |

## API routes

Public:

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/catalog` | Active products and categories |
| GET | `/api/slots?date=` | Pickup slots for one date |
| POST | `/api/orders` | Place an order |
| POST | `/api/orders/lookup` | Find an order by number and phone |
| POST | `/api/auth/login` | Owner sign-in |
| POST | `/api/auth/logout` | Clear the owner cookie |
| GET | `/api/auth/me` | Who is signed in |

Owner only:

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/admin/stats` | Dashboard numbers |
| GET | `/api/admin/orders` | Order list |
| GET, PATCH | `/api/admin/orders/[id]` | Read or update one order |
| GET, PATCH | `/api/admin/settings` | Read or save store settings |
| POST | `/api/admin/uploads` | Save a product image |
| GET, POST | `/api/admin/products` | List or create products |
| PATCH, DELETE | `/api/admin/products/[id]` | Update or delete one product |
| POST | `/api/admin/products/[id]/duplicate` | Copy a product (the copy starts hidden) |
| POST | `/api/admin/products/bulk` | Hide, show, move, or delete many |
| GET | `/api/admin/products/export` | Download CSV |
| POST | `/api/admin/products/import` | Upload CSV |
| GET, POST | `/api/admin/categories` | List or create categories |
| PATCH, DELETE | `/api/admin/categories/[id]` | Rename or delete |
| POST | `/api/admin/categories/reorder` | Save category order |

## Database tables

Prisma's schema is `prisma/schema.prisma`. Money is stored as integer paisa (Rs 165 is `16500`). Dates for pickup are stored as `YYYY-MM-DD` and `HH:mm` strings in the store timezone, not as a single UTC timestamp.

| Table | Holds |
| --- | --- |
| `User` | The owner account. Password is a bcrypt hash |
| `Category` | Shelf categories and their order |
| `Product` | Name, price, unit, stock, keywords, image path, active flag |
| `Order` | Customer, phone, pickup slot, status, totals, fulfillment type (`pickup`) |
| `OrderItem` | Snapshot of each line: name, unit, unit price, quantity |
| `OrderStatusEvent` | Status history with time and note |
| `OrderEdit` | Notes when the owner changes items |
| `StoreSettings` | Name, address, phone, hours, lead time, slot length, tax, timezone, order counter |

`fulfillmentType` defaults to `pickup` so a later delivery option can be added without replacing the order table.

## Time, phone, and money

- Store timezone defaults to `Asia/Kathmandu`, which is 15 minutes ahead of India. Pickup slots, "today", and "overdue" all use that zone.
- A slot must fall inside the hours for that weekday, must not be in the past, and must be at least `leadTimeMinutes` ahead (default 120).
- Phones must be Nepal mobiles: 10 digits starting with 9. They are stored as `+977` plus those digits.
- Prices and totals are integers in paisa. The screen prints them as `Rs`.
- Tax is off unless the owner turns it on. Tax is `subtotal * taxBps / 10000`.

## Project folders

```text
src/app/(store)     Customer pages
src/app/admin       Owner pages
src/app/api         HTTP endpoints
src/components      Screen components
src/lib             Database, orders, search, time, auth
prisma/schema.prisma   Tables
prisma/seed.ts      Sample catalog and demo orders
public/products     Generated product pictures
public/uploads      Pictures the owner uploads
Dockerfile          Image build
docker-compose.yml  Web + MySQL
docker-entrypoint.mjs   Wait for MySQL, update tables, start the server
```

## Environment variables

| Name | Purpose |
| --- | --- |
| `DATABASE_URL` | MySQL connection string |
| `AUTH_SECRET` | Long random string used to sign the owner cookie |
| `OWNER_EMAIL` | Owner sign-in email |
| `OWNER_PASSWORD` | Owner sign-in password. Applied again whenever the container starts |
| `OWNER_NAME` | Name stored on the owner account |
| `MYSQL_ROOT_PASSWORD` | Root password for the MySQL container |
| `COOKIE_SECURE` | Optional. `true` or `false` forces the owner cookie. Leave unset to follow HTTPS automatically |
| `SEED_SAMPLE_ORDERS` | Optional. `true` loads demo orders into an empty database even in production |

`.env.example` lists the names. The real `.env` stays on the machine and is not in Git.

## Production shape

Recommended host: one AWS EC2 instance in Mumbai (`ap-south-1`), about 2 GB of RAM, running this `docker compose` file. MySQL runs in the same compose file, not as a separate RDS database.

Without a domain, customers use `http://` plus the server's Elastic IP. Put that full URL in the QR code. An Elastic IP stays the same when the server reboots. The default `ec2-....amazonaws.com` name can change after a stop/start, which would break printed QR codes.

HTTPS (the padlock) needs a domain. The `Caddyfile` in this repo is ready for that later. Until then the site is plain HTTP.

Rough cost after AWS credits run out: about $20 a month for the server and disk, with no domain. Traffic for this store stays inside the free transfer allowance.

Open port 3000 in the AWS security group so browsers can reach the site. Do not open port 3306 or 3307 to the internet. MySQL should only be reachable by the web container.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run setup` | Create tables and seed |
| `npm run db:push` | Update tables to match the schema |
| `npm run db:seed` | Seed owner, catalog, and sample orders |
| `npm run db:reset` | Wipe catalog and orders, then seed again |
| `npm run typecheck` | TypeScript check |
| `docker compose up --build` | Build the image and start web + MySQL |
| `docker compose logs web` | Read the website container log |
