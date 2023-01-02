const { Sequelize, DataTypes } = require("sequelize");

//sql server
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    dialect: "mssql",
    dialectOptions: {
      // Observe the need for this nested `options` field for MSSQL
      options: {
        // Your tedious options here
        useUTC: false,
        dateFirst: 1,
      },
    },
  }
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.company = require("./company")(sequelize, Sequelize);
db.contact = require("./contact")(sequelize, Sequelize);
db.mailbox = require("./mailbox")(sequelize, Sequelize);

db.company.hasMany(db.contact, {foreignKey: 'id_company'})
db.contact.belongsTo(db.company, {foreignKey: 'id_company'})

module.exports = db;
