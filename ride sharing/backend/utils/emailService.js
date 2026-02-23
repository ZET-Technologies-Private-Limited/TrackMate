const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendRideAcceptedEmail = async (passengerEmail, passengerName, tripDetails) => {
    const mailOptions = {
        from: `"RideShare Mission Control" <${process.env.EMAIL_USER}>`,
        to: passengerEmail,
        subject: 'MISSION CONFIRMED: Your Ride is Accepted! 🚀',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
                <div style="background: #10b981; padding: 40px 20px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Mission Accepted</h1>
                </div>
                <div style="padding: 30px; background: white;">
                    <p style="font-size: 16px; color: #475569;">Hello <strong>${passengerName}</strong>,</p>
                    <p style="font-size: 16px; color: #475569; line-height: 1.6;">Your ride request for the mission has been <strong>ACCEPTED</strong> by the operative. Get ready for your journey!</p>
                    
                    <div style="background: #f8fafc; padding: 20px; border-radius: 16px; margin: 25px 0;">
                        <h3 style="margin-top: 0; color: #1e293b; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Route Briefing</h3>
                        <p style="margin: 5px 0; color: #64748b; font-size: 14px;"><strong>Target:</strong> ${tripDetails.endPoint.address}</p>
                        <p style="margin: 5px 0; color: #64748b; font-size: 14px;"><strong>Deployment:</strong> ${new Date(tripDetails.departureTime).toLocaleString()}</p>
                    </div>

                    <p style="font-size: 14px; color: #94a3b8; text-align: center; margin-top: 30px;">
                        Track your live mission status in the dashboard.
                    </p>
                </div>
                <div style="background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
                    &copy; 2026 RideShare Galactic. All units engaged.
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${passengerEmail}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

const sendWelcomeEmail = async (userEmail, userName) => {
    const mailOptions = {
        from: `"RideShare Mission Control" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: 'WELCOME TO THE FLEET: Account Activated! ⚡️',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
                <div style="background: #0f172a; padding: 40px 20px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Identity Verified</h1>
                </div>
                <div style="padding: 30px; background: white;">
                    <p style="font-size: 16px; color: #475569;">Welcome to RideShare, <strong>${userName}</strong>,</p>
                    <p style="font-size: 16px; color: #475569; line-height: 1.6;">Your account has been successfully created and activated. You are now cleared for mission participation.</p>
                    
                    <div style="background: #f1f5f9; padding: 20px; border-radius: 16px; margin: 25px 0;">
                        <h3 style="margin-top: 0; color: #1e293b; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Access Credentials</h3>
                        <p style="margin: 5px 0; color: #64748b; font-size: 14px;"><strong>ID:</strong> ${userEmail}</p>
                    </div>

                    <p style="font-size: 14px; color: #94a3b8; text-align: center; margin-top: 30px;">
                        Start exploring trips or verify your vehicle in the dashboard.
                    </p>
                </div>
                <div style="background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
                    &copy; 2026 RideShare Galactic. Secure Operations.
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending welcome email:', error);
    }
};

const sendRideRequestEmail = async (driverEmail, driverName, passengerName, tripDetails) => {
    const mailOptions = {
        from: `"RideShare Mission Control" <${process.env.EMAIL_USER}>`,
        to: driverEmail,
        subject: 'ACTION REQUIRED: New Join Request for Your Mission! 📡',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
                <div style="background: #3b82f6; padding: 40px 20px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Join Request</h1>
                </div>
                <div style="padding: 30px; background: white;">
                    <p style="font-size: 16px; color: #475569;">Hello <strong>${driverName}</strong>,</p>
                    <p style="font-size: 16px; color: #475569; line-height: 1.6;"><strong>${passengerName}</strong> has requested to join your mission to <u>${tripDetails.endPoint.address}</u>.</p>
                    
                    <div style="background: #f1f5f9; padding: 20px; border-radius: 16px; margin: 25px 0;">
                        <h3 style="margin-top: 0; color: #1e293b; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Request Intelligence</h3>
                        <p style="margin: 5px 0; color: #64748b; font-size: 14px;"><strong>Passenger:</strong> ${passengerName}</p>
                        <p style="margin: 5px 0; color: #64748b; font-size: 14px;"><strong>Seats:</strong> ${tripDetails.seatsBooked || 1}</p>
                    </div>

                    <p style="font-size: 14px; color: #94a3b8; text-align: center; margin-top: 30px;">
                        Approve or decline this request in your Fleet Dashboard.
                    </p>
                </div>
                <div style="background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
                    &copy; 2026 RideShare Galactic. Fleet Management.
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending ride request email:', error);
    }
};

module.exports = { sendRideAcceptedEmail, sendWelcomeEmail, sendRideRequestEmail };
