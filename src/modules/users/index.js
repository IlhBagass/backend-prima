import authRoutes from "./routes/user.route.js";

export default async function (app) {
  app.register(authRoutes); 
}
