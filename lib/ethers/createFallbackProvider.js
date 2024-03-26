// // const { providers } = require("ethers")

// // const { WebSocketProvider, StaticJsonRpcProvider } = providers
// const { WebSocketProvider } = require("ethers");

// const createFallbackProvider = (rpcList, stallTimeout = 5_000) => {
//   if (!rpcList.length) {
//     throw new Error("RPC URL not set")
//   }

//   const [baseProvider, ...fallbackProviders] = rpcList.map((url) => {
//     return url.startsWith("ws") ? new WebSocketProvider(url) : new StaticJsonRpcProvider(url)
//   })

//   if (!fallbackProviders.length) {
//     return baseProvider
//   }

//   return new Proxy(baseProvider, {
//     get(target, prop) {
//       if (typeof target[prop] !== "function") {
//         return target[prop]
//       }

//       return async (...args) => {
//         let result
//         let error

//         for (const provider of [target, ...fallbackProviders]) {
//           try {
//             result = await Promise.race([
//               new Promise((_, reject) =>
//                 setTimeout(() => reject(new Error(`rpc ${provider.connection.url} timeout exceeded`)), stallTimeout)
//               ),
//               provider[prop](...args),
//             ])
//             break
//           } catch (err) {
//             error = err
//             continue
//           }
//         }

//         if (result === undefined) throw error

//         return result
//       }
//     },
//   })
// }

// module.exports = {
//   createFallbackProvider,
// }
