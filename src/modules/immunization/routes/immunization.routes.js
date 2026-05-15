import {
    getImmunizationsController,
    createImmunizationController,
    getImmunizationByIdController,
    updateImmunizationController,
    deleteImmunizationController
} from "../controller/immunization.controller.js"

export async function immunizationRoutes(app) {
    app.get("/immunizations", getImmunizationsController)
    app.get("/immunizations/:id", getImmunizationByIdController)

    app.post("/immunizations", createImmunizationController)
    
    app.put("/immunizations/:id", updateImmunizationController)
    
    app.delete("/immunizations/:id", deleteImmunizationController)
}
