# Liquidation Registry

Liquidation Registry repository contains a few separately services: searcher, subgraph service, archive, history.

- History service can be executed by **node historyExecuter.js.** It fetches history from all protocols at the same time. Its functions run with some interval that can be changed right in code.

- Archive service is needed for cases when some subgraph api is down, and we need some other way to get protocol users. It has two main features inside: listener that saves new events and function that is looking for past protocol events.
  It's executed through **node archiveExeturer.js** separately for each protocol. Can be executed all together with **SERVICE=ARCHIVE node runConcurrently.js**

- Subgraph service is used to make a lot of requests to blockchain and filter users with needed health factor. It gets all protocol users from subgraph or in case when subgraph is down - archive, and checks if they are appropriate for searcher service.
  It runs separately for each protocol but can be executed all together with **SERVICE=SUBGRAPH node runConcurrently.js**

- Searcher service is a service that mainly does only the second part of subgraph service. It doesn't need to get users from subgraph or archive, it gets already filtered users from registry and like subgraph makes requests to blockchain to check if users are valid.
  It updates the data in registry or deletes user it's inappropriate anymore. If it finds user with good stats it sends event to path factory service.
  It runs separately for each protocol but can be executed all together with **SERVICE=SEARCHER node runConcurrently.js**
  !!! Can work only with Liquity, Maker_DAO

- Blacklist service checks hf, collateral, borrow for users from Archive service and
  adds user to blacklist in Redis, key`s template : 'liq-registry:blacklist:[protocol]'. Blacklist service
  works by loop.
  It runs separately for each protocol but can be executed all together with **SERVICE=BLACKLIST node runConcurrently.js**
  If you want to find user addresses in blacklist using redis:

  - connect to redis

  ```
  redis-cli -h [hostname] -p [port]
  ```

  - find all users for protocol

  ```
  SMEMBERS liq-registry:blacklist:[protocol]
  ```

  example:

  ```
  SMEMBERS liq-registry:blacklist:V1
  ```

  - find user in blacklist

  ```
  SMISMEMBER liq-registry:blacklist:[protocol] [user...]
  ```

  example:

  ```
  SMISMEMBER liq-registry:blacklist:V1 '0x943a6Eda303F63EFddA7BF9028f860B87A247869' '0x943a6Eda303F63EFddA7BF9028f860B87A247864'
  ```

  expected output if user in blacklist: 1, 0

- DataFetcher service: This works almost like the old searcher. However, when the searcher begins to watch a user in a loop, DataFetcher adds the user to Redis with the key 'liq-registry:data-fetcher:[protocol]:[asset]'. If the searcher removes the user from the watch loop, DataFetcher deletes the user from Redis using the key 'liq-registry:data-fetcher:[protocol]:[asset]'.
  !!! Can work only with V1, V2, V3, Compound
  It runs separately for each protocol but can be executed all together with **SERVICE=DATA_FETCHER node runConcurrently.js**

# Install

1. Install node js.
2. Run command 'npm install'
3. Create a Main.json file similar to Main.json.example in the configs folder
4. Fill config with data in configs/Main.json
5. Run command 'npm run <service> --config configs/Main.json'. Without config path, service will try to use configs/Main.json as default config.

# Sequalize

Run all new migrations

```
npm run db:migrate
```

Undo the momst recent migrations

```
npm run db:migrate:undo
```

# PM2

Install

```
npm install pm2 -g
```

### Run services

Run all services

```
pm2 start ./all.config.js
```

Run specific service, (eg archive)

```
pm2 start ./archive.config.js
```

Run service only for specific protocols

```
PROTOCOLS="V1, V2" pm2 start archive.config.js
```

### Manage

https://pm2.keymetrics.io/docs/usage/quick-start/#managing-processes

# Updates

## 2024-05-13

1. Created branch V.0.0.7
2. Migrated the blacklist service to the new architecture.
3. Integrated the new blacklist into the proxy service.
4. Added some log events and comments to other services.

## 2024-05-2

1. Fixed a bug where 29/30 users were skipped in the transmitFetcher.
2. Refactored the transmitFetcher for better readability.
3. Changed the names of some functions in transmitFetcher and dataFetcher for better understanding of their purpose.
4. Added symbols: ✓ x ○ E to the logs for better visual readability.
5. Changed the names of some logs for better understanding of their contents.

## 2024-04-12

1. Duplicated console.log's to mqqt logger

## 2024-04-09

1. The events service was transitioned to a new architecture.
2. The service can now receive new blocks via ws, that significantly reducing the load on the Ethereum node.
   In eventsServices.json, users can choose between WebSocket (ws) and http modes.
3. Logging has been added to an MQTT logger, enhancing the service's monitoring capabilities.

## 2024-04-03

1. Code review was conducted by noizyman and AlexSerbinov.
2. In the proxy stage (after the blacklist), all user addresses are converted to toLowerCase().
3. Events have been modified to comply with the new logger. Unused events have been removed.
4. Unused parameters have been removed from main.json.
5. Configurations from defaultSettings have been migrated to the parameters of each individual service.
6. Many parameters have been moved to [serviceName]Services.json.
7. Many new comments have been added to the code.

## 2024-03-29

1.  Migrated the Archive service from using a database to Redis.

## 2024-03-26

1.  Transitioned Archive to a new architecture.

## 2024-03-22

1.  Switched the simulator to use a transaction simulator instead of a node.
2.  Changed the queue mechanism to process users in batches of 20, instead of one by one.

## 2024-03-15

1.  Upgraded Subgraph to a new architecture. Set up message reception from the Proxy service.
2.  Configured round-robin operation correctly.

## 2024-03-08

1.  Developed the Proxy service. The Proxy service now forwards users to the Subgraph service.

## 2024-02-29

1. Migrated the `dataFetcher` service to a new architecture. The configuration file for launching services is located in `services.json`.
2. Standartised all js files with prettier and .pretierrc file config was added to git repo.

## 2024-02-27

1. Migrated the `transmitFetcher` service to a new architecture. The configuration file for launching services is located in `services.json`.
2. Removed all database (db) related components as part of the migration process.
3. Renamed various files and folders to better align with the new architecture and naming conventions.
4. Deleted unused `helpers` to streamline the codebase and improve maintenance efficiency.
5. Removed old MQTT notifiers. Now, we use `$.send` from the new architecture for notifications.

## 2023-09-11

1. Added new service "Blacklist". Service checks hf, collateral, borrow for users from Archive service and
   adds user to blacklist in Redis, key`s template : 'liq-registry:blacklist:[protocol]'. Blacklist service
   works by loop.
2. Added new module for work with Redis DB, info in folder "redis".
3. Added blacklist checking to subgraph service. Code using redis module check every user to exists in Redis blacklist
   if user is in redis blacklist, subgraph skips processing.

## 2023-09-12

1. Assembled Searcher service for MakerDAO.
2. Update events.service with Maker events.

## 2023-09-18

1. Fixed BlackList startup.
2. Added pm2 configs.

## 2023-09-20

1. Subgraph: Fixed subgraph run by loop
2. Redis: Changed package for work with Redis to ioredis
3. Redis: Added methods for work with redis set
4. Blacklist: Changed functions for use redis set
5. Subgraph: Changed function for use redis set (multi checking)

## 2023-10-03

1. Added a new service, DataFetcher (similar to searcher).
2. Added functions to the Redis module to work with the new services, DataFetcher and TransmitFetcher. (DataFetcher handles writing/deleting, while TransmitFetcher handles reading).
3. Important notice! Old searcher runs only: Liquity, Maker_DAO. New service DataFetcher runs: V1, V2, V3, Compound
4. Fix archive for running on prod (getLatestRedisBlock: let latestArchiveBlock = 0)

## 2023-10-31

1. History: Add transmit txn to liquidations from history

# Requirements:

1. Redis-server at least 6.2++
2. PSQL 12++ works fine
