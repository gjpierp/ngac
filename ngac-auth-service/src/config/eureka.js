const { Eureka } = require("eureka-js-client");
require("dotenv").config();

const isEurekaEnabled = process.env.EUREKA_ENABLED === 'true' || !!process.env.EUREKA_HOST;

const client = new Eureka({
  instance: {
    app: "ngac-auth-service",
    hostName: "ngac-auth-service",
    ipAddr: "127.0.0.1",
    port: { $: process.env.PORT || 3000, "@enabled": true },
    vipAddress: "ngac-auth-service",
    dataCenterInfo: {
      "@class": "com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo",
      name: "MyOwn",
    },
    healthCheckUrl: `http://ngac-auth-service:${process.env.PORT || 3000}/info`,
    statusPageUrl: `http://ngac-auth-service:${process.env.PORT || 3000}/info`,
  },
  eureka: {
    host: process.env.EUREKA_HOST || 'localhost',
    port: process.env.EUREKA_PORT || 9090,
    servicePath: "/eureka/apps/",
    maxRetries: 10,
    requestRetryDelay: 2000,
    fetchRegistry: false,
    registerWithEureka: true,
  },
});

module.exports = { client, isEurekaEnabled };
