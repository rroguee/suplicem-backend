import { test, describe } from "node:test";
import assert from "node:assert";
import axios from "axios";
import { TwilioSmsService } from "../../src/infrastructure/services/TwilioSmsService";

process.env.TWILIO_ACCOUNT_SID = "ACtest";
process.env.TWILIO_AUTH_TOKEN = "token-test";
process.env.TWILIO_SMS_FROM = "+17372508034";

const createRepo = () => {
  const logs: any[] = [];
  return {
    logs,
    repo: {
      create: async (log: any) => {
        logs.push(log);
        return `log-${logs.length}`;
      },
      updateStatus: async () => undefined,
    } as any,
  };
};

const withMockedPost = async (
  mock: (url: string, body: URLSearchParams) => Promise<any>,
  fn: () => Promise<void>
) => {
  const originalPost = (axios as any).post;
  (axios as any).post = mock;
  try {
    await fn();
  } finally {
    (axios as any).post = originalPost;
  }
};

describe("TwilioSmsService - logs y fallback trial", () => {
  test("Registra un SMS enviado en messageLogs", async () => {
    const { logs, repo } = createRepo();

    await withMockedPost(
      async () => ({ data: { sid: "SM123", status: "queued" } }),
      async () => {
        await new TwilioSmsService(repo).sendMessage(
          "+18091234567",
          "Suplicem: cuenta aprobada",
          { recipientId: "user-1", kind: "account_status" }
        );
      }
    );

    assert.strictEqual(logs.length, 1);
    assert.strictEqual(logs[0].recipientId, "user-1");
    assert.strictEqual(logs[0].providerMessageId, "SM123");
    assert.strictEqual(logs[0].status, "queued");
    assert.strictEqual(logs[0].body, "Suplicem: cuenta aprobada");
  });

  test("Reintenta con plantilla trial cuando Twilio devuelve 572006", async () => {
    const { logs, repo } = createRepo();
    const bodies: string[] = [];

    await withMockedPost(
      async (_url, body) => {
        bodies.push(String(body.get("Body")));
        if (bodies.length === 1) {
          const error: any = new Error("Request failed");
          error.response = {
            data: { code: 572006, message: "Invalid template name" },
          };
          throw error;
        }
        return { data: { sid: "SM456", status: "queued" } };
      },
      async () => {
        await new TwilioSmsService(repo).sendMessage(
          "+18091234567",
          "Suplicem: cuenta aprobada",
          { recipientId: "user-1", kind: "account_status" }
        );
      }
    );

    assert.deepStrictEqual(bodies, ["Suplicem: cuenta aprobada", "sms_account_alerts"]);
    assert.strictEqual(logs.length, 1);
    assert.strictEqual(logs[0].template, "sms_account_alerts");
    assert.strictEqual(logs[0].providerMessageId, "SM456");
  });

  test("Redacta el código OTP en messageLogs", async () => {
    const { logs, repo } = createRepo();

    await withMockedPost(
      async () => ({ data: { sid: "SM789", status: "queued" } }),
      async () => {
        await new TwilioSmsService(repo).sendOtp("+18091234567", "123456");
      }
    );

    assert.strictEqual(logs.length, 1);
    assert.strictEqual(logs[0].body, "[OTP redactado]");
    assert.ok(!String(logs[0].body).includes("123456"));
  });

  test("Registra un fallo de Twilio y propaga el error", async () => {
    const { logs, repo } = createRepo();

    await assert.rejects(async () => {
      await withMockedPost(
        async () => {
          const error: any = new Error("Request failed");
          error.response = {
            data: { code: 21608, message: "The number is unverified" },
          };
          throw error;
        },
        async () => {
          await new TwilioSmsService(repo).sendMessage(
            "+18091234567",
            "Suplicem: cuenta aprobada",
            { recipientId: "user-1" }
          );
        }
      );
    }, /Twilio SMS: \[21608\]/);

    assert.strictEqual(logs.length, 1);
    assert.strictEqual(logs[0].status, "failed");
    assert.strictEqual(logs[0].errorCode, "21608");
  });
});
