import express from "express";
import cors from "cors";
import adminRoutes from "./routes/ngac-admin.routes";
import { AdminController } from "./controllers/ngac-admin.controller";
import { eurekaClient, isEurekaEnabled } from "./config/eureka.config";
import { loadEnv } from "./config/load-env";

loadEnv();

const app = express();
const PORT = process.env.PORT || 3205;

app.use(cors());
app.use(express.json());

app.get("/api/v1/admin/sec/roles-by-node", AdminController.getRolesPorNodo);
app.get("/api/v1/admin/ping", (req, res) => res.send("pong admin ok"));
app.get("/api/v1/admin/debug/routes", (req, res) => {
  res.json({
    status: "OK",
    time: new Date().toISOString(),
    message: "Si ves esto, el backend está cargando el código correctamente",
    expected_routes: ["/api/v1/admin/sec/roles-by-node", "/api/v1/admin/ping"],
  });
});
app.use("/api/v1/admin", adminRoutes);
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error("[App Error]", err.stack);
    res
      .status(500)
      .json({ error: "Ocurrió un error inesperado", detail: err.message });
  },
);

app.listen(PORT, () => {
  if (isEurekaEnabled) {
    eurekaClient.start((error: any) => {
      if (error) {
        console.error("[Eureka] Error al registrar:", error);
      }
    });
  }
});

process.on("SIGINT", () => {
  if (isEurekaEnabled) {
    eurekaClient.stop(() => {
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});
