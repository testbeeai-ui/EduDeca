/** Official EduDeca College Invitation Email HTML Template. */
export function generateCollegeInviteEmailHtml(data: {
  name: string;
  collegeName: string;
  studentCode?: string | null;
  joinUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to EduDeca — ${data.collegeName}</title>
  <style>
    body { font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #0b1219; color: #eef4f2; margin: 0; padding: 24px; }
    .container { max-width: 580px; margin: 0 auto; background: #0e141b; border: 1px solid #212b36; border-radius: 20px; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    .logo-badge { display: inline-block; font-size: 11px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; color: #22d3a6; background: rgba(34,211,166,0.12); border: 1px solid rgba(34,211,166,0.3); padding: 4px 12px; border-radius: 20px; margin-bottom: 16px; }
    h1 { font-family: 'Space Grotesk', system-ui, sans-serif; font-size: 26px; line-height: 1.25; font-weight: 700; color: #ffffff; margin: 0 0 12px; }
    .accent { color: #22d3a6; }
    p { font-size: 14px; line-height: 1.6; color: #8a99a6; margin: 0 0 20px; }
    .info-card { background: #141c25; border: 1px solid #212b36; border-radius: 14px; padding: 16px; margin-bottom: 24px; }
    .info-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px; }
    .info-row:last-child { margin-bottom: 0; }
    .info-label { color: #5e6c78; font-weight: 600; }
    .info-val { color: #eef4f2; font-weight: 700; }
    .btn { display: block; width: 100%; text-align: center; text-decoration: none; font-size: 15px; font-weight: 800; color: #04120e; background: linear-gradient(90deg, #22d3a6, #3d8de0); padding: 14px 20px; border-radius: 12px; box-shadow: 0 8px 24px rgba(34,211,166,0.25); box-sizing: border-box; }
    .footer { text-align: center; font-size: 11.5px; color: #5e6c78; margin-top: 24px; border-top: 1px solid #1a222c; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-badge">EduDeca Official Invitation</div>
    <h1>Welcome, <span class="accent">${data.name}</span>!</h1>
    <p>Your institution <b>${data.collegeName}</b> has selected you to represent your college at <b>EduDeca</b> — India's National Academic Decathlon for Class XI–XII students.</p>
    
    <div class="info-card">
      <div class="info-row"><span class="info-label">Student Name:</span><span class="info-val">${data.name}</span></div>
      <div class="info-row"><span class="info-label">College:</span><span class="info-val">${data.collegeName}</span></div>
      ${data.studentCode ? `<div class="info-row"><span class="info-label">Student ID:</span><span class="info-val">${data.studentCode}</span></div>` : ""}
      <div class="info-row"><span class="info-label">Access:</span><span class="info-val">Free Zone Level 1 Challenge</span></div>
    </div>

    <a href="${data.joinUrl}" class="btn">Activate EduDeca Student Profile →</a>
    
    <div class="footer">
      EduDeca National Academic Decathlon · Powered by EduBlast<br>
      This email was sent to you because ${data.collegeName} nominated you for the decathlon.
      Sign in with Google at edu-deca.vercel.app — no password invite link.
    </div>
  </div>
</body>
</html>
`;
}
