module.exports = {
    apps: [
        {
            name: "api",
            script: "node",
            args: "-r tsconfig-paths/register backend/api/lib/serve.js",
            env: {
                NODE_ENV: "production",
                NODE_PATH: "/usr/src/app/node_modules",  // <- ensures Node finds tsconfig-paths
                PORT: 80,
            },
            instances: 1,
            exec_mode: "fork",
            autorestart: true,
            watch: false,
            // 4 GB on the box, give 3 GB to the JS heap
            node_args: "--max-old-space-size=3072",
            max_memory_restart: "3500M"
        }
    ]
};
