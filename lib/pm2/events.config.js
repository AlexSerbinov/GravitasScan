const apps = [
  {
    name: "events",
    namespace: "events",
    script: "npm",
    args: "run events",
    log_date_format: "YYYY-MM-DD HH:mm:ss",
    error_file: "./logs/events-error.log",
    out_file: "./logs/events-out.log",
  }
]

module.exports = {
  apps,
}