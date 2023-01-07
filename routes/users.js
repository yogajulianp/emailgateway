const { Console } = require('console');
var express = require('express');
var router = express.Router();
var base64 = require('file-base64');
const fs = require('fs');
const request = require('request');
const db = require('../models');
const Contact = db.contact;

require("dotenv").config();

const axios = require("axios");
const qs = require("qs");

const TENANT_ID = process.env.TENANT_ID || "";
const CLIENT_ID = process.env.CLIENT_ID || "";
const CLIENT_SECRET = process.env.CLIENT_SECRET || "";
const AAD_ENDPOINT = process.env.AAD_ENDPOINT || "";
const GRAPH_ENDPOINT = process.env.GRAPH_ENDPOINT || "";
const from = process.env.FROM || "";
const subject = process.env.SUBJECT || "";


/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

const multer = require('multer');
const { path } = require('../app');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "." + '/public/excel')
  },
  filename: function (req, file, cb) {
    //cb(null, file.fieldname + '-' + Date.now() + file.originalname.match(/\..*$/)[0])
    cb(null, Date.now() + '-' + file.originalname)
  }
});

const multi_upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 1MB
  fileFilter: (req, file, cb) => {
    cb(null, true);

    //Validator
    //   if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg " || file.mimetype == "file/xlsx " || file.mimetype == "video/mp4 ") {
    //       cb(null, true);
    //   } else {
    //       cb(null, false);
    //       const err = new Error('Only .png, .jpg and .jpeg format allowed!')
    //       err.name = 'ExtensionError'
    //       return cb(err);
    //   }
  },
}).array('uploadedImages', 5)

router.post('/send', (req, res) => {
  multi_upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      res.status(500).send({
        error: { message: `Multer uploading error: ${err.message}` }
      }).end();
      return;
    } else if (err) {
      // An unknown error occurred when uploading.
      if (err.name == 'ExtensionError') {
        res.status(413).send({ error: { message: err.message } }).end();
      } else {
        res.status(500).send({ error: { message: `unknown uploading error: ${err.message}` } }).end();
      }
      return;
    }

    let dataFiles = req.files
    simpleArray = [];
    simpleArray2 = dataFiles;
    let attachmentsArrays = arrayAttach(dataFiles)

    function arrayAttach() {
      let localArray = this.simpleArray;

      this.simpleArray2.forEach((element, index) => {
        let filePath = element.destination + "/" + element.filename
        let splitFileName = element.filename.split("-")

        const convertBase64 = (path) => {
          // read binary data from file
          const bitmap = fs.readFileSync(path);
          // convert the binary data to base64 encoded string
          return bitmap.toString('base64');
        };

        const result = convertBase64(filePath);
        let dataArray = {
          "@odata.type": "#microsoft.graph.fileAttachment",
          "name": splitFileName[1],
          "contentBytes": result
        };

        localArray.push(dataArray)
      });
      return localArray;
    }

    let dataDetail = req.body.data
    const objDataDetail = JSON.parse(dataDetail);

    simpleArrayNew = [];
    simpleArrayNew2 = objDataDetail.to;
    let attachmentsArraysTo = arrayAttachTo(simpleArrayNew2)
    // console.log("----------------------------------------------------------------")
    // console.log("attachmentsArraysTo: ",attachmentsArraysTo)
    // console.log("----------------------------------------------------------------")

    function arrayAttachTo() {
      let localArray = this.simpleArrayNew;
      this.simpleArrayNew2.forEach((element, index) => {
        let arraySave = []
        arraySave.push(element)

        let dataArray = {
          subject: objDataDetail.subject,
          body: {
            contentType: "HTML",
            content: `
              <p> Hello, name </p>
              <p>${objDataDetail.body}</p>

              <p>from Rapidtech with ❤️</p>
              `
          },
          toRecipients: arraySave,
          ccRecipients: objDataDetail.cc,
          attachments: attachmentsArrays
        }

        localArray.push(dataArray)
      });
      return localArray;
    }

    let message = simpleArrayNew
    message.forEach((element, index) => {
      const message = createEmailAsJson(element);
      const options = {
        url: 'https://graph.microsoft.com/v1.0/me/sendMail',
        headers: {
          'Authorization': req.headers.authorization,
          'Content-Type': 'application/json'
        },
        body: message,
        json: true
      };

      request.post(options, (error, response, body) => {
        console.log(response.statusCode);
      });
    });
    res.json({
      info: "Berhasil Dikirim"
    })

  })
});

const createEmailAsJson = (messageSend) => {
  let messageAsJson = {
    message: messageSend,
    saveToSentItems: "false"
  };

  return messageAsJson;
};

// async function findContact(elementEmail) {

//   let name = await Contact.findOne({ where: { email: elementEmail} })
//   .then(data => {
//     return data.name;
//   })
//   .catch(err => {
//     console.log(err)
//   })

//   // wait 3 seconds
//   await new Promise((resolve, reject) => setTimeout(resolve, 3000));

//   return name;
// }

module.exports = router;
