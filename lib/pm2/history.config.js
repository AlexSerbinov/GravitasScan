const namespace = "history"
const npmScript = "history"

const apps = [
  {
    name: namespace,
    namespace,
    script: "npm",
    args: `run ${npmScript}`,
    log_date_format: "YYYY-MM-DD HH:mm:ss",
    error_file: `./logs/${namespace}-error.log`,
    out_file: `./logs/${namespace}-out.log`,
  },
]

module.exports = {
  apps,
}
