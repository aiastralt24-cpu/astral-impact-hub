type AccountWelcomeEmailProps = {
  fullName: string;
  username: string;
  temporaryPassword: string;
  accountLabel: string;
  organizationName?: string;
  loginUrl: string;
};

export function AccountWelcomeEmail({
  fullName,
  username,
  temporaryPassword,
  accountLabel,
  organizationName,
  loginUrl
}: AccountWelcomeEmailProps) {
  return (
    <div style={{ backgroundColor: "#f4f7fb", color: "#172033", fontFamily: "Arial, sans-serif", padding: "32px 16px" }}>
      <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", margin: "0 auto", maxWidth: "620px", padding: "32px" }}>
        <p style={{ color: "#0059ff", fontSize: "12px", fontWeight: 700, letterSpacing: "0.14em", margin: "0 0 12px", textTransform: "uppercase" }}>Astral Foundation</p>
        <h1 style={{ fontSize: "26px", lineHeight: 1.25, margin: "0 0 20px" }}>Your portal account is ready</h1>
        <p>Hello {fullName},</p>
        <p>
          You have been registered as {accountLabel === "CSR Associate" ? "a" : "an"} <strong>{accountLabel}</strong> on the Astral Foundation portal
          {organizationName ? <> for <strong>{organizationName}</strong></> : null}.
        </p>
        <p>Please review the details below and contact the Astral Foundation team if any information is incorrect.</p>
        <div style={{ backgroundColor: "#f5f8ff", border: "1px solid #dce6ff", borderRadius: "14px", margin: "24px 0", padding: "20px" }}>
          <p style={{ margin: "0 0 10px" }}><strong>User ID:</strong> {username}</p>
          <p style={{ margin: 0 }}><strong>Temporary password:</strong> {temporaryPassword}</p>
        </div>
        <p style={{ color: "#5f6b7d", fontSize: "14px" }}>For security, sign in and change this temporary password as soon as possible. Do not forward this email.</p>
        <a href={loginUrl} style={{ backgroundColor: "#0059ff", borderRadius: "999px", color: "#ffffff", display: "inline-block", fontWeight: 700, marginTop: "12px", padding: "13px 22px", textDecoration: "none" }}>Sign in to the portal</a>
        <p style={{ color: "#7a8596", fontSize: "12px", marginTop: "28px" }}>If you were not expecting this account, please contact the Astral Foundation team immediately.</p>
      </div>
    </div>
  );
}
