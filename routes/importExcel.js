var express = require('express');
var router = express.Router();

const readXlsxFile = require('read-excel-file/node');
const multer = require('multer')

const db = require('../models');
const Company = db.company;
const Contact = db.contact;

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

//POST domain/contact/import => filename path must be "uploadfileExcel"
router.post('/import', upload.single("uploadfileExcel"), function (req, res, next) {
    var string = ("." + '/public/excel/' + req.file.filename);

    importExcelCompany(string).then((company) => {
        console.log(company);
        return importExcelContact(string)
    }).then((responContact) => {
        console.log(responContact);
    }).catch((err) => {
        console.log(err)
    })

    res.json({
        info: "Import Done",
        respone: "Back to dashboard"
    })
});

function arrayToJSONObject(arr) {
    //header
    arrShift = arr.shift();
    // console.log("Sebelum Shift=> ", arr);
    // console.log("Setelah Shift=> ", arrShift);

    var keys = arrShift;
    // console.log("Head Table keys=> ", keys);

    //vacate keys from main array
    var newArr = arr.slice(0, arr.length);

    var formatted = [],
        data = newArr,
        cols = keys,
        l = cols.length;
    for (var i = 0; i < data.length; i++) {
        var d = data[i],
            o = {};
        for (var j = 0; j < l; j++)
            o[cols[j]] = d[j];
        formatted.push(o);
    }
    return formatted;
}

function uniqueObject(object, keyObject) {
    const key = keyObject;
    const unique = [...new Map(object.map(item =>
        [item[key], item])).values()];

    return unique;
}

var importExcelCompany = async function (filePath) {
    return new Promise(function (resolve, reject) {
        readXlsxFile(filePath).then((rows) => {
            let rowsObject = arrayToJSONObject(rows)
            // console.log("Data Filter Finish=> ", rowsObject);
            let unique = uniqueObject(rowsObject, 'company')
            console.log("Data Uniq=> ", unique);

            unique.forEach((element, index) => {
                Company.findOne({ where: { name: element.company } })
                    .then(data => {
                        if (data) {
                            console.log("Company Sudah Terdaftar: " + data.company)
                        } else {
                            var payload = {
                                name: element.company,
                                address: element.address
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
                        reject("Server Error")
                    });
            })
        })
    });
}

var importExcelContact = async function (filePath) {
    return new Promise(function (resolve, reject) {
        readXlsxFile(filePath).then((rows) => {
            let rowsObject = arrayToJSONObject(rows)
            // console.log("Data Filter Finish=> ", rowsObject);
            let unique = uniqueObject(rowsObject, 'email')
            console.log("Data Uniq=> ", unique);

            unique.forEach((element, index) => {
                Company.findOne({ where: { name: element.company } })
                    .then(data => {
                        //Check if email is already
                        Contact.findOne({ where: { email: element.email } })
                            .then(dataContact => {
                                if (dataContact) {
                                    console.log("Email Sudah Terdaftar: " + dataContact.email)
                                } else {
                                    var payload = {
                                        id_company: data.id,
                                        name: element.name,
                                        gender: element.gender,
                                        email: element.email,
                                        type: element.type
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
            })
        })
    });
}

module.exports = router;

/*
router.get("/contact", function (req, res, next) {
    Contact.findAll()
    .then(data => {
        res.json({
            data: data
        })
	})
	.catch(err => {
        res.json({
            info: err
        })
	});
});

router.get("/contact/company/:id", function (req, res, next) {
    var id = parseInt(req.params.id);
    Contact.findAll({ where: { id_company: id } })
    .then(data => {
        res.json({
            data: data
        })
	})
	.catch(err => {
        res.json({
            info: err
        })
	});
});

router.get("/contact/:id", function (req, res, next) {
    var id = parseInt(req.params.id);
    Contact.findByPk(id)
    .then(data => {
        res.json({
            data: data
        })
	})
	.catch(err => {
        res.json({
            info: err
        })
	});
});

router.post("/contact", function (req, res, next) {
    var contact = {
		name: req.body.name,
        email: req.body.email,
        gender: req.body.gender,
        type: req.body.type,
        id_company: req.body.company_id
	}
	Contact.create(contact)
    .then(data => {
        res.json({
            data: data
        })
	})
	.catch(err => {
        res.json({
            info: err
        })
	});
});

router.get("/contact/update/:id", function (req, res, next) {
    var id = parseInt(req.params.id);
    Contact.findByPk(id)
    .then(data => {
        res.json({
            data: data,
            info: "Redirect To Halaman Updates"
        })
	})
	.catch(err => {
        res.json({
            info: err
        })
	});
});

router.post("/contact/update/:id", function (req, res, next) {
    const id = req.params.id;
    var contact = {
		name: req.body.name,
        email: req.body.email,
        gender: req.body.gender,
        type: req.body.type,
        id_company: req.body.company_id
	}
	Contact.update(contact, {
		where: {id: id}
	})
    .then(data => {
        res.json({
            info: "berhasil di update",
            data: contact
        })
	})
	.catch(err => {
        res.json({
            info: err
        })
	});
});

router.get("/contact/delete/:id", function (req, res, next) {
    const id = req.params.id;
	Contact.destroy({
		where: {id: id}
	})
    .then(data => {
        res.json({
            info: "berhasil di delete"
        })
	})
	.catch(err => {
        res.json({
            info: err
        })
	});
});
*/

/*
router.get("/company", function (req, res, next) {
    Company.findAll()
    .then(data => {
        res.json({
            data: data
        })
	})
	.catch(err => {
        res.json({
            info: err
        })
	});
});

router.get("/company/:id", function (req, res, next) {
    var id = parseInt(req.params.id);
    Company.findByPk(id)
    .then(data => {
        res.json({
            data: data
        })
	})
	.catch(err => {
        res.json({
            info: err
        })
	});
});

router.post("/company", function (req, res, next) {
    var company = {
		name: req.body.name,
        address: req.body.address
	}
	Company.create(company)
    .then(data => {
        res.json({
            data: data
        })
	})
	.catch(err => {
        res.json({
            info: err
        })
	});
});

router.get("/company/update/:id", function (req, res, next) {
    var id = parseInt(req.params.id);
    Company.findByPk(id)
    .then(data => {
        res.json({
            data: data,
            info: "Redirect To Halaman Updates"
        })
	})
	.catch(err => {
        res.json({
            info: err
        })
	});
});

router.post("/company/update/:id", function (req, res, next) {
    const id = req.params.id;
    var company = {
		name: req.body.name,
        address: req.body.address
	}
	Company.update(company, {
		where: {id: id}
	})
    .then(data => {
        res.json({
            info: "berhasil di update",
            data: company
        })
	})
	.catch(err => {
        res.json({
            info: err
        })
	});
});

router.get("/company/delete/:id", function (req, res, next) {
    const id = req.params.id;
	Company.destroy({
		where: {id: id}
	})
    .then(data => {
        res.json({
            info: "berhasil di delete"
        })
	})
	.catch(err => {
        res.json({
            info: err
        })
	});
});
*/

/*
//Untuk Menampilkan Website Import Excel
router.get("/homeimport", function (req, res, next) {
    res.render("import", { title: "Import" });
});


//Untuk Simpan dua kali sebelum nya pakai ini
router.post('/import/done', upload.single("uploadfile"), function (req, res, next) {
    //var passedVariable = req.query.valid;

    var string = ("." + '/public/excel/' + req.file.filename);
    importExcelContact(string);
    //res.redirect("/");
    res.json({
        info: "Import completed"
    })

});
*/

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

//API JIKA MENGGUNAKAN JSON
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

*/