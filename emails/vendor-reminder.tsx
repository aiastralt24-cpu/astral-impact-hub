type VendorReminderEmailProps = {
  vendorName: string;
  projectName: string;
  dueLabel: string;
};

export function VendorReminderEmail({ vendorName, projectName, dueLabel }: VendorReminderEmailProps) {
  return (
    <div style={{ fontFamily: "Inter, Arial, sans-serif", padding: "24px", color: "#374151" }}>
      <h1 style={{ fontSize: "22px", marginBottom: "16px", color: "#0B3D2E" }}>Update reminder</h1>
      <p>Hello {vendorName},</p>
      <p>
        This is a reminder to submit the latest field update for <strong>{projectName}</strong>. The expected reporting
        window was {dueLabel}.
      </p>
      <p>Please complete the update as soon as possible so the project can move through review and content generation.</p>
    </div>
  );
}
