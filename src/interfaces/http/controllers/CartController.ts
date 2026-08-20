import { Request, Response } from "express";
import { CartFirestoreRepository } from "../../../infrastructure/firestore/CartFirestoreRepository";
import { AddToCartUseCase } from "../../../application/use-cases/cart/AddToCartUseCase";
import { GetCartUseCase } from "../../../application/use-cases/cart/GetCartUseCase";
import { RemoveFromCartUseCase } from "../../../application/use-cases/cart/RemoveFromCartUseCase";

const cartRepo = new CartFirestoreRepository();
const addToCartUseCase = new AddToCartUseCase(cartRepo);
const getCartUseCase = new GetCartUseCase(cartRepo);
const removeFromCartUseCase = new RemoveFromCartUseCase(cartRepo);

export class CartController {
  async add(req: Request, res: Response) {
    try {
      const { productId, quantity, unit } = req.body;
      const userId = req.user?.uid;

      if (!productId || !quantity || !unit || !userId) {
        return res.status(400).json({
          success: false,
          message: "Campos requeridos faltantes",
        });
      }

      await addToCartUseCase.execute({ userId, productId, quantity, unit });

      res.status(201).json({
        success: true,
        message: "Producto agregado al carrito",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Error al agregar al carrito",
      });
    }
  }

  async get(req: Request, res: Response) {
    try {
      const userId = req.user?.uid;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const items = await getCartUseCase.execute(userId);

      res.status(200).json({
        success: true,
        items,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Error al obtener el carrito",
      });
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const userId = req.user?.uid;
      const productId = req.params.productId;

      if (!userId || !productId) {
        return res.status(400).json({
          success: false,
          message: "Datos faltantes",
        });
      }

      await removeFromCartUseCase.execute(userId, productId);

      res.status(200).json({
        success: true,
        message: "Producto eliminado del carrito",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Error al eliminar del carrito",
      });
    }
  }
}
