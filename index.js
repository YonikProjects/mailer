require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const cors = require("cors");
let fetch;
import("node-fetch").then((module) => {
  fetch = module.default;
});
let allowlist = [
  "https://dmitrypol.com",
  "http://localhost:5173",
  "https://test.dmitrypol.com",
  "https://portfolio.dmitrypol.com",
];
const corsOptions = {
  origin: function (origin, callback) {
    if (allowlist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};
const app = express();
const PORT = 3000;
const verifyTokenMiddleware = async (req, res, next) => {
  const token = req.body["cf-turnstile-response"];
  const url = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
  const data = {
    secret: process.env.TURNSTILE,
    response: token,
  };
  try {
    const result = await fetch(url, {
      body: JSON.stringify(data),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const outcome = await result.json();
    console.log(outcome);
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

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); // Assuming the token is sent as JSON
app.use(verifyTokenMiddleware);
app.post("/pform", async (req, res) => {
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
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
