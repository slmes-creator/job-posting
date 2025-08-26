import { NextRequest, NextResponse } from 'next/server'
import sgMail from '@sendgrid/mail'

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    console.log('Email API called')
    
    const { 
      to, 
      volunteerName, 
      jobTitle, 
      decision, 
      message, 
      organizationName 
    } = await request.json()

    console.log('Email request data:', { to, volunteerName, jobTitle, decision, organizationName })

    // Validate required fields
    if (!to || !volunteerName || !jobTitle || !decision || !message || !organizationName) {
      console.log('Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      )
    }

    // Check environment variables
    if (!process.env.SENDGRID_API_KEY) {
      console.error('SENDGRID_API_KEY is missing')
      return NextResponse.json(
        { error: 'SendGrid API key not configured' }, 
        { status: 500 }
      )
    }

    if (!process.env.FROM_EMAIL) {
      console.error('FROM_EMAIL is missing')
      return NextResponse.json(
        { error: 'From email not configured' }, 
        { status: 500 }
      )
    }

    console.log('Environment variables check passed')

    // Create email template based on decision
    const isApproved = decision === 'approved'
    
    const emailTemplate = isApproved 
      ? `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Application Approved</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0; 
              padding: 0;
              background-color: #f4f4f4;
            }
            .container { 
              max-width: 600px; 
              margin: 20px auto; 
              background: white;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .header { 
              background: linear-gradient(135deg, #4CAF50, #45a049); 
              color: white; 
              padding: 30px; 
              text-align: center;
            }
            .content { 
              padding: 30px;
            }
            .message-box { 
              background: #f8f9fa; 
              padding: 20px; 
              border-left: 4px solid #4CAF50; 
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer { 
              text-align: center; 
              padding: 20px;
              background-color: #f8f9fa;
              color: #666; 
              font-size: 14px;
              border-top: 1px solid #eee;
            }
            .success-icon { font-size: 48px; margin-bottom: 15px; }
            .btn {
              display: inline-block;
              padding: 12px 24px;
              background-color: #4CAF50;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="success-icon">🎉</div>
              <h1 style="margin: 0;">Application Approved!</h1>
            </div>
            <div class="content">
              <p>Dear <strong>${volunteerName}</strong>,</p>
              
              <p>We are pleased to inform you that your volunteer application for <strong>"${jobTitle}"</strong> has been approved.</p>
              
              <div class="message-box">
                <h3 style="margin-top: 0; color: #4CAF50;">Message from ${organizationName}:</h3>
                <p style="margin-bottom: 0; white-space: pre-wrap;">${message}</p>
              </div>
              
              <p>We look forward to working with you and making a positive impact in our community together.</p>
              
              <p>If you have any questions, please feel free to contact us.</p>
              
              <p>Welcome to our team!</p>
              <p><strong>${organizationName}</strong></p>
            </div>
            <div class="footer">
              <p>This email was sent regarding your volunteer application submitted through our platform.</p>
              <p>Please save this email for your records.</p>
            </div>
          </div>
        </body>
        </html>
      `
      : `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Application Update</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0; 
              padding: 0;
              background-color: #f4f4f4;
            }
            .container { 
              max-width: 600px; 
              margin: 20px auto; 
              background: white;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .header { 
              background: linear-gradient(135deg, #2196F3, #1976D2); 
              color: white; 
              padding: 30px; 
              text-align: center;
            }
            .content { 
              padding: 30px;
            }
            .message-box { 
              background: #f8f9fa; 
              padding: 20px; 
              border-left: 4px solid #2196F3; 
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer { 
              text-align: center; 
              padding: 20px;
              background-color: #f8f9fa;
              color: #666; 
              font-size: 14px;
              border-top: 1px solid #eee;
            }
            .info-icon { font-size: 48px; margin-bottom: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="info-icon">📧</div>
              <h1 style="margin: 0;">Application Update</h1>
            </div>
            <div class="content">
              <p>Dear <strong>${volunteerName}</strong>,</p>
              
              <p>Thank you for your interest in volunteering with us and for taking the time to apply for <strong>"${jobTitle}"</strong>.</p>
              
              <div class="message-box">
                <h3 style="margin-top: 0; color: #2196F3;">Message from ${organizationName}:</h3>
                <p style="margin-bottom: 0; white-space: pre-wrap;">${message}</p>
              </div>
              
              <p>We encourage you to continue your volunteer journey and apply for future opportunities that match your interests and availability.</p>
              
              <p>Thank you for your willingness to make a difference in our community.</p>
              
              <p>Best regards,<br>
              <strong>${organizationName}</strong></p>
            </div>
            <div class="footer">
              <p>This email was sent regarding your volunteer application submitted through our platform.</p>
              <p>Please save this email for your records.</p>
            </div>
          </div>
        </body>
        </html>
      `

    // Create email message
    const msg = {
      to: to,
      from: {
        email: process.env.FROM_EMAIL!,
        name: organizationName
      },
      subject: `Volunteer Application ${isApproved ? 'Approved' : 'Update'} - ${jobTitle}`,
      html: emailTemplate,
      // Plain text fallback
      text: `
        Dear ${volunteerName},

        ${isApproved 
          ? `Congratulations! Your application for "${jobTitle}" has been approved.` 
          : `Thank you for your interest in "${jobTitle}".`
        }

        Message from ${organizationName}:
        ${message}

        ${isApproved 
          ? 'We look forward to working with you!' 
          : 'We encourage you to apply for future opportunities.'
        }

        Best regards,
        ${organizationName} Team
      `.trim(),
      // Add these headers to improve deliverability
      headers: {
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'Importance': 'Normal'
      },
      // Add categories for tracking
      categories: ['volunteer-application', isApproved ? 'approval' : 'decline'],
      // Add custom args for tracking
      customArgs: {
        'application_type': 'volunteer',
        'decision': decision,
        'job_id': jobTitle.replace(/\s+/g, '-').toLowerCase()
      }
    }

    // Send email
    console.log('Attempting to send email to:', to)
    await sgMail.send(msg)
    console.log('Email sent successfully')

    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'Email sent successfully' 
    })

  } catch (error: any) {
    console.error('SendGrid error:', error)
    
    // Handle specific SendGrid errors
    if (error.response) {
      console.error('SendGrid response error:', error.response.body)
      return NextResponse.json(
        { 
          error: 'Failed to send email', 
          details: error.response.body?.errors || 'Unknown SendGrid error' 
        }, 
        { status: 500 }
      )
    }

    // Handle other errors
    return NextResponse.json(
      { 
        error: 'Failed to send email', 
        details: error.message || 'Unknown error occurred' 
      }, 
      { status: 500 }
    )
  }
}
