# Vectorizing Data with pgai in Timescale and Querying it with Hasura

## Outcomes

- [ ] Create a sample project that highlights the power of Timescale's pgai extension, demonstrating the ability to
      vectorize data within PostgreSQL.
- [ ] Create a sample project that highlights the power of Hasura DDN Pacha, allowing realtime authorized queries across
      data sources.

## Project architecture

The Docker compose provides the best overview of what we'll be building:

```yaml
version: "3.9"
services:
  timescaledb:
    image: timescale/timescaledb:latest-pg14
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: trading_db
    volumes:
      - timescale_data:/var/lib/postgresql/data
      - ./init-scripts/timescaledb:/docker-entrypoint-initdb.d

  mysql:
    image: mysql:latest
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: trading_db
      MYSQL_USER: user
      MYSQL_PASSWORD: password
    volumes:
      - mysql_data:/var/lib/mysql
      - ./init-scripts/mysql:/docker-entrypoint-initdb.d

  pacha:
    # TODO: Add information here, including that it depends on ☝️  services

volumes:
  timescale_data:
  mysql_data:
```

However, this will also be our directory structure:

```tree
timescale-pacha/
├── docker-compose.yaml
├── hasura/
│   ├── pacha/
├── init-scripts/
│   ├── mysql/
│   │   └── mysql_seed_corrected.sql
│   └── timescaledb/
│       └── seed.sql
└── README.md
```

### PostgreSQL

#### Trader table

```sql
CREATE TABLE trader (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

The `trader` table holds the basic information of traders, including a unique ID, name, and email. The `created_at`
field records the time the trader was added to the system. This table can be expanded with additional fields as needed.

#### Stock table

```sql
CREATE TABLE stock (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    sector VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

The `stock` table maintains information about different stocks. Each stock has a unique symbol, name, and optional
sector information. The `created_at` field records the time the stock was added to the system.

#### Ticks table

```sql
CREATE TABLE ticks (
    id SERIAL PRIMARY KEY,
    trader_id INTEGER REFERENCES trader(id),
    symbol VARCHAR(10) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    volume INTEGER NOT NULL,
    tick_time TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

The `ticks` table records the trading activity, with each row representing a tick (or trade) made by a trader. It
includes references to the `trader` table via `trader_id`, and records details such as the trading symbol, price,
volume, and the time of the tick. This structure supports efficient querying and analysis of trading data.

### MySQL

#### Orders table

```sql
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trader_id INT,
    order_type ENUM('buy', 'sell') NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    order_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

The `orders` table in MySQL will maintain a relationship with the `trader` table via Hasura DDN, recording buy and sell
orders placed by traders. It includes details such as the order type, trading symbol, quantity, price, and the time the
order was placed.

#### Portfolio table

```sql
CREATE TABLE portfolio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trader_id INT,
    symbol VARCHAR(10) NOT NULL,
    quantity INT NOT NULL,
    average_price DECIMAL(10, 2) NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    bio VARCHAR(255) NOT NULL
);
```

The `portfolio` table in MySQL tracks the holdings of each trader, including the symbol, quantity held, average purchase
price, and the last updated timestamp. This table helps in maintaining the current portfolio status of each trader and
can be used for realtime portfolio valuation and management.

### Pacha

Which has DDN under-the-hood.

## Getting started

### Step 1. Clone the repo

```sh
git clone https://github.com/Birmingham-AI/realtime-vector.git
```

### Step 2. Build and run the images

From the root of the project, and with the Docker daemon running, build the images and start them up in the background:

```sh
docker compose up -d
```

You can run `docker ps` to check and see that all services are running. Then, when done, run `docker compose down` to
stop them.

### Step 3. Interact with your DBs

You can access Timescale using `psql` by running this command:

```sh
psql postgresql://postgres:postgres@localhost:5432/trading_db
```

And MySQL by running:

```sh
mysql -h 127.0.0.1 -P 3306 -u user -p trading_db
```

And entering `password` for the password when prompted.
