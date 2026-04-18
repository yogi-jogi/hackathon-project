// Mock email utility for Phase 4 Notifications
// In a real production app, this would use nodemailer with Resend, SendGrid, etc.

async function sendEmail(to, subject, html) {
  console.log("--------------------------------------------------");
  console.log(`[Email Mock] Sending to: ${to}`);
  console.log(`[Email Mock] Subject: ${subject}`);
  console.log(`[Email Mock] Body:\n${html.replace(/<[^>]+>/g, '')}`); // Strip HTML for console
  console.log("--------------------------------------------------");
  
  // Simulate network delay
  return new Promise((resolve) => setTimeout(resolve, 500));
}

module.exports = {
  sendEmail,
};
