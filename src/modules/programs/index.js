import  { programRoutes }  from "./routes/program.route.js"

export default function(app){
    app.register(programRoutes)
}