require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const { turnstile } = require("express-turnstile");

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));

app.post(
  "/pform",
  turnstile.validate(process.env.TURNSTILE),
  async (req, res) => {
    let formData = req.body;

    let transporter = nodemailer.createTransport({
      host: process.env.SMTP_Server,
      port: process.env.SMTP_Port,
      // secure: true,
      auth: {
        user: process.env.SMTP_User,
        pass: process.env.SMTP_Pass,
      },
    });

    let mailOptions = {
      from: process.env.From,
      to: process.env.To, // Your email where you want to receive the forwarded data
      subject: "New Form Submission",
      text: `
            Name: ${formData.name}
            Email: ${formData.email}
            Phone: ${formData.phone}
            Subject: ${formData.subject}
            Message: ${formData.message}
        `,
    };

    try {
      await transporter.sendMail(mailOptions);
      res.json({ success: true });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ success: false });
    }
  }
);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
