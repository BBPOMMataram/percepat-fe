module.exports = {
    apps: [
        {
            name: "percepat",
            script: "node_modules/next/dist/bin/next",
            args: "start -p 3002",
            cwd: "/home/bbpommataram.id/PERCEPAT",
            instances: 1,
            exec_mode: "fork",
            autorestart: true,
            watch: false,
            max_memory_restart: "500M",
            env: {
                NODE_ENV: "production",
                JWT_SECRET: "oSslZm8O2XLGuF2ovnEibfxsXaZTgYEpNVC6QdhPYKXY1x7sbdNVwnayc8dOfFog"
            }
        }
    ]
};