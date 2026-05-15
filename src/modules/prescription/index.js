import prescriptionRoutes from "./routes/presctiption.routes.js";

export default function (app){
    app.register(prescriptionRoutes)
}