const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: 'b0c763001@smtp-brevo.com',
    pass: process.env.EMAIL_PASS
  }
});

const sendComplaintStatusEmail = async (toEmail, residentName, complaintId, category, newStatus, note) => {
  try {
    await transporter.sendMail({
      from: `"Society Maintenance" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `Complaint #${complaintId} Status Updated: ${newStatus}`,
      html: `
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
          <p>You can log in to the portal to view the full history of your complaint.</p>
          <p style="color: #6b7280; font-size: 12px;">This is an automated message from Society Maintenance Tracker.</p>
        </div>
      `
    });
    console.log(`Status email sent to ${toEmail}`);
  } catch (err) {
    console.error('Email send error (status):', err.message);
  }
};

const sendImportantNoticeEmail = async (toEmail, residentName, noticeTitle, noticeBody) => {
  try {
    await transporter.sendMail({
      from: `"Society Maintenance" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `[Important Notice] ${noticeTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Society Maintenance Tracker</h2>
          <p>Dear ${residentName},</p>
          <p>A new important notice has been posted by the admin:</p>
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 16px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 8px;">${noticeTitle}</h3>
            <p style="margin: 0;">${noticeBody}</p>
          </div>
          <p>Log in to the portal to view all notices.</p>
          <p style="color: #6b7280; font-size: 12px;">This is an automated message from Society Maintenance Tracker.</p>
        </div>
      `
    });
    console.log(`Notice email sent to ${toEmail}`);
  } catch (err) {
    console.error('Email send error (notice):', err.message);
  }
};

module.exports = { sendComplaintStatusEmail, sendImportantNoticeEmail };
