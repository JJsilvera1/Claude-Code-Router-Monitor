#!/usr/bin/env node
import { setupConfig } from "./openrouter-monitor";

// Direct setup runner
setupConfig().then(() => {
    process.exit(0);
}).catch((error) => {
    console.error("Setup failed:", error);
    process.exit(1);
});