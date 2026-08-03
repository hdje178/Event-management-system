import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), "../.env"), quiet: true });

import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";
import type { Request, Response, Express } from "express";
import eventsRouter from "./routes/events.route.js";
import usersRouter from "./routes/user.route.js";
import registrationRouter from "./routes/registration.route.js";
import authRouter from "./routes/auth.route.js";
import { globalErrorHandler } from "./errors/global.errors_handler.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger.js";
import {authMiddleware} from "./middleware/auth.middleware.js";


const app: Express = express();
const PORT: number = Number(process.env.PORT) || 5000;
app.use(cookieParser());
app.use(cors({
    origin: ["http://127.0.0.1:8080","http://localhost:8080"],
    methods: ["GET", "POST", "PUT","PATCH","DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

    next();
});
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    });
    next();
});
if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
    console.error("❌ КРИТИЧНА ПОМИЛКА: Змінна JWT_SECRET не знайдена в .env файлі!");
    process.exit(1);
}
const v1 = express.Router();
v1.use("/auth", authRouter);
v1.use("/events", eventsRouter);
v1.use("/users", usersRouter);
v1.use("/registrations", registrationRouter);

app.use("/api/v1", v1);

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ ok: true });
});
app.use((req, res) => {
    res.status(404).json({
        error: {
            code: "NOT_FOUND",
            message: "Route not found",
            details: null
        }
    });
});
app.use(globalErrorHandler);
console.log("About to listen on", PORT);
async function startServer() {
    try {
        const server = app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log("Address:", server.address());
        });
        server.on("error", (err) => {
            console.error("LISTEN ERROR:", err);
        });
    } catch (err) {
        console.error("Failed to start server:", err);
        process.exit(1);
    }
}

startServer().catch(err => {
    console.error("Unhandled error in startServer:", err);
    process.exit(1);
});;
