var express = require('express');
var router = express.Router();

const readXlsxFile = require('read-excel-file/node');
const multer = require('multer')

const db = require('../models');
const Company = db.company;
const Contact = db.contact;

var createCompanyPromise = async function (req, res, next) {
    return new Promise(function (resolve, reject) {
        req.body.company.forEach((company, index) => {
            //Check if company is already
            Company.findOne({ where: { name: company.name } })
                .then(data => {
                    if (data) {
                        console.log("Company Sudah Terdaftar: " + company.name)
                    } else {
                        var companyS = {
                            name: company.name,
                            address: company.address
                        }
                        //Insert company
                        Company.create(companyS).then(data => {
                            resolve("Success Company Created !!!");
                        })
                    }

                    resolve("Success Company Created");
                })
                .catch(err => {
                    console.log(err)
                    reject("Failed Company Creation");
                });
        });
    });
};

var createContactPromise = async function (req, res, next) {
    return new Promise(function (resolve, reject) {
        req.body.contact.forEach((contact, index) => {
            //Check company for search id company
            Company.findOne({ where: { name: contact.companyName } })
                .then(data => {
                    //Check if email is already
                    Contact.findOne({ where: { email: contact.email } })
                        .then(dataContact => {
                            if (dataContact) {
                                console.log("Email Sudah Terdaftar: " + contact.email)
                            } else {
                                var contactS = {
                                    id_company: data.id,
                                    name: contact.name,
                                    gender: contact.gender,
                                    email: contact.email,
                                    type: contact.type
                                }
                                //Insert the contact
                                Contact.create(contactS)
                                resolve("Success Contact Created");
                            }
                        })
                        .catch(err => {
                            console.log(err)
                            reject("Failed Contact creation");
                        });
                })
                .catch(err => {
                    console.log(err)
                });
        });
    });
};


/* GET home page. */
router.post('/uploadfile', async function (req, res, next) {
    createCompanyPromise(req, res, next).then((company) => {
        console.log(company);
        return createContactPromise(req, res, next)
    }).then((responContact) => {
        console.log(responContact);
    }).catch((err) => {
        console.log(err)
    })

    res.json({
        company: req.body.company,
        contact: req.body.contact
    })

});

// Multer Upload Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "." + '/public/excel')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "-" + Date.now() + "-" + file.originalname)
    }
});
const upload = multer({ storage: storage });
//! Routes start
//route for Home page
/* GET home page. */
router.get("/homeimport", function (req, res, next) {
    res.render("import", { title: "Import" });
});

router.post('/import', upload.single("uploadfile"), function (req, res, next) {
    var string = ("." + '/public/excel/' + req.file.filename);
    importExcelCompany(string);
    importExcelContact(string);

    // importExcelCompany(string).then((company) => {
    //     console.log(company);
    //     return importExcelContact(string)
    // }).then((responContact) => {
    //     console.log(responContact);
    // }).catch((err) => {
    //     console.log(err)
    // })

    // var string = ("." + '/public/excel/' + req.file.filename);
    // res.redirect("import/done?valid="+ string);
});

router.get('/import/done', upload.single("uploadfile"), function (req, res, next) {
    //var passedVariable = req.query.valid;

    var string = ("." + '/public/excel/' + req.file.filename);
    importExcelContact(string);
    res.redirect("/");
    // res.json({
    //     info: "Import completed"
    // })
});

var importExcelCompany = async function (filePath) {
    return new Promise(function (resolve, reject) {
        readXlsxFile(filePath).then((rows) => {
            console.log(rows);
            rows.shift();
            for (let index = 0; index < rows.length; ++index) {
                const element = rows[index];
                Company.findOne({ where: { name: element[5] } })
                    .then(data => {
                        if (data) {
                            console.log("Company Sudah Terdaftar: " + data.name)
                        } else {
                            var payload = {
                                name: element[5],
                                address: element[6]
                            }
                            //Insert the contact
                            Company.create(payload)
                                .then(data => {
                                    console.log("Berhasil Didaftarkan")
                                    resolve("Company Save")
                                })
                                .catch(err => {
                                    console.log(err)
                                    reject("Company Failed to Save")
                                });
                        }
                    })
                    .catch(err => {
                        console.log(err)
                    });
            }
        })
    });
}

var importExcelContact = async function (filePath) {
    return new Promise(function (resolve, reject) {
        readXlsxFile(filePath).then((rows) => {
            console.log(rows);
            rows.shift();
            for (let index = 0; index < rows.length; ++index) {
                const element = rows[index];
                Company.findOne({ where: { name: element[5] } })
                    .then(data => {
                        //Check if email is already
                        Contact.findOne({ where: { email: element[3] } })
                            .then(dataContact => {
                                if (dataContact) {
                                    console.log("Email Sudah Terdaftar: " + dataContact.email)
                                } else {
                                    var payload = {
                                        id_company: data.id,
                                        name: element[1],
                                        gender: element[2],
                                        email: element[3],
                                        type: element[4]
                                    }
                                    //Insert the contact
                                    Contact.create(payload)
                                        .then(data => {
                                            console.log("Berhasil Didaftarkan")
                                            resolve("Contact Save")
                                        })
                                        .catch(err => {
                                            console.log(err)
                                            reject("Contact Failed to Save")
                                        });
                                }
                            })
                            .catch(err => {
                                console.log(err)
                            });
                    })
                    .catch(err => {
                        console.log(err)
                    });
            }
        })
    });
}

module.exports = router;

/* Contoh Kalau Pakai JSON

http://localhost:3000/contact/uploadfile
{
    "company": [
        {
            "name": "Company A",
            "address": "Aceh"
        },
        {
            "name": "Company B",
            "address": "Bogor"
        },
        {
            "name": "Company C",
            "address": "Cikampek"
        },
        {
            "name": "Company D",
            "address": "DIY"
        }
    ],
    "contact": [
        {
            "companyName": "Company A",
            "name": "A addyani",
            "gender": "default",
            "email": "Aemployee@company.com",
            "type": "recipient"
        },
                {
            "companyName": "Company B",
            "name": "B addyani",
            "gender": "default",
            "email": "Bemployee@company.com",
            "type": "recipient"
        },
                {
            "companyName": "Company C",
            "name": "C addyani",
            "gender": "default",
            "email": "Cemployee@company.com",
            "type": "recipient"
        },
                {
            "companyName": "Company D",
            "name": "D addyani",
            "gender": "default",
            "email": "Demployee@company.com",
            "type": "recipient"
        },
                {
            "companyName": "Company A",
            "name": "AA addyani",
            "gender": "male",
            "email": "AAemployee@company.com",
            "type": "cc"
        },
                {
            "companyName": "Company B",
            "name": "BB addyani",
            "gender": "male",
            "email": "BBemployee@company.com",
            "type": "cc"
        },
                {
            "companyName": "Company C",
            "name": "CC addyani",
            "gender": "female",
            "email": "CCemployee@company.com",
            "type": "cc"
        },
                {
            "companyName": "Company D",
            "name": "DD addyani",
            "gender": "female",
            "email": "DDemployee@company.com",
            "type": "cc"
        }
    ]
}
*/