"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const ngac_admin_routes_1 = __importDefault(require("./routes/ngac-admin.routes"));
const ngac_admin_controller_1 = require("./controllers/ngac-admin.controller");
const eureka_config_1 = require("./config/eureka.config");
const load_env_1 = require("./config/load-env");
(0, load_env_1.loadEnv)();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3205;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/api/v1/admin/sec/roles-by-node", ngac_admin_controller_1.AdminController.getRolesPorNodo);
app.get("/api/v1/admin/ping", (req, res) => res.send("pong admin ok"));
app.get("/api/v1/admin/debug/routes", (req, res) => {
    res.json({
        status: "OK",
        time: new Date().toISOString(),
        message: "Si ves esto, el backend está cargando el código correctamente",
        expected_routes: ["/api/v1/admin/sec/roles-by-node", "/api/v1/admin/ping"],
    });
});
app.use("/api/v1/admin", ngac_admin_routes_1.default);
app.use((err, req, res, next) => {
    console.error("[App Error]", err.stack);
    res
        .status(500)
        .json({ error: "Ocurrió un error inesperado", detail: err.message });
});
app.listen(PORT, () => {
    if (eureka_config_1.isEurekaEnabled) {
        eureka_config_1.eurekaClient.start((error) => {
            if (error) {
                console.error("[Eureka] Error al registrar:", error);
            }
        });
    }
});
process.on("SIGINT", () => {
    if (eureka_config_1.isEurekaEnabled) {
        eureka_config_1.eurekaClient.stop(() => {
            process.exit(0);
        });
    }
    else {
        process.exit(0);
    }
});
