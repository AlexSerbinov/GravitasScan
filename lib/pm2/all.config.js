const { apps: archive } = require("./archive.config")
const { apps: blacklist } = require("./blacklist.config")
const { apps: subgraph } = require("./subgraph.config")
const { apps: searcher } = require("./searcher.config")
const { apps: history } = require("./history.config")
const { apps: tester } = require("./tester.config")
const { apps: events } = require("./events.config")
const { apps: logger } = require("./logger.config")
const { apps: watcher } = require("./watcher.config")
const { apps: data_fetcher } = require("./data-fetcher.config")
const { apps: transmit_fetcher } = require("./transmit-fetcher.config")

module.exports = {
  apps: [...archive, ...subgraph, ...blacklist, ...searcher, ...history, ...tester, ...events, ...logger, ...watcher, ...data_fetcher, ...transmit_fetcher],
}
