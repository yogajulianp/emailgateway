var express = require('express');
var router = express.Router();

// const readXlsxFile = require('read-excel-file/node');
// const multer = require('multer')

const db = require('../models');
const Company = db.company;
const Contact = db.contact;

// get all
router.get("/", function (req, res, next) {
  Contact.findAll()
    .then((data) => {
      res.send(data);

      // res.render("contact", {
      //   title: "Daftar Contact",
      //   // products: data,
      //   contact: data,
      // });
    })
    .catch((err) => {
      res.json({
        info: "Error",
        message: err.message,
      });
    });
});

//insert
router.post("/", function (req, res, next) {
  var contact = {
    name: req.body.name,
    email: req.body.email,
    gender: req.body.gender,
    type: req.body.type,
    id_company: req.body.id_company
  };
  Contact.create(contact)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.json({
        info: "Error",
        message: err.message,
      });
    });
});


//contact
router.get("/:id", function (req, res, next) {
  var id = parseInt(req.params.id);
  Contact.findByPk(id)
    .then((data) => {
      if (data) {
        res.send(data);
        // res.render("productdetail", {
        //   title: "Detail Produk",
        //   product: data,
        // });
      } else {
        res.status(404).send({
          msg: "Data not found",
        });
      }
    })
    .catch((err) => {
      res.json({
        info: "Error",
        message: err.message,
      });
    });
});


// company param
router.get("/company/:id_company", function (req, res, next) {
  // var company_id = parseInt(req.params.company_id);
  var id_company = req.params.id_company;
  var data1 = Company.findByPk(id_company)
    .then((data1) => {
      if (data1) {
        res.send(data1);
        // res.render("productdetail", {
        //   title: "Detail Produk",
        //   product: data,
        // });
      } else {
        res.status(404).send({
          msg: "Data not found",
        });
      }
    })
    .catch((err) => {
      res.json({
        info: "Error",
        message: err.message,
      });
    });
});


/*
// company string
router.get("/company/:id/:company_id", function (req, res, next) {
  // var company_id = parseInt(req.params.company_id);
  var company_id = req.query.company_id;
  Contact.findByPk(company_id)
    .then((data) => {
      if (data) {
        res.send(data);
        // res.render("productdetail", {
        //   title: "Detail Produk",
        //   product: data,
        // });
      } else {
        res.status(404).send({
          msg: "Data not found",
        });
      }
    })
    .catch((err) => {
      res.json({
        info: "Error",
        message: err.message,
      });
    });
});

*/

//update
router.put("/update/:id", function (req, res, next) {
  const id = req.params.id;
  Contact.update(req.body, {
    where: { id: id },
  })
    .then((num) => {
      if (num > 0) {
        res.send({
          msg: "data diperbarui",
        });
      } else {
        res.status(404).send({
          msg: "Update failed",
        });
      }
    })
    .catch((err) => {
      res.json({
        info: "Error",
        message: err.message,
      });
    });
});


//delete
router.delete("/delete/:id", function (req, res, next) {
  const id = req.params.id;
  Contact.destroy({
    where: { id: id },
  })
    .then((num) => {
      if (num > 0) {
        res.send({
          msg: "Contact dihapus",
        });
      } else {
        res.status(404).send({
          msg: "Delete failed",
        });
      }
    })
    .catch((err) => {
      res.json({
        info: "Error",
        message: err.message,
      });
    });
});


module.exports = router;
