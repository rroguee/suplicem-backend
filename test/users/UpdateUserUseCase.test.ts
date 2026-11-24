import { test, describe } from "node:test";
import assert from "node:assert";
import { UpdateUserUseCase } from "../../src/application/use-cases/user/UpdateUserUseCase";

const createUser = (overrides: Record<string, any> = {}) => ({
  uid: "user-1",
  identificationType: "Cedula",
  identification: "00112345678",
  email: "user@example.com",
  names: "Ana",
  lastNames: "Perez",
  phone: "8091234567",
  userType: "client",
  createdAt: new Date().toISOString(),
  status: "active",
  notifications: { sms: true, email: true },
  ...overrides,
});

const createRepo = (user: any) => {
  const updates: any[] = [];
  return {
    updates,
    repo: {
      getById: async () => user,
      update: async (_uid: string, data: any) => {
        updates.push(data);
      },
    } as any,
  };
};

const requester = {
  uid: "user-1",
  userType: "client",
  status: "active",
} as any;

describe("UpdateUserUseCase - preferencias de notificación", () => {
  test("Fusiona las preferencias y registra el opt-in de WhatsApp", async () => {
    const user = createUser();
    const { updates, repo } = createRepo(user);
    const useCase = new UpdateUserUseCase(repo);

    await useCase.execute(
      {
        uid: user.uid,
        notifications: { sms: false, whatsapp: true },
        expoPushToken: "ExponentPushToken[abc]",
      },
      requester
    );

    assert.strictEqual(updates.length, 1);
    assert.deepStrictEqual(updates[0].notifications, {
      sms: false,
      email: true,
      whatsapp: true,
    });
    assert.ok(updates[0].whatsappOptInAt);
    assert.strictEqual(updates[0].expoPushToken, "ExponentPushToken[abc]");
  });

  test("Limpia el opt-in de WhatsApp y no permite cambiar email ni estado", async () => {
    const user = createUser({
      whatsappOptInAt: new Date().toISOString(),
      notifications: { sms: true, whatsapp: true },
    });
    const { updates, repo } = createRepo(user);
    const useCase = new UpdateUserUseCase(repo);

    await useCase.execute(
      {
        uid: user.uid,
        email: "otro@example.com",
        status: "banned",
        userType: "admin",
        notifications: { whatsapp: false },
      },
      requester
    );

    assert.strictEqual(updates[0].email, user.email);
    assert.strictEqual(updates[0].status, user.status);
    assert.strictEqual(updates[0].userType, user.userType);
    assert.strictEqual(updates[0].whatsappOptInAt, "");
    assert.deepStrictEqual(updates[0].notifications, {
      sms: true,
      whatsapp: false,
    });
  });
});
