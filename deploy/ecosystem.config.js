// CoalTrade OS — PM2 Ecosystem Configuration
// Copy to VPS: /opt/coaltrade/app/ecosystem.config.js
// Start:  pm2 start ecosystem.config.js
// Reload: pm2 reload coaltrade-os  (zero-downtime)
// Stop:   pm2 stop coaltrade-os

module.exports = {
  apps: [
    {
      name: "coaltrade-os",
      script: ".next/standalone/server.js",
      args: "",
      cwd: "/opt/coaltrade/app/prodprod",

      // ── Cluster Mode ────────────────────────────────
      instances: 2, // 2 instances for load balancing (adjust to CPU cores)
      exec_mode: "cluster",

      // ── Memory ──────────────────────────────────────
      max_memory_restart: "1G",

      // ── Environment ─────────────────────────────────
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },

      // ── Logging ─────────────────────────────────────
      error_file: "/var/log/coaltrade/error.log",
      out_file: "/var/log/coaltrade/out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",

      // ── Restart Policy ──────────────────────────────
      watch: false,
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 10,
      listen_timeout: 10000,

      // ── Graceful shutdown ───────────────────────────
      kill_timeout: 5000,
      wait_ready: true,
    },
  ],
};
