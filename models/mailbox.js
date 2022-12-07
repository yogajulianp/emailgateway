module.exports = (sequelize, Sequelize) => {
  const Mailbox = sequelize.define("mailbox", {
    subject: {
      type: Sequelize.STRING,
    },
    attachment: {
      type: Sequelize.STRING,
    },
  });

  return Mailbox;
};
