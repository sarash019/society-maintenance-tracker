const Brevo = require('@getbrevo/brevo');

const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY;

const sendComplaintStatusEmail = async (toEmail, residentName, complaintId, category, newStatus, note) => {
  try {
    const sendSmtpEmail = new Brevo.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: toEmail, name: residentName }];
    sendSmtpEmail.sender = { email: process.env.EMAIL_USER, name: 'Society Maintenance' };
    sendSmtpEmail.subject = `Complaint #${complaintId} Status Updated: ${newStatus}`;
    sendSmtpEmail.htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Society Maintenance Tracker</h2>
        <p>Dear ${residentName},</p>
        <p>Your complaint <strong>#${complaintId}</strong> regarding <strong>${category}</strong> has been updated.</p>
        <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: bold;">New Status</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${newStatus}</td>
          </tr>
          ${note ? `<tr><td style="padding: 8px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: bold;">Admin Note</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${note}</td></tr>` : ''}
        </table>
        <p>Log in to the portal to view the full history of your complaint.</p>
      </div>
    `;
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`Status email sent to ${toEmail}`);
  } catch (err) {
    console.error('Email send error (status):', err.message);
  }
};

const sendImportantNoticeEmail = async (toEmail, residentName, noticeTitle, noticeBody) => {
  try {
    const sendSmtpEmail = new Brevo.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: toEmail, name: residentName }];
    sendSmtpEmail.sender = { email: process.env.EMAIL_USER, name: 'Society Maintenance' };
    sendSmtpEmail.subject = `[Important Notice] ${noticeTitle}`;
    sendSmtpEmail.htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Society Maintenance Tracker</h2>
        <p>Dear ${residentName},</p>
        <p>A new important notice has been posted:</p>
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 16px 0; border-radius: 4px;">
          <h3 style="margin: 0 0 8px;">${noticeTitle}</h3>
          <p style="margin: 0;">${noticeBody}</p>
        </div>
        <p>Log in to the portal to view all notices.</p>
      </div>
    `;
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`Notice email sent to ${toEmail}`);
  } catch (err) {
    console.error('Email send error (notice):', err.message);
  }
};

module.exports = { sendComplaintStatusEmail, sendImportantNoticeEmail };