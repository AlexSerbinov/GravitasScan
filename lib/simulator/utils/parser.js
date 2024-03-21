'use strict'

/**
 * WETH aliases (can be replaced to WETH)
 */
const wethAliases = new Set([
  '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  '0x0000000000000000000000000000000000000000'
])

/**
 * WETH address
 */
const WETH = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'

/**
 * Parse data from ARBTxParser
 * @param {*} payload - {rawTX, swaps[]}
 * {tx, amountIn, amountOut, path}
 */
function parseSwapTx(payload) {
  const {rawTX} = payload
  const swaps = []

  /**
   * Parse single multiswap
   */
  for (const swap of payload.swaps) {
    let {amountIn, amountOut, path} = swap
    let swapTokenIn = WETH
    let swapTokenOut, swapDex
    if (!amountIn || amountIn == 0)
    amountIn = rawTX.value
    if (!amountOut || amountOut == 0)
    amountOut = rawTX.value

    /**
     * Parse single proxy swap
     */
    const formatedPath = path.map(p => {
      let {tokenIn, tokenOut, fee, pair, protocol} = p
      fee = BigInt(fee)
      if (tokenIn) tokenIn = tokenIn.toLowerCase()
      if (tokenOut) tokenOut = tokenOut.toLowerCase()
      if (pair) pair = pair.toLowerCase()
      if (wethAliases.has(tokenIn)) tokenIn = WETH
      if (wethAliases.has(tokenOut)) tokenOut = WETH
      
      if (tokenIn === WETH) {
        swapDex = protocol
        swapTokenOut = tokenOut
      }

      if (tokenOut === WETH) {
        swapDex = protocol
        swapTokenIn = tokenIn
      }

      return {tokenIn, tokenOut, fee, pair, dex: protocol}
    })

    /**
     * Fill swaps array
     */
    swaps.push({
      tx: rawTX, path: formatedPath,
      amountIn: BigInt(amountIn),
      amountOut: BigInt(amountOut),
      tokenIn: swapTokenIn,
      tokenOut: swapTokenOut,
      dex: swapDex,
      router: payload.info.routerName
    })
  }

  return swaps
}

module.exports = {parseSwapTx}
