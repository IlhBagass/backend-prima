import { immunizationRoutes } from "./routes/immunization.routes";

export default function(app){
    app.register(immunizationRoutes)
}