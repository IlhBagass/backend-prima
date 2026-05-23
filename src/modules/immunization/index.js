import { immunizationRoutes } from "./routes/immunization.routes.js";

export default function(app){
    app.register(immunizationRoutes)
}