module.exports = (sequelize, Sequelize) => {
  const Contact = sequelize.define("contact", {
    name: {
      type: Sequelize.STRING,
    },
    email: {
      type: Sequelize.STRING,
      unique: true,
    },
    gender: {
      type: Sequelize.ENUM,
      values: ["male", "female", "default"],
    },
    type: {
      type: Sequelize.ENUM,
      values: ["cc", "recipient"],
    },
    id_company: {
			type: Sequelize.INTEGER
		},
  });

  return Contact;
};
