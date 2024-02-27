const SERVICE_STATUS = {
  ACTIVE: "active",
  INIT: "initiation",
  IDLE: "idle",
  OFF: "off",
  ERROR: "error",
}

const ORACLE = "0x76B47460d7F7c5222cFb6b6A75615ab10895DDe4" // goerli "0x2cb0d5755436ED904D7D0fbBACc6176286c55667"
const ETH_USD_ORACLE = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419"
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" // goerli "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6"

const PROTOCOLS_CONFIG = {
  V1: {
    POOL: "0x398eC7346DcD622eDc5ae82352F02bE94C62d119",
    CORE: "0x3dfd23A6c5E8BbcFc9581d2E864a68feb6a076d3",
    CREATED_AT_BLOCK: 9241022,
  },
  V2: {
    POOL: "0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9", // goerli "0x4bd5643ac6f66a5237E18bfA7d47cF22f1c9F210",
    DATA_PROVIDER: "0x057835Ad21a177dbdd3090bB1CAE03EaCF78Fc6d", // goerli "0x927F584d4321C1dCcBf5e2902368124b02419a1E",
    CREATED_AT_BLOCK: 11362579, // goerli 7480475,
  },
  V3: {
    POOL: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
    DATA_PROVIDER: "0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3",
    CREATED_AT_BLOCK: 16291127,
  },
  Compound: {
    CONTROLLER: "0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B",
    CETH: "0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5", // Compound Ether (cETH)
    LIQUIDATION_AGGREGATOR: "0xBafE01ff935C7305907c33BF824352eE5979B526",
    CREATED_AT_BLOCK: 7710671,
  },
  Liquity: {
    CONTROLLER: "0x24179CD81c9e782A4096035f7eC97fB8B783e007",
    TROVE_MANAGER: "0xA39739EF8b0231DbFA0DcdA07d7e29faAbCf4bb2",
    CREATED_AT_BLOCK: 12178582,
  },
  MakerDAO: {
    DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    DOG: "0x135954d155898D42C90D2a57824C690e0c7BEf1B",
    CDP_MANAGER: "0x5ef30b9986345249bc32d8928b7ee64de9435e39",
    ILK_REGISTRY: "0x5a464C28D19848f44199D003BeF5ecc87d090F87",
    VAT: "0x35d1b3f3d7966a1dfe207aa4514c12a259a0492b",
    SPOTTER: "0x65c79fcb50ca1594b025960e539ed7a9a6d434a3",
    CDP_MANAGER_CREATED_AT_BLOCK: 8928198,
    DOG_CREATED_AT_BLOCK: 12246358,
  },
}

const compoundMarkets = {
  "0x6C8c6b02E7b2BE14d4fA6022Dfd6d75921D90E4E": {
    underlying: "0x0D8775F648430679A709E98d2b0Cb6250d2887EF",
    underlyingDecimals: 18,
    underlyingSymbol: "BAT",
    cToken: "0x6C8c6b02E7b2BE14d4fA6022Dfd6d75921D90E4E",
    cTokenDecimals: 8,
    cTokenSymbol: "cBAT",
  },
  "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643": {
    underlying: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    underlyingDecimals: 18,
    underlyingSymbol: "DAI",
    cToken: "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643",
    cTokenDecimals: 8,
    cTokenSymbol: "cDAI",
  },
  "0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5": {
    underlying: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    underlyingDecimals: 18,
    underlyingSymbol: "ETH",
    cToken: "0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5",
    cTokenDecimals: 8,
    cTokenSymbol: "cETH",
  },
  "0x158079Ee67Fce2f58472A96584A73C7Ab9AC95c1": {
    underlying: "0x1985365e9f78359a9B6AD760e32412f4a445E862",
    underlyingDecimals: 18,
    underlyingSymbol: "REP",
    cToken: "0x158079Ee67Fce2f58472A96584A73C7Ab9AC95c1",
    cTokenDecimals: 8,
    cTokenSymbol: "cREP",
  },
  "0x39AA39c021dfbaE8faC545936693aC917d5E7563": {
    underlying: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    underlyingDecimals: 6,
    underlyingSymbol: "USDC",
    cToken: "0x39AA39c021dfbaE8faC545936693aC917d5E7563",
    cTokenDecimals: 8,
    cTokenSymbol: "cUSDC",
  },
  "0xf650C3d88D12dB855b8bf7D11Be6C55A4e07dCC9": {
    underlying: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    underlyingDecimals: 6,
    underlyingSymbol: "USDT",
    cToken: "0xf650C3d88D12dB855b8bf7D11Be6C55A4e07dCC9",
    cTokenDecimals: 8,
    cTokenSymbol: "cUSDT",
  },
  "0xB3319f5D18Bc0D84dD1b4825Dcde5d5f7266d407": {
    underlying: "0xE41d2489571d322189246DaFA5ebDe1F4699F498",
    underlyingDecimals: 18,
    underlyingSymbol: "ZRX",
    cToken: "0xB3319f5D18Bc0D84dD1b4825Dcde5d5f7266d407",
    cTokenDecimals: 8,
    cTokenSymbol: "cZRX",
  },
  "0x35A18000230DA775CAc24873d00Ff85BccdeD550": {
    underlying: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    underlyingDecimals: 18,
    underlyingSymbol: "UNI",
    cToken: "0x35A18000230DA775CAc24873d00Ff85BccdeD550",
    cTokenDecimals: 8,
    cTokenSymbol: "cUNI",
  },
  "0x70e36f6BF80a52b3B46b3aF8e106CC0ed743E8e4": {
    underlying: "0xc00e94Cb662C3520282E6f5717214004A7f26888",
    underlyingDecimals: 18,
    underlyingSymbol: "COMP",
    cToken: "0x70e36f6BF80a52b3B46b3aF8e106CC0ed743E8e4",
    cTokenDecimals: 8,
    cTokenSymbol: "cCOMP",
  },
  "0xccF4429DB6322D5C611ee964527D42E5d685DD6a": {
    underlying: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    underlyingDecimals: 8,
    underlyingSymbol: "WBTC",
    cToken: "0xccF4429DB6322D5C611ee964527D42E5d685DD6a",
    cTokenDecimals: 8,
    cTokenSymbol: "cWBTC",
  },
  "0x12392F67bdf24faE0AF363c24aC620a2f67DAd86": {
    underlying: "0x0000000000085d4780B73119b644AE5ecd22b376",
    underlyingDecimals: 18,
    underlyingSymbol: "TUSD",
    cToken: "0x12392F67bdf24faE0AF363c24aC620a2f67DAd86",
    cTokenDecimals: 8,
    cTokenSymbol: "cTUSD",
  },
  "0xFAce851a4921ce59e912d19329929CE6da6EB0c7": {
    underlying: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    underlyingDecimals: 18,
    underlyingSymbol: "LINK",
    cToken: "0xFAce851a4921ce59e912d19329929CE6da6EB0c7",
    cTokenDecimals: 8,
    cTokenSymbol: "cLINK",
  },
  "0x4B0181102A0112A2ef11AbEE5563bb4a3176c9d7": {
    underlying: "0x6B3595068778DD592e39A122f4f5a5cF09C90fE2",
    underlyingDecimals: 18,
    underlyingSymbol: "SUSHI",
    cToken: "0x4B0181102A0112A2ef11AbEE5563bb4a3176c9d7",
    cTokenDecimals: 8,
    cTokenSymbol: "cSUSHI",
  },
  "0xe65cdB6479BaC1e22340E4E755fAE7E509EcD06c": {
    underlying: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
    underlyingDecimals: 18,
    underlyingSymbol: "AAVE",
    cToken: "0xe65cdB6479BaC1e22340E4E755fAE7E509EcD06c",
    cTokenDecimals: 8,
    cTokenSymbol: "cAAVE",
  },
  "0x80a2AE356fc9ef4305676f7a3E2Ed04e12C33946": {
    underlying: "0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e",
    underlyingDecimals: 18,
    underlyingSymbol: "YFI",
    cToken: "0x80a2AE356fc9ef4305676f7a3E2Ed04e12C33946",
    cTokenDecimals: 8,
    cTokenSymbol: "cYFI",
  },
  "0x041171993284df560249B57358F931D9eB7b925D": {
    underlying: "0x8E870D67F660D95d5be530380D0eC0bd388289E1",
    underlyingDecimals: 18,
    underlyingSymbol: "USDP",
    cToken: "0x041171993284df560249B57358F931D9eB7b925D",
    cTokenDecimals: 8,
    cTokenSymbol: "cUSDP",
  },
  "0x7713DD9Ca933848F6819F38B8352D9A15EA73F67": {
    underlying: "0x956F47F50A910163D8BF957Cf5846D573E7f87CA",
    underlyingDecimals: 18,
    underlyingSymbol: "FEI",
    cToken: "0x7713DD9Ca933848F6819F38B8352D9A15EA73F67",
    cTokenDecimals: 8,
    cTokenSymbol: "cFEI",
  },
}

module.exports = {
  SERVICE_STATUS,
  PROTOCOLS_CONFIG,
  ORACLE,
  ETH_USD_ORACLE,
  WETH,
  compoundMarkets,
}
