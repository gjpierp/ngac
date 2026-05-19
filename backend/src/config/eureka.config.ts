import { Eureka } from 'eureka-js-client';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3200;
const EUREKA_HOST = process.env.EUREKA_HOST || 'localhost';
const EUREKA_PORT = process.env.EUREKA_PORT || 9090;

export const isEurekaEnabled = process.env.EUREKA_ENABLED === 'true' || !!process.env.EUREKA_HOST;

export const eurekaClient = new Eureka({
    instance: {
        app: 'ngac-backend',
        hostName: 'ngac-backend',
        ipAddr: '127.0.0.1',
        port: {
            '$': Number(PORT),
            '@enabled': true,
        },
        vipAddress: 'ngac-backend',
        dataCenterInfo: {
            '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
            name: 'MyOwn',
        },
        healthCheckUrl: `http://ngac-backend:${PORT}/api/v1/admin/dashboard/stats`,
        statusPageUrl: `http://ngac-backend:${PORT}/api/v1/admin/dashboard/stats`,
    },
    eureka: {
        host: EUREKA_HOST,
        port: Number(EUREKA_PORT),
        servicePath: '/eureka/apps/',
        maxRetries: 15,
        requestRetryDelay: 3000,
        fetchRegistry: false,
        registerWithEureka: true,
    },
});
