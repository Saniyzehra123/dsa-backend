// controllers/contactController.js
const db = require('../config/db');
const nodemailer = require('nodemailer');

// Save contact details and send email
exports.submitContactForm = async (req, res) => {
    const { first_name, last_name, email, mobile, message } = req.body;
    // console.log("res", first_name, last_name, email, mobile, message);

    if (!first_name || !last_name || !email || !mobile || !message) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Save contact details in the database
        const sqlQuery = 'INSERT INTO contact_us(first_name, last_name, email, mobile, message) VALUES (?, ?, ?, ?, ?)';
        const values = [first_name, last_name, email, mobile, message];
        await db.query(sqlQuery, values);

        // Set up Nodemailer for sending emails
        let transporter = nodemailer.createTransport({
            
            host: process.env.SMTP_HOST, // SMTP server (like smtp.gmail.com or smtp.office365.com)
            port: process.env.SMTP_PORT, // Port (465 for SSL, 587 for TLS)
            secure: process.env.SMTP_PORT == '465', // Use true if port is 465 (SSL), false if 587 (TLS)
            auth: {
              user: process.env.EMAIL_USER, // Your business email address
              pass: process.env.EMAIL_PASSWORD, // Your email password or app password if using 2FA
            },
        });
        
        // console.log("trans",transporter)
        // Email to Admin
        const adminMailOptions = {
            from: process.env.EMAIL_USER, // Must be your authenticated SMTP email
            to: process.env.EMAIL_USER,  // Admin's email
            subject: 'New Contact Form Submission',
            text: `You have a new query from ${first_name} ${last_name} (${email}, ${mobile}):\n\n${message}`
        };
        // console.log("admintrans",transporter)
        // Email to User
        const userMailOptions = {
            from: process.env.EMAIL_USER, // Must be your authenticated SMTP email
            to: email, // Send email to the user who submitted the contact form
            subject: 'Thank you for contacting us!',
            text: `Dear ${first_name},\n\nThank you for reaching out to us. We have received your query and will get back to you shortly.\n\nBest regards,\nTeam`
        };

        // Send emails
        await transporter.sendMail(adminMailOptions);  // Email to Admin
        await transporter.sendMail(userMailOptions);  // Email to User

        res.status(200).json({ message: 'Contact form submitted successfully, emails sent!' });
    } catch (error) {
        console.error('Error in submitContactForm:', error);
        res.status(500).json({ message: 'Error submitting form', error });
    }
};
