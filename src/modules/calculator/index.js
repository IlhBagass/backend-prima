import calculatorRoutes from "./routes/calculator.route.js";

export default function (app) {
  app.register(calculatorRoutes);
}

