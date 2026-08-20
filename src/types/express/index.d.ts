import "express";
import admin from "firebase-admin";

declare module "express" {
  interface Request {
    user?: admin.auth.DecodedIdToken;
  }
}
