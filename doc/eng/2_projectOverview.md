# General Overview of the Liquidator Service

## Introduction

The Liquidator service is a service that tracks potential positions for liquidations and subsequently liquidates them. Currently, Liquidator operates in DeFi liquidity protocols such as AAVE V1, AAVE V2, AAVE V3, and Compound. The main goal of the project is to identify users who are in the liquidation risk zone and liquidate their positions while making a profit from the liquidations.

## Structure of the Liquidator Service

The Liquidator service consists of two main sub-services:

1. **LiqRegistry**: Responsible for collecting and filtering users who have interacted with supported liquidity protocols. It finds potential positions for liquidation.
2. **LiqExecutor**: Responsible for executing the liquidation of user positions identified by LiqRegistry.

This documentation focuses on describing the business logic of the LiqRegistry service.

## Business Logic of LiqRegistry

LiqRegistry works with liquidity protocols AAVE V1, AAVE V2, AAVE V3, and Compound. The main task of the service is to find users who have taken a loan in any of these protocols and track their Health Factor (an indicator of how close the user is to liquidation), Borrow, and Collateral.

The LiqRegistry process can be divided into three main stages:

1. **Blockchain filtering**: The service filters the entire blockchain to find users who have interacted with one of the four supported protocols.
2. **User filtering**: Found users are filtered based on certain criteria such as minimum loan size (Borrow), minimum collateral size (Collateral), and Health Factor.
3. **Detailed analysis of selected users**: More detailed analysis of certain users. Analysis of their assets in Borrow and Collateral. Also, simulation of Health Factor changes based on price change transactions (Transmit).
4. **Data transfer to LiqExecutor**: After filtering, information about users subject to liquidation is transferred to the LiqExecutor service for liquidation execution.

LiqRegistry is a key component of the Liquidator system, responsible for finding and tracking liquidity protocol users potentially suitable for liquidation. LiqRegistry consists of seven sub-services, each performing a specific role in the process of filtering and monitoring users:

1. **Archive** - collects all users who have ever interacted with each individual protocol, starting from the protocol creation block. Archive also tracks new users in real-time.

2. **Blacklist** - the first stage of filtering users by Health Factor, MinBorrow, and MinCollateral parameters. It filters out users whose parameters are too far from potentially interesting for liquidation.

3. **Proxy** - an auxiliary service for Subgraph that distributes users among Subgraph instances for efficient processing.

4. **Subgraph** - filters users, focusing on those whose Health Factor, MinBorrow, and MinCollateral parameters are close to the possibility of liquidation. Sends filtered users to DataFetcher.

5. **DataFetcher** - makes decisions about liquidating users or adding them to the WatchList for further monitoring based on detailed analysis of their parameters.

6. **TransmitFetcher** - monitors Transmit transactions in the mempool to detect changes in token prices affecting the Health Factor of users from the WatchList, allowing them to be liquidated in the same block where the Health Factor changes.

Additionally, the

7. **Events** service is responsible for monitoring new block outputs, sending these blocks via MQTT, and updating globalReservesData.

All these services work as a single mechanism, gradually narrowing down the list of users at each stage to ultimately identify those most suitable for liquidation and pass these users to the next service, liqExecutor. This approach allows efficient use of limited system resources when working with a large number of liquidity protocol users.

Each service has its own `filters` which specify parameters for selection. As they pass through the funnel, the filters narrow to weed out irrelevant users for liquidation.

```javascript
    "min_collateral_amount": 0.01,
    "min_borrow_amount": 0.01,
    "min_health_factor": 0.5,
    "max_health_factor": 1.8
```

You can find detailed operation of each service in separate subsections of the documentation.

## Business Logic of LiqExecutor

After finding positions for liquidation by the LiqRegistry service, LiqExecutor analyzes the possibility of liquidation and potential profit from it, considering possible liquidation paths, gas price for the liquidation transaction, etc.

![LiqRegistry Flow Diagram](../images/serviceFlow.jpg)