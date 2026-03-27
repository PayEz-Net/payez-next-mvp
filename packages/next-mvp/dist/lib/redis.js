"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
exports.getRedis = getRedis;
// E:\Repos\PayEz-Next-MVP\packages\next-mvp\src\lib\redis.ts
const ioredis_1 = __importDefault(require("ioredis"));
let client = null;
function createClient() {
    const url = process.env.REDIS_URL;
    if (url && url.trim() !== '') {
        // Use a standard configuration for better Docker compatibility
        return new ioredis_1.default(url);
    }
    // No REDIS_URL set, create a client that will fail fast.
    return new ioredis_1.default({ lazyConnect: true });
}
function getRedis() {
    if (!client) {
        client = createClient();
    }
    return client;
}
const redis = getRedis();
exports.redis = redis;
exports.default = redis;
