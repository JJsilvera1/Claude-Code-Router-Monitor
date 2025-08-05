"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log_reader_1 = require("./log-reader");
function testContextWindow() {
    const config = (0, log_reader_1.readConfigFile)();
    console.log("Config loaded:", !!config);
    if (config && config.Pricing) {
        console.log("Pricing section found");
        console.log("Available models:", Object.keys(config.Pricing));
        // Test specific model keys
        const testKeys = [
            "openrouter,qwen/qwen3-coder",
            "openrouter,z-ai/glm-4.5"
        ];
        for (const key of testKeys) {
            console.log(`Checking key '${key}':`, config.Pricing[key] ? "FOUND" : "NOT FOUND");
            if (config.Pricing[key]) {
                console.log(`  Context window: ${config.Pricing[key].contextWindow}`);
            }
        }
    }
    else {
        console.log("No Pricing section found");
    }
}
testContextWindow();
