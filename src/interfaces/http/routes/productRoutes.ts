import { Router } from "express";
import { ProductController } from "../controllers/ProductController";
import { authenticate } from "../middlewares/authenticate";

export const productRoutes = (router: Router) => {
  const productController = new ProductController();

  router.post("/products", authenticate, (req, res) => productController.create(req, res));
  router.get("/products", authenticate, (req, res) => productController.getAll(req, res));
  router.get("/products/search", (req, res) => productController.search(req, res));
};
