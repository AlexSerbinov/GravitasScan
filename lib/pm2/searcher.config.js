const namespace = "searcher"

const protocols = process.env.PROTOCOLS
  ? process.env.PROTOCOLS.split(",").map((p) => p.trim())
  : ["V1", "V2", "V3", "Compound", "Liquity", "MakerDAO_CDP"]

const npmScripts = {
  V1: "searcher_v1",
  V2: "searcher_v2",
  V3: "searcher_v3",
  Compound: "searcher_compound",
  Liquity: "searcher_liquity",
  MakerDAO_CDP: "searcher_makerdao",
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
