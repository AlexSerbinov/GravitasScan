const namespace = "blacklist"

const protocols = process.env.PROTOCOLS
  ? process.env.PROTOCOLS.split(",").map((p) => p.trim())
  : ["V1", "V2", "V3", "Compound", "Liquity", "MakerDAO_CDP"]

const npmScripts = {
  V1: "blacklist_v1",
  V2: "blacklist_v2",
  V3: "blacklist_v3",
  Compound: "blacklist_compound",
  Liquity: "blacklist_liquity",
  MakerDAO_CDP: "blacklist_makerdao",
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
