"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenRouterError = exports.LogParseError = exports.ConfigError = exports.MonitorError = void 0;
// Error handling types
class MonitorError extends Error {
    constructor(message, code, originalError) {
        super(message);
        this.code = code;
        this.originalError = originalError;
        this.name = 'MonitorError';
    }
}
exports.MonitorError = MonitorError;
class ConfigError extends MonitorError {
    constructor(message, originalError) {
        super(message, 'CONFIG_ERROR', originalError);
        this.name = 'ConfigError';
    }
}
exports.ConfigError = ConfigError;
class LogParseError extends MonitorError {
    constructor(message, originalError) {
        super(message, 'LOG_PARSE_ERROR', originalError);
        this.name = 'LogParseError';
    }
}
exports.LogParseError = LogParseError;
class OpenRouterError extends MonitorError {
    constructor(message, originalError) {
        super(message, 'OPENROUTER_ERROR', originalError);
        this.name = 'OpenRouterError';
    }
}
exports.OpenRouterError = OpenRouterError;
