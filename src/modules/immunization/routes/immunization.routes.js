import {
    getImmunizationsController,
    createImmunizationController,
    getImmunizationByIdController,
    updateImmunizationController,
    deleteImmunizationController
} from "../controller/immunization.controller.js"

export async function immunizationRoutes(app) {
    app.get("/show", getImmunizationsController)
    app.get("/show/:id", getImmunizationByIdController)

    app.post("/create", createImmunizationController)
    
    app.put("/update/:id", updateImmunizationController)
    
    app.delete("/delete/:id", deleteImmunizationController)
}
