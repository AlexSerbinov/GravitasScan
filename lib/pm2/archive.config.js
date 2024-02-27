const namespace = "archive"

const protocols = process.env.PROTOCOLS
  ? process.env.PROTOCOLS.split(",").map((p) => p.trim())
  : ["V1", "V2", "V3", "Compound", "Liquity", "MakerDAO_CDP"]

const npmScripts = {
  V1: "archive_v1",
  V2: "archive_v2",
  V3: "archive_v3",
  Compound: "archive_compound",
  Liquity: "archive_liquity",
  MakerDAO_CDP: "archive_makerdao",
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
