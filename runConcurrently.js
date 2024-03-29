const concurrently = require("concurrently")

const args = process.argv.slice(2).join(" ")
const protocols = ["V1", "V2", "V3", "Compound", "Liquity"]
const service = process.env.SERVICE
const options = {
  killOthers: ["failure", "success"],
}

if (service === "SUBGRAPH") {
  concurrently(
    protocols.map(protocol => ({
      command: `PROTOCOL=${protocol} node subgraphExecuter.js ` + args,
      name: protocol,
    })),
    options
  )
} else if (service === "SEARCHER") {
  concurrently(
    protocols.map(protocol => ({
      command: `PROTOCOL=${protocol} node searcherExecuter.js ` + args,
      name: protocol,
    })),
    options
  )
} else if (service === "DATA_FETCHER") {
  concurrently(
    protocols.map(protocol => ({
      command: `PROTOCOL=${protocol} node dataFetcherExecuter.js ` + args,
      name: protocol,
    })),
    options
  )
} else if (service === "ARCHIVE") {
  concurrently(
    protocols.map(protocol => ({
      command: `PROTOCOL=${protocol} node archiveExecuter.js ` + args,
      name: protocol,
    })),
    options
  )
} else if (service === "WATCHER") {
  concurrently(
    protocols
      .filter(p => p !== "Liquity")
      .map(protocol => ({
        command: `PROTOCOL=${protocol} node watcherExecuter.js ` + args,
        name: protocol,
      })),
    options
  )
} else if (service === "BLACKLIST") {
  concurrently(
    protocols.map(protocol => ({
      command: `PROTOCOL=${protocol} node blacklistExecuter.js ` + args,
      name: protocol,
    })),
    options
  )
}
