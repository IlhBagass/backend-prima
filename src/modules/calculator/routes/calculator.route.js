import {
  bmiController,
  bmrController,
  diabetesRiskController,
  hipertensiRiskController,
} from "../controllers/calculator.controller.js";

export default async function calculatorRoutes(app) {
  // 1) Kalkulator BMI
  app.post("/bmi", bmiController);

  // 2) Kalkulator Risiko Diabetes
  app.post("/risk/diabetes", diabetesRiskController);

  // 3) Kalkulator Risiko Hipertensi
  app.post("/risk/hipertensi", hipertensiRiskController);

  // 4) Kalkulator Kalori Harian (BMR)
  app.post("/bmr", bmrController);
}

