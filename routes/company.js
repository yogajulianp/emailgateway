var express = require('express');
var router = express.Router();

// GET All Company
router.get('/', function (req, res, next) {
  res.render('company', { title: 'Company Data' });
});

module.exports = router;