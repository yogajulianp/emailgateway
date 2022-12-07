var express = require("express");
var router = express.Router();
var authHelper = require("../authHelper");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", {
    title: "Index",
    url: authHelper.getAuthUrl(),
  });
});

router.get("/authorize", function (req, res) {
  var authCode = req.query.code;
  if (authCode) {
    console.log("");
    console.log("Retrieved auth code in /authorize: " + authCode);
    authHelper.getTokenFromCode(authCode, tokenReceived, req, res);
  } else {
    // redirect to home
    console.log(
      "/authorize called without a code parameter, redirecting to login"
    );
    res.redirect("/");
  }
});

function tokenReceived(req, res, error, token) {
  if (error) {
    console.log("ERROR getting token:" + error);
    res.send("ERROR getting token: " + error);
  } else {
    // save tokens in session
    req.session.access_token = token.token.access_token;
    req.session.refresh_token = token.token.refresh_token;
    req.session.email = authHelper.getEmailFromIdToken(token.token.id_token);
    res.redirect("/home");
  }
}

router.get("/logincomplete", function (req, res) {
  var access_token = req.session.access_token;
  var refresh_token = req.session.access_token;
  var email = req.session.email;

  if (access_token === undefined || refresh_token === undefined) {
    console.log("/logincomplete called while not logged in");
    res.redirect("/");
    return;
  }

  res.send(pages.loginCompletePage(email));
});

router.get("/refreshtokens", function (req, res) {
  var refresh_token = req.session.refresh_token;
  if (refresh_token === undefined) {
    console.log("no refresh token in session");
    res.redirect("/");
  } else {
    authHelper.getTokenFromRefreshToken(refresh_token, tokenReceived, req, res);
  }
});

router.get("/logout", function (req, res) {
  req.session.destroy();
  res.redirect("/");
});

module.exports = router;
