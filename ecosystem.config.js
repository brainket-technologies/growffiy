module.exports = {
  apps: [
    {
      name: 'growffi-trading-engine',
      script: 'server.js',
      instances: process.env.PM2_INSTANCES || 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        DB_POOL_MAX: 25
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
        DB_POOL_MAX: 25
      }
    }
  ]
};
