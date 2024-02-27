const apps = [
  {
    name: "logger",
    namespace: "logger",
    script: "npm",
    args: "run logger",
    log_date_format: "YYYY-MM-DD HH:mm:ss",
    error_file: "./logs/logger-error.log",
    out_file: "./logs/logger-out.log",
  }
]

module.exports = {
  apps,
}