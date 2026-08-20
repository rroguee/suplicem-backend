import { User } from "../../domain/entities/User";

export interface CreateUserDto extends User {
  password: string;
}

export interface UpdateUserStatusDto {
  uid: string;
  status: "pending" | "active" | "inactive" | "banned";
}