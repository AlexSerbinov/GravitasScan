const namespace = "subgraph"

const protocols = process.env.PROTOCOLS
  ? process.env.PROTOCOLS.split(",").map((p) => p.trim())
  : ["V1", "V2", "V3", "Compound", "Liquity", "MakerDAO_CDP"]

const npmScripts = {
  V1: "subgraph_v1",
  V2: "subgraph_v2",
  V3: "subgraph_v3",
  Compound: "subgraph_compound",
  Liquity: "subgraph_liquity",
  MakerDAO_CDP: "subgraph_makerdao",
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
