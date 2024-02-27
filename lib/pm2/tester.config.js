const apps = [
  {
    name: "tester-registry",
    namespace: "tester",
    script: "npm",
    args: "run test",
    log_date_format: "YYYY-MM-DD HH:mm:ss",
    error_file: "./logs/tester-error.log",
    out_file: "./logs/tester-out.log",
    env: {
      ENV: "test",
    },
  },
]

module.exports = {
  apps,
}
