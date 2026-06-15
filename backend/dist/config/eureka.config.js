"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eurekaClient = exports.isEurekaEnabled = void 0;
const eureka_js_client_1 = require("eureka-js-client");
const load_env_1 = require("./load-env");
(0, load_env_1.loadEnv)();
const PORT = process.env.PORT || 3205;
const EUREKA_HOST = process.env.EUREKA_HOST || "localhost";
const EUREKA_PORT = process.env.EUREKA_PORT || 8761;
const EUREKA_IP_ADDR = process.env.EUREKA_IP_ADDR || "localhost";
exports.isEurekaEnabled = process.env.EUREKA_ENABLED === "true";
exports.eurekaClient = new eureka_js_client_1.Eureka({
    instance: {
        app: "ngac-backend",
        hostName: EUREKA_IP_ADDR,
        ipAddr: EUREKA_IP_ADDR === "localhost" ? "127.0.0.1" : EUREKA_IP_ADDR,
        port: {
            $: Number(PORT),
            "@enabled": true,
        },
        vipAddress: "ngac-backend",
        dataCenterInfo: {
            "@class": "com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo",
            name: "MyOwn",
        },
        healthCheckUrl: `http://${EUREKA_IP_ADDR}:${PORT}/api/v1/admin/ping`,
        statusPageUrl: `http://${EUREKA_IP_ADDR}:${PORT}/api/v1/admin/ping`,
    },
    eureka: {
        host: EUREKA_HOST,
        port: Number(EUREKA_PORT),
        servicePath: "/eureka/apps/",
        maxRetries: 15,
        requestRetryDelay: 3000,
        fetchRegistry: false,
        registerWithEureka: true,
    },
});
