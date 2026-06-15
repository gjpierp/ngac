const { Eureka } = require("eureka-js-client");
require("dotenv").config();

const PORT = process.env.PORT || 3100;
const EUREKA_HOST = process.env.EUREKA_HOST || "localhost";
const EUREKA_PORT = process.env.EUREKA_PORT || 8761;
const EUREKA_IP_ADDR = process.env.EUREKA_IP_ADDR || "ngac-auth-service";

const isEurekaEnabled = process.env.EUREKA_ENABLED === 'true';

const client = new Eureka({
  instance: {
    app: "ngac-auth-service",
    hostName: EUREKA_IP_ADDR,
    ipAddr: EUREKA_IP_ADDR === "ngac-auth-service" || EUREKA_IP_ADDR === "localhost" ? "127.0.0.1" : EUREKA_IP_ADDR,
    port: { $: Number(PORT), "@enabled": true },
    vipAddress: "ngac-auth-service",
    dataCenterInfo: {
      "@class": "com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo",
      name: "MyOwn",
    },
    healthCheckUrl: `http://${EUREKA_IP_ADDR}:${PORT}/info`,
    statusPageUrl: `http://${EUREKA_IP_ADDR}:${PORT}/info`,
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

module.exports = { client, isEurekaEnabled };
