require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
let fetch;
import("node-fetch").then((module) => {
  fetch = module.default;
});

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
const verifyTokenMiddleware = async (req, res, next) => {
  // Assuming you have the token from the request, if not, adjust accordingly
  const token = req.body.token;

  // Use the FormData class to format the data
  const formData = new URLSearchParams();
  formData.append("secret", process.env.TURNSTILE);
  formData.append("response", token);
  const url = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

  try {
    const result = await fetch(url, {
      body: formData,
      method: "POST",
    });

    const outcome = await result.json();
    if (outcome.success) {
      next(); // Continue to the next middleware/route if successful
    } else {
      // Handle the verification failure
      res.status(401).json({ error: "Verification failed" });
    }
  } catch (error) {
    // Handle any other errors that might occur
    console.error("Error verifying token:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

app.use(express.json()); // Assuming the token is sent as JSON
app.use(verifyTokenMiddleware);
app.post("/pform", async (req, res) => {
  let formData = req.body;
  console.log(formData);
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
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
