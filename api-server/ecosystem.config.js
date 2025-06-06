module.exports = {
  apps: [
    {
      name: "bounce-mobile-api",
      script: "dist/app.js",
      instances: "max", // Use all available CPU cores
      exec_mode: "cluster",
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 4000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 4000,
      },
      env_staging: {
        NODE_ENV: "staging",
        PORT: 4000,
      },
      env_development: {
        NODE_ENV: "development",
        PORT: 4000,
      },
      // Logging configuration
      log_file: "logs/combined.log",
      out_file: "logs/out.log",
      error_file: "logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",

      // Process management
      min_uptime: "10s",
      max_restarts: 10,
      autorestart: true,

      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,

      // Health monitoring
      health_check_grace_period: 3000,

      // Advanced PM2 features
      merge_logs: true,
      time: true,

      // Environment-specific overrides
      node_args: "--max-old-space-size=1024",

      // Cron restart (optional - restart daily at 2 AM)
      cron_restart: "0 2 * * *",

      // Source map support for better error traces
      source_map_support: true,

      // Ignore specific files/folders for watch mode (if enabled)
      ignore_watch: [
        "node_modules",
        "logs",
        "coverage",
        "tests",
        "*.test.ts",
        "*.spec.ts",
      ],

      // Custom startup script
      post_update: ["npm install", "npm run build"],

      // Monitoring and metrics
      pmx: true,

      // Instance variables for load balancing
      instance_var: "INSTANCE_ID",

      // Graceful reload
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 5000,
    },
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: "deploy",
      host: ["production-server.com"],
      ref: "origin/main",
      repo: "git@github.com:your-org/bounce-mobile-api.git",
      path: "/var/www/bounce-mobile-api",
      "post-deploy":
        "npm install && npm run build && pm2 reload ecosystem.config.js --env production",
      "pre-setup": "apt update && apt install git -y",
    },
    staging: {
      user: "deploy",
      host: ["staging-server.com"],
      ref: "origin/develop",
      repo: "git@github.com:your-org/bounce-mobile-api.git",
      path: "/var/www/bounce-mobile-api-staging",
      "post-deploy":
        "npm install && npm run build && pm2 reload ecosystem.config.js --env staging",
      "pre-setup": "apt update && apt install git -y",
    },
  },
};
