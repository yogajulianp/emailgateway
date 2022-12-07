module.exports = (sequelize, Sequelize) => {
  const Contact = sequelize.define("contact", {
    nama: {
      type: Sequelize.STRING,
    },
    email: {
      type: Sequelize.STRING,
    },
    gender: {
      type: Sequelize.ENUM,
      values: ["male", "female"],
    },
    type: {
      type: Sequelize.ENUM,
      values: ["cc", "recipient"],
    },
  });

  return Contact;
};
