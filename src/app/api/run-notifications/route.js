import prisma from '../../lib/prisma';
import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

// CORS headers handling
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://ecoclassify.com',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle OPTIONS preflight request
export async function OPTIONS() {
  console.log('OPTIONS request received');
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders
  });
}

export const dynamic = 'force-dynamic';

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
  // Get today's date
  const today = new Date();
  // Set to start of day
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  // Set to end of day
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);
  
  console.log(`Fetching events between ${startOfDay.toISOString()} and ${endOfDay.toISOString()}`);
  
  try {
    // Find events with today's date
    return await prisma.event.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });
  } catch (error) {
    console.error('Error in getTodayEvents:', error);
    throw error; // Rethrow to handle in the caller
  }
};

const createEmailContent = (event) => {
  // Format the date for display
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
      <p>Hello,</p>
      <p>This is a friendly reminder about your scheduled waste disposal task for today, ${formattedDate}.</p>
      
      <div class="task-box">
        <h3>Scheduled Task Details:</h3>
        <p><strong>Task:</strong> ${event.title}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
      </div>
      
      <p>Proper waste disposal helps protect our environment and promotes sustainability in our community.</p>
      
      <p>Thank you for using EcoClassify to manage your waste disposal schedule.</p>
      
      <a href="${process.env.APP_URL || 'https://ecoclassify.com'}/dashboard" class="button">View Your Dashboard</a>
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

Hello,

This is a friendly reminder about your scheduled waste disposal task for today, ${formattedDate}.

SCHEDULED TASK DETAILS:
Task: ${event.title}
Date: ${formattedDate}

Proper waste disposal helps protect our environment and promotes sustainability in our community.

Thank you for using EcoClassify to manage your waste disposal schedule.

Visit your dashboard at: ${process.env.APP_URL || 'https://ecoclassify.com'}/dashboard

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
    
    let successCount = 0;
    const emailResults = [];
    
    for (const event of events) {
      console.log(`Processing event ID: ${event.id}, Title: ${event.title}, Email: ${event.email}`);
      
      if (!event.email) {
        console.log(`No email found for event ID: ${event.id}, skipping notification`);
        emailResults.push({
          eventId: event.id,
          status: 'Failed',
          error: 'Missing email address'
        });
        continue;
      }
      
      const subject = `EcoClassify Reminder: ${event.title} scheduled today`;
      const { htmlContent, textContent } = createEmailContent(event);
      
      try {
        await sendEmail(event.email, subject, htmlContent, textContent);
        console.log(`Notification sent for event ID: ${event.id} to ${event.email}`);
        successCount++;
        emailResults.push({
          eventId: event.id,
          email: event.email,
          status: 'Success'
        });
      } catch (emailError) {
        console.error(`Failed to send email for event ID: ${event.id}:`, emailError);
        emailResults.push({
          eventId: event.id,
          email: event.email,
          status: 'Failed',
          error: emailError.message
        });
      }
    }
    
    return { 
      success: true, 
      totalEvents: events.length,
      successfulEmails: successCount,
      failedEmails: events.length - successCount,
      results: emailResults
    };
  } catch (error) {
    console.error('Error sending daily notifications:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

// Vercel serverless function handler
export async function GET(req) {
  console.log('GET request received at:', new Date().toISOString());
  
  try {
    const result = await sendDailyNotifications();
    return NextResponse.json(result, { headers: corsHeaders });
  } catch (error) {
    console.error('Comprehensive error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({
      success: false,
      error: error.message
    }, {
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function POST(req) {
  console.log('POST request received at:', new Date().toISOString());
  
  try {
    const result = await sendDailyNotifications();
    return NextResponse.json(result, { headers: corsHeaders });
  } catch (error) {
    console.error('Comprehensive error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({
      success: false,
      error: error.message
    }, {
      status: 500,
      headers: corsHeaders
    });
  }
}

// Default export for backwards compatibility
export default {
  GET,
  POST,
  OPTIONS
};