const fetch = require("node-fetch")
const { request, gql } = require("graphql-request")

function aaveArchiveGraphQuery(id = "") {
  return gql`
        {
           accounts(first: 1000, orderBy: id, orderDirection: asc, 
                 where: {
                 borrowCount_gt: 0,
                 ${id && `id_gt: "${id}"`} 
                 }) { 
                      id
                     }
        }
        `
}

function compoundSubgraphQuery(id = "") {
  return gql`
                {
                   accounts(orderBy: id, orderDirection: asc, first: 1000, where: {hasBorrowed: true, ${
                     id && `id_gt: "${id}"`
                   }}) {
                    id
                    health,
                    tokens {
                        id
                      symbol,
                      cTokenBalance,
                      totalUnderlyingSupplied,
                      supplyBalanceUnderlying
                      totalUnderlyingBorrowed,
                      borrowBalanceUnderlying
                    }
                  }
                   }
                `
}

function aaveSubgraphQuery(id = "") {
  return {
    query: `
        {
           users(first: 1000, orderBy: id, orderDirection: asc,
                 where: {borrowedReservesCount_gt: 0,
                 ${id && `id_gt: "${id}"`} 
                 }) { 
                      id
                     }
        }
        `,
  }
}

function liquitySubgraphQuery(id = "") {
  return {
    query: `
       {
  troves(where: {status: "open", ${id && `id_gt: "${id}"`}}, first: 1000, orderBy: id, orderDirection: asc) {
    id,
    rawCollateral,
    rawDebt
      }
}
        `,
  }
}

function liquidationCallsV1Query(timestamp = "") {
  return {
    query: `
      {
        liquidationCalls(
          first: 1000,
          orderBy: timestamp,
          orderDirection: asc,
          where: {
            ${timestamp && `timestamp_gt: ${timestamp}`} 
          }
        ) {
          id,
          user {
            id
          },
          liquidator,
          principalAmount,
          collateralAmount,
          timestamp,
          collateralReserve {
            id
          },
          principalReserve {
            id
          }
        }
      }
    `,
  }
}

function liquidationCallsV2Query(timestamp = "") {
  return {
    query: `
      {
        liquidationCalls(
          first: 1000,
          orderBy: timestamp,
          orderDirection: asc,
          where: {
            ${timestamp && `timestamp_gt: ${timestamp}`} 
          }
        ) {
          txHash,
          liquidator,
          user {
            id
          }
          principalAmount,
          collateralAmount,
          timestamp,
          collateralReserve {
            id
          },
          principalReserve {
            id
          }
        }
      }
    `,
  }
}

function liquidationCallsV3Query(timestamp = "") {
  return {
    query: `
      {
        liquidationCalls(
          first: 1000,
          orderBy: timestamp,
          orderDirection: asc,
          where: {
            ${timestamp && `timestamp_gt: ${timestamp}`} 
          }
        ) {
          id,
          user {
            id
          },
          liquidator,
          principalAmount,
          collateralAmount,
          timestamp,
          collateralReserve {
            id
          },
          principalReserve {
            id
          }
        }
      }
    `,
  }
}

function liquidationCallsCompoundQuery(timestamp = "") {
  return gql`
    {
      liquidationEvents(
        first: 1000,
        orderBy: blockTime,
        orderDirection: asc,
        ${
          timestamp &&
          `where: {
            blockTime_gt: ${timestamp} 
          }`
        }
      ) {
        id,
        blockTime,
        to,
        from,
        cTokenSymbol,
        underlyingRepayAmount,
        underlyingSymbol,
        amount,
        blockNumber
      }
    }
  `
}

function graphQueryBuilder(body, returnRow = false) {
  if (returnRow) {
    return body
  }

  return {
    method: "POST",
    body: JSON.stringify(body),
  }
}

async function checkSingleRequest(url, query, useGraphRequest) {
  const sendReq = useGraphRequest ? request : fetch

  await sendReq(url, graphQueryBuilder(query(), useGraphRequest))
}

async function fetchSubgraphData(
  url,
  query,
  returnKey,
  orderBy,
  { filterInstantly, filterValue, useGraphRequest } = {},
  callback
) {
  const sendReq = useGraphRequest ? request : fetch
  const finalData = []
  const queryLimit = 500
  let poolsLeft = true

  while (poolsLeft) {
    let response, data

    if (finalData.length === 0) {
      if (filterInstantly) {
        response = await sendReq(url, graphQueryBuilder(query(filterValue), useGraphRequest))
      } else {
        response = await sendReq(url, graphQueryBuilder(query(), useGraphRequest))
      }
    } else {
      response = await sendReq(url, graphQueryBuilder(query(finalData[finalData.length - 1][orderBy]), useGraphRequest))
    }

    data = useGraphRequest ? response : (await response.json()).data

    if (data[returnKey].length !== queryLimit) {
      poolsLeft = false
    }

    if (callback) {
      await callback(data[returnKey])
    }

    finalData.push(...data[returnKey])
  }

  return finalData
}

module.exports = {
  fetchSubgraphData,
  aaveArchiveGraphQuery,
  aaveSubgraphQuery,
  liquidationCallsV1Query,
  liquidationCallsV2Query,
  liquidationCallsV3Query,
  liquitySubgraphQuery,
  liquidationCallsCompoundQuery,
  compoundSubgraphQuery,
  checkSingleRequest,
}
