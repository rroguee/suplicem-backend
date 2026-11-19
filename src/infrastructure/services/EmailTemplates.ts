/**
 * Plantillas HTML y Asuntos de Correo Electrónico para Suplicem
 */

export interface EmailContent {
  subject: string;
  html: string;
}

export function getWelcomeEmailTemplate(
  names: string,
  lastNames: string,
  userType: string,
  identification: string,
  email: string,
  verificationLink?: string
): EmailContent {
  const roleLabel =
    userType === "client"
      ? "Cliente"
      : userType === "driver"
      ? "Conductor"
      : "Administrador";

  const verificationButtonHtml = verificationLink
    ? `
      <div style="text-align: center; margin: 28px 0;">
        <a href="${verificationLink}" style="background-color: #E31E24; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
          Verificar mi Correo
        </a>
      </div>
      <p style="font-size: 13px; color: #64748B; line-height: 1.5; text-align: center;">
        Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:<br />
        <a href="${verificationLink}" style="color: #0284C7; word-break: break-all;">${verificationLink}</a>
      </p>
    `
    : "";

  const subject = "¡Bienvenido a Suplicem! Registro completado con éxito";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
      <div style="background-color: #0F294A; padding: 18px; text-align: center; border-radius: 6px 6px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">SUPLICEM</h1>
        <p style="color: #E31E24; margin: 4px 0 0 0; font-weight: bold; font-size: 13px;">Logística & Distribución de Materiales</p>
      </div>

      <div style="padding: 24px; color: #334155;">
        <h2 style="color: #0F294A; margin-top: 0;">¡Hola, ${names} ${lastNames}!</h2>
        <p style="font-size: 15px; line-height: 1.6;">
          Tu registro en la plataforma <strong>Suplicem</strong> ha sido procesado y guardado correctamente en nuestra base de datos.
        </p>

        <div style="background-color: #f8fafc; padding: 16px; border-left: 4px solid #E31E24; margin: 20px 0; border-radius: 4px;">
          <h3 style="margin-top: 0; color: #0F294A; font-size: 16px;">📌 Datos de tu Perfil Registrado:</h3>
          <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
            <li><strong>Nombre completo:</strong> ${names} ${lastNames}</li>
            <li><strong>Identificación:</strong> ${identification}</li>
            <li><strong>Correo registrado:</strong> ${email}</li>
            <li><strong>Tipo de usuario:</strong> ${roleLabel}</li>
          </ul>
        </div>

        ${verificationButtonHtml}

        <p style="font-size: 14px; line-height: 1.5;">
          Tu solicitud de cuenta se encuentra en revisión por el Administrador. Tan pronto tu documento sea verificado, recibirás una notificación de activación.
        </p>

        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
          <p>Este es un mensaje automático generado por Suplicem Dominicana.</p>
          <p>© ${new Date().getFullYear()} Suplicem Dominicana. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  `;

  return { subject, html };
}

export function getAccountApprovedEmailTemplate(
  names: string,
  lastNames: string,
  email: string
): EmailContent {
  const subject = "🎉 ¡Tu cuenta en Suplicem ha sido aprobada!";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
      <div style="background-color: #0F294A; padding: 18px; text-align: center; border-radius: 6px 6px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">SUPLICEM</h1>
        <p style="color: #4ADE80; margin: 4px 0 0 0; font-weight: bold; font-size: 13px;">✔ Cuenta Habilitada</p>
      </div>

      <div style="padding: 24px; color: #334155;">
        <h2 style="color: #0F294A; margin-top: 0;">¡Buenas noticias, ${names} ${lastNames}!</h2>
        <p style="font-size: 15px; line-height: 1.6;">
          Tu solicitud de registro y documento de identificación han sido revisados y <strong>aprobados con éxito</strong> por nuestro equipo de administración.
        </p>

        <div style="background-color: #f0fdf4; padding: 16px; border-left: 4px solid #22c55e; margin: 20px 0; border-radius: 4px;">
          <h3 style="margin-top: 0; color: #15803d; font-size: 16px;">🚀 ¡Tu cuenta ya está activa!</h3>
          <p style="margin: 0; font-size: 14px; color: #166534; line-height: 1.6;">
            Ya puedes abrir la aplicación de Suplicem en tu dispositivo móvil e iniciar sesión utilizando tu correo electrónico (<strong>${email}</strong>) y contraseña.
          </p>
        </div>

        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
          <p>🤖 Este es un mensaje automático generado por el Bot de Notificaciones de Suplicem.</p>
          <p>© ${new Date().getFullYear()} Suplicem Dominicana. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  `;

  return { subject, html };
}

export function getVerificationEmailTemplate(link: string): EmailContent {
  const subject = "✉️ Verifica tu correo electrónico - Suplicem";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
      <div style="background-color: #0F294A; padding: 18px; text-align: center; border-radius: 6px 6px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">SUPLICEM</h1>
        <p style="color: #E31E24; margin: 4px 0 0 0; font-weight: bold; font-size: 13px;">Logística & Distribución de Materiales</p>
      </div>

      <div style="padding: 24px; color: #334155;">
        <h2 style="color: #0F294A; margin-top: 0;">Verifica tu correo electrónico</h2>
        <p style="font-size: 15px; line-height: 1.6;">
          Hemos recibido una solicitud para reenviar el enlace de verificación para tu cuenta en <strong>Suplicem</strong>.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${link}" style="background-color: #E31E24; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
            Verificar mi Correo
          </a>
        </div>

        <p style="font-size: 13px; color: #64748B; line-height: 1.5;">
          Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:<br />
          <a href="${link}" style="color: #0284C7; word-break: break-all;">${link}</a>
        </p>

        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
          <p>🤖 Si no solicitaste este correo, puedes ignorarlo de forma segura.</p>
          <p>© ${new Date().getFullYear()} Suplicem Dominicana. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  `;

  return { subject, html };
}

export function getAdminCreatedAccountEmailTemplate(
  names: string,
  lastNames: string,
  userType: string,
  identification: string,
  email: string
): EmailContent {
  const roleLabel =
    userType === "client"
      ? "Cliente"
      : userType === "driver"
      ? "Conductor"
      : "Administrador";

  const subject = "🎉 ¡Bienvenido a Suplicem! Tu cuenta ha sido creada";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
      <div style="background-color: #0F294A; padding: 18px; text-align: center; border-radius: 6px 6px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">SUPLICEM</h1>
        <p style="color: #4ADE80; margin: 4px 0 0 0; font-weight: bold; font-size: 13px;">✔ Cuenta Habilitada y Verificada</p>
      </div>

      <div style="padding: 24px; color: #334155;">
        <h2 style="color: #0F294A; margin-top: 0;">¡Hola, ${names} ${lastNames}!</h2>
        <p style="font-size: 15px; line-height: 1.6;">
          Un administrador de <strong>Suplicem</strong> ha creado y habilitado tu cuenta en nuestra plataforma.
        </p>

        <div style="background-color: #f8fafc; padding: 16px; border-left: 4px solid #0F294A; margin: 20px 0; border-radius: 4px;">
          <h3 style="margin-top: 0; color: #0F294A; font-size: 16px;">📌 Datos de tu Cuenta:</h3>
          <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
            <li><strong>Nombre completo:</strong> ${names} ${lastNames}</li>
            <li><strong>Correo de acceso:</strong> ${email}</li>
            <li><strong>Rol asignado:</strong> ${roleLabel}</li>
            <li><strong>Identificación:</strong> ${identification}</li>
          </ul>
        </div>

        <div style="background-color: #f0fdf4; padding: 16px; border-left: 4px solid #22c55e; margin: 20px 0; border-radius: 4px;">
          <h3 style="margin-top: 0; color: #15803d; font-size: 16px;">🚀 ¡Tu cuenta ya está lista para usarse!</h3>
          <p style="margin: 0; font-size: 14px; color: #166534; line-height: 1.6;">
            Tu correo y documentos ya se encuentran verificados. Ya puedes abrir la aplicación móvil de Suplicem e iniciar sesión directamente con tu correo electrónico y tu contraseña asignada.
          </p>
        </div>

        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
          <p>🤖 Este es un mensaje automático generado por Suplicem Dominicana.</p>
          <p>© ${new Date().getFullYear()} Suplicem Dominicana. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  `;

  return { subject, html };
}
