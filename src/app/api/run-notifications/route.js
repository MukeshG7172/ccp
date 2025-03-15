import prisma from '../../lib/prisma';
import nodemailer from 'nodemailer';
import express from 'express';

const configureEmailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

const sendEmail = async (to, subject, htmlContent, textContent) => {
  const transporter = configureEmailTransporter();
  
  try {
    const info = await transporter.sendMail({
      from: `"EcoClassify" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      text: textContent,
      html: htmlContent,
    });
    
    console.log(`Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

const getTodayEvents = async () => {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));
  
  return prisma.event.findMany({
    where: {
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      user: true,
    },
  });
};

const createEmailContent = (event) => {
  const userName = event.user?.name || 'Valued Customer';
  const formattedDate = event.date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EcoClassify Reminder</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #4CAF50;
      padding: 20px;
      text-align: center;
      color: white;
      border-radius: 5px 5px 0 0;
    }
    .content {
      padding: 20px;
      background-color: #ffffff;
      border-left: 1px solid #dddddd;
      border-right: 1px solid #dddddd;
    }
    .task-box {
      background-color: #f9f9f9;
      border-left: 4px solid #4CAF50;
      padding: 15px;
      margin: 20px 0;
    }
    .footer {
      background-color: #f1f1f1;
      padding: 15px;
      text-align: center;
      font-size: 12px;
      color: #666666;
      border-radius: 0 0 5px 5px;
      border: 1px solid #dddddd;
    }
    .button {
      display: inline-block;
      background-color: #4CAF50;
      color: white;
      padding: 10px 20px;
      text-decoration: none;
      border-radius: 4px;
      margin-top: 15px;
    }
    h1, h2 {
      color: #2E7D32;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>EcoClassify</h1>
      <p>Smart Waste Management Solutions</p>
    </div>
    <div class="content">
      <h2>Waste Disposal Reminder</h2>
      <p>Hello ${userName},</p>
      <p>This is a friendly reminder about your scheduled waste disposal task for today, ${formattedDate}.</p>
      
      <div class="task-box">
        <h3>Scheduled Task Details:</h3>
        <p><strong>Task:</strong> ${event.title}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        ${event.description ? `<p><strong>Description:</strong> ${event.description}</p>` : ''}
        ${event.location ? `<p><strong>Location:</strong> ${event.location}</p>` : ''}
      </div>
      
      <p>Proper waste disposal helps protect our environment and promotes sustainability in our community.</p>
      
      <p>Thank you for using EcoClassify to manage your waste disposal schedule.</p>
      
      <a href="${process.env.APP_URL}/dashboard" class="button">View Your Dashboard</a>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} EcoClassify. All rights reserved.</p>
      <p>If you have any questions, please contact our support team at <a href="mailto:support@ecoclassify.com">support@ecoclassify.com</a></p>
      <p>You're receiving this email because you have scheduled a waste disposal task with EcoClassify.</p>
    </div>
  </div>
</body>
</html>
  `;


  const textContent = `
EcoClassify - Smart Waste Management Solutions

WASTE DISPOSAL REMINDER

Hello ${userName},

This is a friendly reminder about your scheduled waste disposal task for today, ${formattedDate}.

SCHEDULED TASK DETAILS:
Task: ${event.title}
Date: ${formattedDate}
${event.description ? `Description: ${event.description}` : ''}
${event.location ? `Location: ${event.location}` : ''}

Proper waste disposal helps protect our environment and promotes sustainability in our community.

Thank you for using EcoClassify to manage your waste disposal schedule.

Visit your dashboard at: ${process.env.APP_URL}/dashboard

© ${new Date().getFullYear()} EcoClassify. All rights reserved.
If you have any questions, please contact our support team at support@ecoclassify.com

You're receiving this email because you have scheduled a waste disposal task with EcoClassify.
  `;
  
  return { htmlContent, textContent };
};

const sendDailyNotifications = async () => {
  try {
    console.log('Running waste disposal notifications...');
    
    const events = await getTodayEvents();
    console.log(`Found ${events.length} events for today`);
    
    for (const event of events) {
      if (!event.email && event.user?.email) {
        event.email = event.user.email;
      }
      
      if (!event.email) {
        console.log(`No email found for event ID: ${event.id}, skipping notification`);
        continue;
      }
      
      const subject = `EcoClassify Reminder: ${event.title} scheduled today`;
      const { htmlContent, textContent } = createEmailContent(event);
      
      await sendEmail(event.email, subject, htmlContent, textContent);
      console.log(`Notification sent for event ID: ${event.id} to ${event.email}`);
    }
    
    return { success: true, count: events.length };
  } catch (error) {
    console.error('Error sending daily notifications:', error);
    return { success: false, error: error.message };
  }
};

// Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Accept both GET and POST requests
app.use('/run-notifications', async (req, res) => {
  try {
    const result = await sendDailyNotifications();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Vercel serverless function handler
const handler = async (req, res) => {
  try {
    const result = await sendDailyNotifications();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Server setup
let server;
if (typeof require !== 'undefined' && require.main === module) {
  server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Scheduler endpoint ready at: /run-notifications');
  });
}

// Exports
export { sendDailyNotifications, server };
export default handler;