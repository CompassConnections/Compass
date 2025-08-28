module.exports = {
  apps: [
    {
      name: 'serve',
      script: 'backend/api/lib/serve.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      // 4 GB on the box, give 3 GB to the JS heap
      node_args: '--max-old-space-size=3072',
      max_memory_restart: '3500M', // 3.5 GB
      env: {
        PORT: 80,
      },
    },
  ],
}
