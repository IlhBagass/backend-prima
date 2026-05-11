import medicalRecordsRoutes from "../medical_records/routes/medical.routes.js";

export default function (app){
    app.register(medicalRecordsRoutes)
}