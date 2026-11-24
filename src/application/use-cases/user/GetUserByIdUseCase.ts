import { User } from "../../../domain/entities/User";
import { UserRepository } from "../../../domain/repositories/UserRepository";
import { ApplicationActor } from "../../dtos/UserDtos";

export class GetUserByIdUseCase {
  constructor(private userRepo: UserRepository) {}

  async execute(userId: string, authUser?: ApplicationActor): Promise<User | null> {
    if (!userId || typeof userId !== "string" || !userId.trim()) {
      throw new Error("ID de usuario requerido");
    }

    const user = await this.userRepo.getById(userId.trim());
    if (!user) {
      return null;
    }

    if (authUser) {
      const isOwner = authUser.uid === user.uid;
      const isAdmin = authUser.userType === "admin";
      const isAssignedSeller =
        authUser.userType === "seller" && user.sellerId === authUser.uid;

      if (!isAdmin && !isOwner && !isAssignedSeller) {
        throw new Error("No tienes permiso para ver la información de este usuario");
      }
    }

    if (user.sellerId) {
      try {
        const seller = await this.userRepo.getById(user.sellerId);
        if (seller) {
          user.sellerName = `${seller.names} ${seller.lastNames || ""}`.trim();
          user.sellerCode = seller.sellerCode;
          user.sellerPhone = seller.phone;
        }
      } catch (e) {
        console.warn("Error al enriquecer vendedor asignado:", e);
      }
    }

    return user;
  }
}

