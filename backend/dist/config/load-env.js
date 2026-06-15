"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadEnv = loadEnv;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
let envLoaded = false;
function loadEnv() {
    if (envLoaded) {
        return;
    }
    dotenv_1.default.config();
    if (process.env.NODE_ENV !== "production") {
        const localEnvPath = path_1.default.resolve(process.cwd(), ".env.local");
        if (fs_1.default.existsSync(localEnvPath)) {
            dotenv_1.default.config({ path: localEnvPath, override: true });
        }
    }
    envLoaded = true;
}
