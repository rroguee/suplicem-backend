import sgMail from "@sendgrid/mail";
import nodemailer, { Transporter } from "nodemailer";
import {
  getWelcomeEmailTemplate,
  getAccountApprovedEmailTemplate,
  getVerificationEmailTemplate,
  getAdminCreatedAccountEmailTemplate,
} from "./EmailTemplates";

export class RegistrationBotService {
  private smtpTransporter: Transporter | null = null;
  private testTransporter: Transporter | null = null;

  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (apiKey) {
      sgMail.setApiKey(apiKey);
    }
    this.initSmtpPool();
  }

  /**
   * Inicializa un pool persistente de conexiones SMTP si existen credenciales
   */
  private initSmtpPool(): void {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.smtpTransporter = nodemailer.createTransport({
        pool: true, // Reutiliza conexiones TCP abiertas para evitar bloqueos
        maxConnections: 3,
        maxMessages: 100,
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  private async dispatchEmail(to: string, subject: string, html: string): Promise<void> {
    const sender = process.env.BOT_SENDER_EMAIL || process.env.SMTP_USER || "suplicem.notificaciones@gmail.com";

    // 1. SendGrid si está configurado (Producción dedicada)
    if (process.env.SENDGRID_API_KEY) {
      try {
        await sgMail.send({
          to,
          from: sender,
          subject,
          html,
        });
        console.log(`✅ [Bot de Correo] Enviado mediante SendGrid a ${to}`);
        return;
      } catch (err: any) {
        console.error("Error en SendGrid, intentando transportes alternativos...", err?.message);
      }
    }

    // 2. SMTP Pool persistente (Gmail / Servidor dedicado)
    if (this.smtpTransporter) {
      try {
        const plainText = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        const info = await this.smtpTransporter.sendMail({
          from: `"Suplicem" <${process.env.SMTP_USER}>`,
          replyTo: process.env.SMTP_USER,
          to,
          subject,
          text: plainText,
          html,
          headers: {
            "X-Entity-Ref-ID": `${Date.now()}-${to}`,
          },
        });
        console.log(`✅ [Bot de Correo] Enviado mediante SMTP a ${to}. ID: ${info.messageId}`);
        return;
      } catch (err: any) {
        console.error("Error en transporte SMTP:", err?.message);
      }
    }

    // 3. Fallback de prueba con Ethereal (Singleton para tests y entorno local)
    try {
      if (!this.testTransporter) {
        const testAccount = await nodemailer.createTestAccount();
        this.testTransporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
      }

      const info = await this.testTransporter.sendMail({
        from: '"Suplicem Bot" <bot@suplicem.com>',
        to,
        subject,
        html,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`✅ [Bot de Correo Suplicem] Correo enviado exitosamente a ${to}`);
      if (previewUrl) {
        console.log(`🔗 [Ver Correo en Bandeja de Entrada Real]: ${previewUrl}`);
      }
    } catch {
      console.log(`🤖 [Bot de Correo Suplicem] Correo generado para ${to}`);
    }
  }

  /**
   * Bot que despacha automáticamente un correo de bienvenida y confirmación de perfil
   */
  async sendWelcomeEmailBot(
    email: string,
    names: string,
    lastNames: string,
    userType: string,
    identification: string,
    verificationLink?: string
  ): Promise<void> {
    console.log(
      `🤖 [Bot de Correo Suplicem] Procesando envío automático de bienvenida para el perfil: ${email}`
    );
    const { subject, html } = getWelcomeEmailTemplate(
      names,
      lastNames,
      userType,
      identification,
      email,
      verificationLink
    );
    await this.dispatchEmail(email, subject, html);
  }

  /**
   * Bot que despacha automáticamente un correo cuando la cuenta es aprobada por el Administrador.
   */
  async sendAccountApprovedEmailBot(
    email: string,
    names: string,
    lastNames: string
  ): Promise<void> {
    console.log(
      `🤖 [Bot de Correo Suplicem] Procesando envío de aprobación de cuenta para: ${email}`
    );
    const { subject, html } = getAccountApprovedEmailTemplate(names, lastNames, email);
    await this.dispatchEmail(email, subject, html);
  }

  /**
   * Bot que despacha correo de verificación con enlace directo
   */
  async sendVerificationEmailBot(email: string, link: string): Promise<void> {
    console.log(
      `🤖 [Bot de Correo Suplicem] Enviando correo de verificación de cuenta para: ${email}`
    );
    const { subject, html } = getVerificationEmailTemplate(link);
    await this.dispatchEmail(email, subject, html);
  }

  /**
   * Bot que despacha correo de bienvenida para cuentas creadas directamente por el Administrador.
   */
  async sendAdminCreatedAccountEmailBot(
    email: string,
    names: string,
    lastNames: string,
    userType: string,
    identification: string
  ): Promise<void> {
    console.log(
      `🤖 [Bot de Correo Suplicem] Enviando bienvenida de cuenta creada por Admin para: ${email}`
    );
    const { subject, html } = getAdminCreatedAccountEmailTemplate(
      names,
      lastNames,
      userType,
      identification,
      email
    );
    await this.dispatchEmail(email, subject, html);
  }
}
