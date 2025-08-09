#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const openrouter_monitor_1 = require("./openrouter-monitor");
// Direct setup runner
(0, openrouter_monitor_1.setupConfig)().then(() => {
    process.exit(0);
}).catch((error) => {
    console.error("Setup failed:", error);
    process.exit(1);
});
