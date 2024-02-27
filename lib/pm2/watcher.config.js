const namespace = "watcher"

const protocols = process.env.PROTOCOLS
  ? process.env.PROTOCOLS.split(",").map((p) => p.trim())
  : ["V1", "V2", "V3", "Compound"]

const npmScripts = {
  V1: "watcher_v1",
  V2: "watcher_v2",
  V3: "watcher_v3",
  Compound: "watcher_compound",
}

const apps = protocols.map((protocol) => {
  return {
    name: `${namespace}-${protocol.toLowerCase()}`,
    namespace,
    script: "npm",
    args: `run ${npmScripts[protocol]}`,
    log_date_format: "YYYY-MM-DD HH:mm:ss",
    error_file: `./logs/${namespace}-${protocol.toLowerCase()}-error.log`,
    out_file: `./logs/${namespace}-${protocol.toLowerCase()}-out.log`,
    env: {
      PROTOCOL: protocol,
    },
  }
})

module.exports = {
  apps,
}
