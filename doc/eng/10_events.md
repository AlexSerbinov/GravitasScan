# Events

Events is one of the critically important services in the Liquidator structure, which performs two main functions: monitoring new blocks and monitoring GlobalReservesData.

## Functions of the Events service

### 1. Monitoring new blocks:

- The Events service tracks the appearance of new blocks in the blockchain.
- Each time a new block appears, the service sends an MQTT message to the Topic `data/block` to all other services that need this information, for example, the Archive service.
- This allows all interested services to receive information about new blocks in a timely manner and not to load the ETH node with their own requests.

### 2. Monitoring GlobalReservesData:

- The Events Service is also responsible for monitoring and updating GlobalReservesData.
- GlobalReservesData contains information about tokens used by our liquidity protocols.
- Each entry in GlobalReservesData includes the following fields:
  - List of ERC20 tokens.
  - Decimals: number of decimal places for each token.
  - Price: token price relative to ETH or USD (for AAVE V1 and AAVE V2 protocols, the price is indicated to ETH, for AAVE V3 and Compound - to USD).
  - Bonus: percentage of bonus that the protocol provides for liquidation of certain positions on specific tokens.

GlobalReservesData is critically important for several services, including Subgraph, DataFetcher, and TransmitFetcher, as these services cannot function without up-to-date information about tokens.

## Operating modes of Service Events

Service Events can operate in two modes depending on the type of connection to the Ethereum node:

### 1. WebSocket:

- Connecting to the Ethereum node via WebSockets allows receiving data in real-time.
- This reduces the load on the node and ensures fast information transfer.

### 2. HTTP:

- Connecting to the Ethereum node via HTTP allows making constant requests at a certain interval (for example, every 10 ms).
- Although there is a theory that HTTP requests can be faster, some experiments have shown that this is not always the case.
- Timeout parameters can be configured depending on needs.
- GlobalReservesData is sent separately for each protocol, for example `data/reserves/V1` since each protocol has its specific set of tokens. This ensures accuracy and relevance of data necessary for calculating the position price.

## Example of globalReservesData:

```json
{
  "0x6B175474E89094C44Da98b954EedeAC495271d0F": {
    "price": {
      "type": "BigNumber",
      "hex": "0x010ebb1fcaa438"
    },
    "decimals": {
      "type": "BigNumber",
      "hex": "0x12"
    },
    "bonus": {
      "type": "BigNumber",
      "hex": "0x69"
    }
  },
  "0x0000000000085d4780B73119b644AE5ecd22b376": {
    "price": {
      "type": "BigNumber",
      "hex": "0x010e2dda4f252a"
    },
    "decimals": {
      "type": "BigNumber",
      "hex": "0x12"
    },
    "bonus": {
      "type": "BigNumber",
      "hex": "0x69"
    }
  }
}
```

Note: You can check if globalReservesData is coming to your service by subscribing to one of the topics from the terminal.
For example:

`mqtt sub -h "10.10.100.87" -t "data/reserves/V1"`

## Conclusion

The Events service provides reliable and timely transmission of critically important information, allowing the entire Liquidator system to operate efficiently and without interruption.
