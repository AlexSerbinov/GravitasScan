Liquidator
Liquidator is a comprehensive service consisting of two sub-services: LiqRegistry and LiqExecutor. This documentation outlines the business logic and architecture of the LiqRegistry service.

Overview
LiqRegistry
The LiqRegistry service interacts with liquidity protocols such as AAVE V1, AAVE V2, AAVE V3, and Compound. While support for MakerDAO and Liquity exists in the codebase, the new version of the service no longer uses these protocols.

The primary function of LiqRegistry is to identify users who have taken loans in any of the supported protocols and monitor their Health Factor (HF). The Health Factor indicates how close a user is to liquidation. Users at risk of liquidation are tracked, and when it's determined that a user can be liquidated, the relevant event is passed to the LiqExecutor service.

Key Tasks of LiqRegistry
Filter the entire blockchain to find users interacting with one of the four protocols.
Filter these users based on specific criteria: minimum loan size (Borrow), minimum collateral size (Collateral), and Health Factor.
After filtering, pass information about users eligible for liquidation to the LiqExecutor service for execution.
Structure of LiqRegistry
LiqRegistry consists of six sub-services responsible for data collection and filtering:

Archive
Blacklist
Proxy
Subgraph
DataFetcher
TransmitFetcher
Additionally, an Events service monitors new block creation and sends these blocks via MQTT topic, also monitoring the update of globalReservesData.

Sub-services Description
Archive
The Archive service collects all users who have ever interacted with each specific protocol.

Operation of Archive:

Initialization:
Example: For AAVE V2, the service starts scanning from the block where the protocol was created.
Historical Data Scanning:
Scans all interactions with AAVE V2 smart contracts from the creation block to the present day.
Records all users in Redis.
Current Status:
Approximately 30,000 users for Compound, 18,000 for AAVE V3, 54,000 for AAVE V2, and 10,000 for AAVE V1.
Real-time User Monitoring:
Continuously checks new users interacting with the protocol and records this information in Redis.
Blacklist
Blacklist is the first filtration sub-service in LiqRegistry, filtering users based on Health Factor, MinBorrow, and MinCollateral.

Operation of Blacklist:

Initialization:
Uses the user base collected by the Archive.
User Filtration:
Filters users with Health Factor, MinBorrow, and MinCollateral values that are not suitable for liquidation.
Cyclical Scanning:
Continuously scans and updates the user list.
Adding to Blacklist:
Updates the Blacklist with users whose parameters are not of interest for further processing.
Proxy
Proxy helps distribute users efficiently among multiple instances of Subgraph.

Operation of Proxy:

Initialization:
Retrieves users from Archive.
Filters out Blacklisted users.
User Distribution:
Sends users to Subgraph in batches.
Processing and Feedback:
Sends users to Subgraph and waits for completion signals before sending more.
Launch and Settings:
Ensures Subgraph is running before Proxy starts to avoid data loss.
Subgraph
Subgraph filters users for potential liquidation based on their Health Factor, MinBorrow, and MinCollateral.

Operation of Subgraph:

Initialization:
Receives users from Proxy.
User Filtration:
Filters users with Health Factor values close to liquidation thresholds.
Processing Cycle Speed:
Processes users rapidly to ensure timely liquidation decisions.
Interaction with DataFetcher:
Sends users close to liquidation to DataFetcher for further analysis.
DataFetcher
DataFetcher is a final service that decides on user liquidation or adding users to WatchList for further monitoring.

Operation of DataFetcher:

Initialization:
Accepts users only from Subgraph.
User Analysis:
Analyzes Health Factor, Borrow, and Collateral of users.
Decision Making:
Decides on liquidation or adding users to WatchList based on detailed criteria.
Monitoring and Updating:
Monitors and updates user status continuously.
TransmitFetcher
TransmitFetcher monitors Transmit transactions in mempool for token price changes affecting users' Health Factor.

Operation of TransmitFetcher:

Transmit Monitoring:
Listens to Transmit transactions.
User Analysis:
Simulates transactions to predict changes in Health Factor.
Decision Making:
Triggers liquidation events for users whose Health Factor drops below 1.
Advantages:
Enables timely liquidation by predicting future block changes.
