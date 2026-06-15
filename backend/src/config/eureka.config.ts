import { Eureka } from "eureka-js-client";
import { loadEnv } from "./load-env";

loadEnv();

const PORT = process.env.PORT || 3205;
const EUREKA_HOST = process.env.EUREKA_HOST || "localhost";
const EUREKA_PORT = process.env.EUREKA_PORT || 8761;
const EUREKA_IP_ADDR = process.env.EUREKA_IP_ADDR || "localhost";

export const isEurekaEnabled = process.env.EUREKA_ENABLED === "true";

export const eurekaClient = new Eureka({
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
