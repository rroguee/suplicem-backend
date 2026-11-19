import { test, describe } from "node:test";
import assert from "node:assert";
import { UpdateUserStatusUseCase } from "../../src/application/use-cases/user/UpdateUserStatusUseCase";

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
  status: "pending",
  ...overrides,
});

const createUserRepo = (user: any) => ({
  getById: async () => user,
  update: async () => undefined,
} as any);

const createSmsService = () => {
  const calls: Array<{ phone: string; body: string }> = [];
  return {
    calls,
    service: {
      sendOtp: async () => undefined,
      sendMessage: async (phone: string, body: string) => {
        calls.push({ phone, body });
      },
    } as any,
  };
};

const createBotService = () => {
  const calls: any[] = [];
  return {
    calls,
    service: {
      sendAccountApprovedEmailBot: async (...args: any[]) => {
        calls.push(args);
      },
    } as any,
  };
};

const createNotificationDispatcher = () => {
  const calls: any[] = [];
  return {
    calls,
    service: {
      notifyAccountStatusChanged: async (params: any) => {
        calls.push(params);
      },
    } as any,
  };
};

describe("UpdateUserStatusUseCase - Notificaciones de estado", () => {
  test("Aprueba una cuenta pendiente y envía SMS + correo", async () => {
    const user = createUser();
    const sms = createSmsService();
    const bot = createBotService();
    const useCase = new UpdateUserStatusUseCase(
      createUserRepo(user),
      undefined,
      sms.service,
      bot.service
    );

    await useCase.execute({ uid: user.uid, status: "active" });

    assert.strictEqual(sms.calls.length, 1);
    assert.strictEqual(sms.calls[0].phone, "+18091234567");
    assert.match(sms.calls[0].body, /aprobada/i);
    assert.strictEqual(bot.calls.length, 1);
  });

  test("Aprueba una cuenta sin correo (registro por teléfono) y envía solo SMS", async () => {
    const user = createUser({ email: "", phone: "+18091234567" });
    const sms = createSmsService();
    const bot = createBotService();
    const useCase = new UpdateUserStatusUseCase(
      createUserRepo(user),
      undefined,
      sms.service,
      bot.service
    );

    await useCase.execute({ uid: user.uid, status: "active" });

    assert.strictEqual(sms.calls.length, 1);
    assert.match(sms.calls[0].body, /aprobada/i);
    assert.strictEqual(bot.calls.length, 0);
  });

  test("Desactiva una cuenta y notifica por SMS sin enviar correo", async () => {
    const user = createUser({ status: "active" });
    const sms = createSmsService();
    const bot = createBotService();
    const useCase = new UpdateUserStatusUseCase(
      createUserRepo(user),
      undefined,
      sms.service,
      bot.service
    );

    await useCase.execute({ uid: user.uid, status: "inactive" });

    assert.strictEqual(sms.calls.length, 1);
    assert.match(sms.calls[0].body, /desactivada/i);
    assert.strictEqual(bot.calls.length, 0);
  });

  test("Rechaza una cuenta pendiente y notifica por SMS sin enviar correo", async () => {
    const user = createUser({ status: "pending" });
    const sms = createSmsService();
    const bot = createBotService();
    const useCase = new UpdateUserStatusUseCase(
      createUserRepo(user),
      undefined,
      sms.service,
      bot.service
    );

    await useCase.execute({ uid: user.uid, status: "rejected" });

    assert.strictEqual(sms.calls.length, 1);
    assert.match(sms.calls[0].body, /rechazada/i);
    assert.strictEqual(bot.calls.length, 0);
  });

  test("Suspende una cuenta y notifica por SMS sin enviar correo", async () => {
    const user = createUser({ status: "active" });
    const sms = createSmsService();
    const bot = createBotService();
    const useCase = new UpdateUserStatusUseCase(
      createUserRepo(user),
      undefined,
      sms.service,
      bot.service
    );

    await useCase.execute({ uid: user.uid, status: "banned" });

    assert.strictEqual(sms.calls.length, 1);
    assert.match(sms.calls[0].body, /suspendida/i);
    assert.strictEqual(bot.calls.length, 0);
  });

  test("No notifica si el estado no cambia", async () => {
    const user = createUser({ status: "active" });
    const sms = createSmsService();
    const bot = createBotService();
    const useCase = new UpdateUserStatusUseCase(
      createUserRepo(user),
      undefined,
      sms.service,
      bot.service
    );

    await useCase.execute({ uid: user.uid, status: "active" });

    assert.strictEqual(sms.calls.length, 0);
    assert.strictEqual(bot.calls.length, 0);
  });

  test("Crea notificación in-app al aprobar una cuenta pendiente", async () => {
    const user = createUser();
    const sms = createSmsService();
    const bot = createBotService();
    const notifications = createNotificationDispatcher();
    const useCase = new UpdateUserStatusUseCase(
      createUserRepo(user),
      undefined,
      sms.service,
      bot.service,
      notifications.service
    );

    await useCase.execute({ uid: user.uid, status: "active" });

    assert.strictEqual(notifications.calls.length, 1);
    assert.strictEqual(notifications.calls[0].userId, user.uid);
    assert.strictEqual(notifications.calls[0].status, "active");
    assert.strictEqual(notifications.calls[0].previousStatus, "pending");
  });

  test("Respeta el opt-out de SMS pero mantiene la notificación in-app", async () => {
    const user = createUser({ notifications: { sms: false } });
    const sms = createSmsService();
    const bot = createBotService();
    const notifications = createNotificationDispatcher();
    const useCase = new UpdateUserStatusUseCase(
      createUserRepo(user),
      undefined,
      sms.service,
      bot.service,
      notifications.service
    );

    await useCase.execute({ uid: user.uid, status: "active" });

    assert.strictEqual(sms.calls.length, 0);
    assert.strictEqual(notifications.calls.length, 1);
  });

  test("Respeta el opt-out de notificaciones in-app", async () => {
    const user = createUser({ notifications: { inApp: false } });
    const sms = createSmsService();
    const bot = createBotService();
    const notifications = createNotificationDispatcher();
    const useCase = new UpdateUserStatusUseCase(
      createUserRepo(user),
      undefined,
      sms.service,
      bot.service,
      notifications.service
    );

    await useCase.execute({ uid: user.uid, status: "active" });

    assert.strictEqual(sms.calls.length, 1);
    assert.strictEqual(notifications.calls.length, 0);
  });

  test("Respeta el opt-out de correo en la aprobación", async () => {
    const user = createUser({ notifications: { email: false } });
    const sms = createSmsService();
    const bot = createBotService();
    const useCase = new UpdateUserStatusUseCase(
      createUserRepo(user),
      undefined,
      sms.service,
      bot.service
    );

    await useCase.execute({ uid: user.uid, status: "active" });

    assert.strictEqual(bot.calls.length, 0);
    assert.strictEqual(sms.calls.length, 1);
  });

  test("Un fallo de Twilio no impide actualizar el estado", async () => {
    const user = createUser({ status: "pending" });
    const updates: string[] = [];
    const repo = {
      getById: async () => user,
      update: async (_uid: string, updated: any) => {
        updates.push(updated.status);
      },
    } as any;
    const sms = {
      sendOtp: async () => undefined,
      sendMessage: async () => {
        throw new Error("Twilio SMS: [21608] The number is unverified");
      },
    } as any;
    const bot = createBotService();
    const useCase = new UpdateUserStatusUseCase(repo, undefined, sms, bot.service);

    const originalWarn = console.warn;
    const warnings: string[] = [];
    console.warn = (...args: any[]) => {
      warnings.push(args.join(" "));
    };

    try {
      await useCase.execute({ uid: user.uid, status: "active" });
    } finally {
      console.warn = originalWarn;
    }

    assert.strictEqual(user.status, "active");
    assert.deepStrictEqual(updates, ["active"]);
    assert.strictEqual(bot.calls.length, 1);
    assert.ok(warnings.some((warning) => warning.includes("[SMS] No se pudo notificar")));
    assert.ok(warnings.some((warning) => warning.includes("21608")));
  });
});
