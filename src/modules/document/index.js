import documentRoutes from "./routes/document.routes.js";

export default function (app){
    app.register(documentRoutes)
}