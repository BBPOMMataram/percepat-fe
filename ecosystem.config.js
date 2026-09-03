module.exports = {
    apps: [
        {
            name: "percepat",
            script: "node_modules/next/dist/bin/next",
            args: "start -p 3002",
            cwd: "/tmp/percepat-fe",
            instances: 1,
            exec_mode: "fork",
            autorestart: true,
            watch: false,
            max_memory_restart: "500M",
            env: {
                NODE_ENV: "production",
            }
        }
    ]
};