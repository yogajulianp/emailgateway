var express = require("express");
var router = express.Router();
var nodemailer = require("nodemailer");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("home", { title: "Home", email: req.session.email });
});

router.post("/send", async (req, res) => {
  let text = `
  <p> Hello, ${req.body.name} </p>
  <p>${req.body.message}</p>

  <p>from Rapidtech with ❤️</p>
  `;
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    service: "hotmail",
    auth: {
      user: req.session.email, // generated ethereal user
      pass: req.body.password, // generated ethereal password
    },
  });

  // send mail with defined transport object
  let options = {
    from: `"Rapid Tech EmailManagementSystem" <Yoga.Prasutiyo@rapidtech.id>`, // sender address
    to: req.body.email, // list of receivers
    subject: req.body.subject, // Subject line
    text: "Test mail", // plain text body
    html: text, // html body
  };

  transporter.sendMail(options, function (err, info) {
    if (err) {
      console.log(err);
      return;
    }

    console.log("Sent: " + info.responseText);
    res.json({
      msg: "Email sent",
      info: info.response,
    });
  });
});

module.exports = router;
