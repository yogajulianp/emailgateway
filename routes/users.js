const { Console } = require('console');
var express = require('express');
var router = express.Router();
var base64 = require('file-base64');
const fs = require('fs');
const request = require('request');
const db = require('../models');
const Contact = db.contact;
const Mailbox = db.mailbox;

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
}).array('uploadedFiles', 5)

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
    let attachmentsArrays = arrayAttach()

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
    let attachmentsArraysTo = arrayAttachTo()

    function arrayAttachTo() {
      let localArray = this.simpleArrayNew;
      this.simpleArrayNew2.forEach(async (element, index) => {
        let arraySave = []
        arraySave.push(element)

        const result = await Contact.findOne({
          where: {
            email: element.emailAddress.address
          }
        });
        global.result = result;

        let gender = "Mr/Mrs";
        if (global.result.gender == "male") {
          gender = "Mr"
        } else if (global.result.gender == "female") {
          gender = "Mrs"
        };

        let dataArray = {
          subject: objDataDetail.subject,
          body: {
            contentType: "HTML",
            content: `
              <p> Hello ${gender}, ${global.result.name} </p>
              <p>${objDataDetail.body}</p>

              <p>from Rapidtech with ❤️</p>
              `
          },
          toRecipients: arraySave,
          ccRecipients: objDataDetail.cc,
          attachments: attachmentsArrays
        }

        localArray.push(dataArray)

        if (index == objDataDetail.to.length - 1) {
          let message = localArray
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
              console.log("Succes Send Email", response.statusCode);
            });

            if (index == localArray.length - 1) {
              var dataAttachment = dataFiles.map(item => item.filename).join(',');
              var dataBody = JSON.stringify(objDataDetail.body)
              var dataSubject = objDataDetail.subject

              var arrayKosong = [];
              localArray.forEach((element, index) => {
                var dataToRecipients = element.toRecipients.map(item => item.emailAddress).reduce((obj, item) => {
                  return Object.assign(obj, item);
                }, {});
                arrayKosong.push(dataToRecipients)
              });
              var dataToRecipientsDb = arrayKosong.map(item => item.address).join(',');

              var arrayNewKosong = localArray[0].ccRecipients
              arrayNewKosong.forEach((element, index) => {
                var dataCCRecipients = element.emailAddress
                arrayNewKosong.push(dataCCRecipients)
              });
              var dataCCRecipientsDb = arrayNewKosong.map(item => item.address).filter(function (element) {
                return element !== undefined;
              });
              dataCCRecipientsDb = dataCCRecipientsDb.join(',');

              var payload = {
                subject: dataSubject,
                attachment: dataAttachment
              }
              Mailbox.create(payload)
                .then(data => {
                  console.log("Berhasil Ditambahkan")
                })
                .catch(err => {
                  console.log(err)
                });
            }
          });
        }
      });
      return localArray;
    }

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

router.post('/send/schedule', (req, res) => {
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
    let attachmentsArrays = arrayAttach()

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
    let attachmentsArraysTo = arrayAttachTo()

    function arrayAttachTo() {
      let localArray = this.simpleArrayNew;
      this.simpleArrayNew2.forEach(async (element, index) => {
        let arraySave = []
        arraySave.push(element)

        const result = await Contact.findOne({
          where: {
            email: element.emailAddress.address
          }
        });
        global.result = result;

        let gender = "Mr/Mrs";
        if (global.result.gender == "male") {
          gender = "Mr"
        } else if (global.result.gender == "female") {
          gender = "Mrs"
        };
        //{ id: "SystemTime 0x3FEF", value: objDataDetail.schedule };
        let objectSaveNew = {};
        objectSaveNew.id = "SystemTime 0x3FEF";
        objectSaveNew.value = objDataDetail.schedule;
        let arraySaveNew = [];
        arraySaveNew.push(objectSaveNew)

        let dataArray = {
          subject: objDataDetail.subject,
          body: {
            contentType: "HTML",
            content: `
              <p> Hello ${gender}, ${global.result.name} </p>
              <p>${objDataDetail.body}</p>

              <p>from Rapidtech with ❤️</p>
              `
          },
          toRecipients: arraySave,
          ccRecipients: objDataDetail.cc,
          singleValueExtendedProperties: arraySaveNew,
          attachments: attachmentsArrays
        }

        console.log("------------------------------------------------------------------------------------------------");
        console.log("dataArray: ", dataArray);
        console.log("------------------------------------------------------------------------------------------------");    


        localArray.push(dataArray)

        if (index == objDataDetail.to.length - 1) {
          let message = localArray
          message.forEach((element, index) => {
            const message = createEmailAsJsonSchedule(element);
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
              console.log("Succes Send Email", response.statusCode);
            });

            if (index == localArray.length - 1) {
              var dataAttachment = dataFiles.map(item => item.filename).join(',');
              var dataBody = JSON.stringify(objDataDetail.body)
              var dataSubject = objDataDetail.subject

              var arrayKosong = [];
              localArray.forEach((element, index) => {
                var dataToRecipients = element.toRecipients.map(item => item.emailAddress).reduce((obj, item) => {
                  return Object.assign(obj, item);
                }, {});
                arrayKosong.push(dataToRecipients)
              });
              var dataToRecipientsDb = arrayKosong.map(item => item.address).join(',');

              var arrayNewKosong = localArray[0].ccRecipients
              arrayNewKosong.forEach((element, index) => {
                var dataCCRecipients = element.emailAddress
                arrayNewKosong.push(dataCCRecipients)
              });
              var dataCCRecipientsDb = arrayNewKosong.map(item => item.address).filter(function (element) {
                return element !== undefined;
              });
              dataCCRecipientsDb = dataCCRecipientsDb.join(',');

              var payload = {
                subject: dataSubject,
                attachment: dataAttachment
              }
              Mailbox.create(payload)
                .then(data => {
                  console.log("Berhasil Ditambahkan")
                })
                .catch(err => {
                  console.log(err)
                });
            }
          });
        }
      });
      return localArray;
    }

    res.json({
      info: "Berhasil Dikirim"
    })

  })
});

const createEmailAsJsonSchedule = (messageSend) => {
  let messageAsJson = {
    message: messageSend,
    saveToSentItems: "true"
  };

  return messageAsJson;
};

/*
function fn60sec() {
  // const currentDate = new Date();

  // const utcYear = currentDate.getUTCFullYear();
  // const utcMonth = currentDate.getUTCMonth();
  // const utcDay = currentDate.getUTCDate();
  // const utcHours = currentDate.getUTCHours();
  // const utcMinutes = currentDate.getUTCMinutes();
  // const utcSeconds = currentDate.getUTCSeconds();

  // console.log(`UTC date and time: ${utcYear}-${utcMonth + 1}-${utcDay} ${utcHours}:${utcMinutes}:${utcSeconds}`);

  console.log("Haloo");
  const endDate = new Date("2023-01-09T05:35:00Z");

  const countdown = setInterval(() => {
    const currentDate = new Date();

    // Calculate the time remaining in seconds
    const timeRemaining = Math.round((endDate - currentDate) / 1000);

    // Calculate the number of days, hours, minutes, and seconds remaining
    const days = Math.floor(timeRemaining / (24 * 60 * 60));
    const hours = Math.floor((timeRemaining % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((timeRemaining % (60 * 60)) / 60);
    const seconds = timeRemaining % 60;

    console.log(`${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds remaining`);

    // Clear the interval if the countdown has reached 0
    if (timeRemaining <= 0) {
      clearInterval(countdown);
    }
  }, 1000);


}
fn60sec();
setInterval(fn60sec, 60 * 1000);
*/

module.exports = router;
