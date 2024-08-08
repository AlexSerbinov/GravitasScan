# Project Launch

## General Instructions

To launch the project, you need to perform the following steps:

1. Make sure you have pm2 installed: `npm install -g pm2`
2. Install npm packages with the command: `npm install`
3. Set up all necessary infrastructure (Infrastructure Setup section)
4. Launch all services with the command: `npm run all`
5. To stop a specific service, use the command: `pm2 stop <service name or namespace>`
6. To completely stop all services, use the command: `pm2 stop all`
7. After updating the code, always execute the following commands, otherwise changes will not be accounted for in pm2: `pm2 stop all` `npm run all`

## Infrastructure Setup

The project infrastructure has two environments: development and production. For each of these environments, you need to enable its own VPN.

## Connecting to Redis

Configuration file: `configs/Main.json`

## Connecting to MQTT host

Configuration file: `sys.config.json`

## Connecting to Ethereum node

Configuration file: `configs/Main.json`

Note: For initial scanning, the Archive service must have access to an archival full Ethereum node.

## Access to local Enso simulator

It is necessary to ensure access to the local Enso simulator for the correct operation of services.

Links to the Enso simulator are specified in the files:

- `configs/workers/blacklistServices.json`
- `configs/workers/subgraphServices.json`
- `configs/workers/dataFetcherServices.json`
- `configs/workers/transmitFetcherServices.json`

## Service Dependencies

All services depend on `globalReservesData`, which comes on the topic `data/reserves/` (for example, `data/reserves/V1`). If your services have started but nothing is happening, check if the reason is that `globalReservesData` updates from the `Events` service have not arrived.

Note: Events service is in the repository

## Transmit Fetcher Service Dependency

The Transmit Fetcher service depends on an external service that sends transactions on the topic `listener/transmit`. Service name: `ETH_ImpossibleParser`
https://github.com/CybridgeTechnologies/ETH_ImpossibleParser

Tip: You can subscribe to topics from the terminal to check if transmits are coming:
`mqtt sub -h "<your_mqtt_host>" -t "listener/transmit"`

Note: Transmits come quite rarely, waiting time can be up to 30 minutes.

## Log Tracking

For tracking logs on prod or dev infrastructure, the `UniversalLogger.js.log` service must be running

(Optional) https://github.com/CybridgeTechnologies/UniversalLogger.js.log

## Running in debug mode

Running in debug mode is done with the command:
`npm run debug<ServiceName> <Protocol><ServiceName>`
For example:
`npm run debugProxy V1Proxy`

To run the events service in debug mode, you don't need to specify the protocol name, as the service is common for all protocols.
To run events in debug mode
`npm run debugEvents Events`

## Launch Scripts

All launch scripts can be found in `package.json`

I'd be happy to translate more sections if you need. Would you like me to continue with the next part?

Here's the literal translation of the provided section into English:

# Architecture Description

## Introduction

The architecture of our project is based on the Cinnamon system, which is used by most projects in our company. This architecture involves the use of certain patterns and standards that help ensure uniformity and efficiency of all services.

#### Configuration Files

##### Global Configurations

All global configurations are stored in the `configs/main.json` file. This file contains:

- URL and port for Redis
- Links to Ethereum node
- Other general variables necessary for the operation of services

##### Service Configurations

Each project has its own configurations, which are stored in the `configs/workers` folder. The main configuration file for each project is named `<serviceName>services.json`, for example: `blacklistServices.json`. This file defines:

- `Default Settings` object, which contains shared settings for all protocols
- Settings for individual protocols (AAVE V1, AAVE V2, AAVE V3, Compound). Here, a parameter hierarchy works. If some settings are specified in `Default Settings`, they are used first. But if some parameter is specified in a specific protocol, for example `V1`, then these settings will be higher in the hierarchy. This is done to avoid parameter duplication.

##### MQTT Communication

The `sys.config.json` file specifies the URL for communication via MQTT topics. All services of our company, including liquidation services, work through MQTT, sending messages to each other with certain topics. Each service has defined topics for sending (`Notify`) and listening (`Listen`).

##### REDIS - Main Database

In the early versions, PostgreSQL was used as the main database. Now, the only database of the project is Redis.
All `redis namespaces` are specified in the `configs/redisNamespaces.js` file

##### Example of Topic Configuration

The configuration files of each service specify the `Notify` and `Listen` parameters. For example, in the `services.json` file:

```json
    "listen": {
      "onReservesData": {
        "topic": "data/reserves/V1",
        "roundrobing": false
      }
    },
    "notify": {
      "drain": {
        "topic": "event/drain/subgraph/V1"
      }
    },
```

##### Service Instances

All services are launched in four instances for each protocol (AAVE V1, AAVE V2, AAVE V3, Compound). For example, you can launch the entire system (archive, proxy, subgraph, data fetcher, and transmit) for just one protocol, for example, V1.

#### Folder Structure

##### Systems Folder

This is the main folder that contains files responsible for the operation of our system's architecture.

##### Configs Folder

All configuration files are stored here.

##### Services Folder

Contains entry points for each service.

##### Lib Folder

Contains all auxiliary libraries. The `lib/services` folder stores all working files of certain projects. For example, the `subgraph` project has its own separate folder with settings and description, which is located in `lib/services/subgraph`

#### OOP Patterns

All services are built according to the principles of object-oriented programming (OOP). For example:

- **fetcher.js** – main class for handlers
- **fetcher-aave.js** – class for AAVE, which
- **fetcher-aave-v1.js**, **fetcher-aave-v1.js**, **fetcher-aave-v1.js** – classes for different versions of AAVE that inherit from **fetcher-aave.js**
- **fetcher-compound.js** – class for the compound protocol, which inherits directly from the main class **fetcher.js**

#### Queue Mechanism

Some of our services, such as Blacklist and Subgraph, have a queue mechanism. The purpose of the queue is to smooth out peak loads that come to the service. For example, the Proxy service sends tens of thousands of users to Subgraph in a few seconds. Subgraph adds these users to the queue and then processes them one by one or in groups, in queue order. After processing, the queue initiates an `emit` event - which notifies that the queue is empty.

#### Using Forks

##### What are Forks

Each service can operate in multiple forks mode, i.e., simultaneous launch of multiple instances. This can be useful for load distribution and improving service performance. However, currently, there's no point in launching all services in multiple forks mode. This makes sense only for the Subgraph service, especially when one protocol (for example, AAVE V2) needs to work with several independent simulator instances. If you launch services in multiple forks mode but use the same simulator instance, you won't achieve any speed improvement.
Currently, we've achieved such service speed that it works optimally in `forks=1` mode.

##### Fork Parameters

In the service configuration files, you can specify the `forks` and `roundrobing` parameters:

- **forks** – number of simultaneous service instances. For example, if `forks=2`, the service will be launched in two instances.
- **roundrobing** – parameter that determines how data is distributed between instances:
  - **true** – data from MQTT comes to instances in turn. For example, if 2 Subgraph instances are running, Proxy will send the first 30 users to the first instance, and the next 30 to the second instance.
  - **false** – data comes to each instance in parallel. For example, Proxy will send 30 users to each instance simultaneously.

![Cinamon forking mode](../images/forkingMode.jpg)

## Conclusion

The project architecture is built on the Cinnamon system and uses standardized templates to ensure uniformity and efficiency of operation. Each service has its own configuration files that define input and output points, as well as parameters for interaction with other services via MQTT. The queue mechanism helps smooth peak loads, ensuring stable service operation. Services are launched through PM2, which ensures stability, background operation, and ease of process management. Fork mode, in theory, allows scaling services to increase productivity.
