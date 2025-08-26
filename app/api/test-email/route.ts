import { NextRequest, NextResponse } from 'next/server'
import sgMail from '@sendgrid/mail'

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export async function GET() {
  try {
    console.log('Testing email configuration...')
    
    // Check environment variables
    if (!process.env.SENDGRID_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'SENDGRID_API_KEY is missing'
      })
    }

    if (!process.env.FROM_EMAIL) {
      return NextResponse.json({
        success: false,
        error: 'FROM_EMAIL is missing'
      })
    }

    // Send a test email to yourself
    const msg = {
      to: process.env.FROM_EMAIL,
      from: {
        email: process.env.FROM_EMAIL,
        name: 'Test Organization'
      },
      subject: 'SendGrid Test Email',
      html: `
        <h1>Test Email</h1>
        <p>If you receive this email, your SendGrid configuration is working correctly!</p>
        <p>Time: ${new Date().toISOString()}</p>
      `,
      text: `Test email sent at ${new Date().toISOString()}`
    }

    await sgMail.send(msg)

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      to: process.env.FROM_EMAIL
    })

  } catch (error: any) {
    console.error('SendGrid test error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to send test email',
      details: error.message
    })
  }
}
