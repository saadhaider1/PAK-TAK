import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use TLS
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 5000, // 5 seconds
    greetingTimeout: 5000,
    socketTimeout: 5000,
    tls: {
        rejectUnauthorized: false // For local development
    }
});

export async function sendPasswordResetEmail(email: string, pin: string) {
    // Check for credentials
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('❌ EMAIL_USER or EMAIL_PASS not set in .env.local');
        throw new Error('Email configuration missing. Please check .env.local file.');
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset PIN - PROPLEDGER',
        text: `Your password reset PIN is: ${pin}. It expires in 15 minutes.`,
        html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #008080;">Password Reset Request</h2>
        <p>You requested a password reset for your PROPLEDGER account.</p>
        <p>Your verification PIN is:</p>
        <h1 style="letter-spacing: 5px; background: #f4f4f4; padding: 10px; display: inline-block;">${pin}</h1>
        <p>This PIN will expire in 15 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `,
    };

    try {
        console.log('Sending email to:', email);

        // Set a timeout for the entire operation
        const sendPromise = transporter.sendMail(mailOptions);
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Email sending timed out after 10 seconds')), 10000)
        );

        await Promise.race([sendPromise, timeoutPromise]);
        console.log(`✅ Password reset email sent to ${email}`);
        return true;
    } catch (error: any) {
        console.error('❌ Error sending email:', error);
        // Throw a user-friendly error
        if (error.message.includes('timeout')) {
            throw new Error('Email service is taking too long to respond. Please try again.');
        } else if (error.code === 'EAUTH') {
            throw new Error('Email authentication failed. Please check your Gmail App Password.');
        } else if (error.code === 'ECONNECTION') {
            throw new Error('Could not connect to email server. Please check your internet connection.');
        }
        throw new Error(error.message || 'Failed to send email');
    }
}
