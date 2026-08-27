export async function sendPasswordResetEmail(
  email: string,
  displayName: string,
  resetUrl: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`Password reset link for ${email}: ${resetUrl}`);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [email],
      subject: "Grandma's Card Box Password Reset Link",
      html: `<p>Hi ${escapeHtml(displayName)},</p><p>Reset your password using this link:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 30 minutes.</p>`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Password reset email failed (${response.status})`);
  }
}

export async function sendVerificationEmail(
  email: string,
  displayName: string,
  verifyUrl: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`Email verification link for ${email}: ${verifyUrl}`);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [email],
      subject: "Verify your Grandma's Card Box email",
      html: `<p>Hi ${escapeHtml(displayName)},</p><p>Confirm your email address using this link:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>This link expires in 24 hours.</p>`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Verification email failed (${response.status})`);
  }
}

export async function sendFeedbackEmail(
  typeLabel: string,
  message: string,
  fromEmail?: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.FEEDBACK_TO_EMAIL;

  if (!apiKey || !to) {
    console.log(
      `Feedback (${typeLabel})${fromEmail ? ` from ${fromEmail}` : ""}: ${message}`,
    );
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [to],
      reply_to: fromEmail || undefined,
      subject: `Grandma's Card Box feedback: ${typeLabel}`,
      html: `<p><strong>${escapeHtml(typeLabel)}</strong>${fromEmail ? ` from ${escapeHtml(fromEmail)}` : ""}</p><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Feedback email failed (${response.status})`);
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] || character);
}