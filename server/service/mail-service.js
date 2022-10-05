require("dotenv").config();
const nodemailer = require("nodemailer");
class MailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      tls: {
        rejectUnauthorized: false,
      },
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }
  async sendActivationMail(mail, link) {
    await this.transporter.sendMail({
      from: `From ${process.env.SMTP_USER}`,
      to: mail,
      subject: "Активация аккаунта на" + process.env.API_URL,
      text: "Диско Че Там Баурим Калайсан",
      html: `
          <div>
          <h1>Че там Баурым барсанба елки палки</h1>
          <h2>ЕРТЕН ПАРАНГДИ УХЛАП КАЛМА</h2>
          <a href="${link}">${link}</a>
          </div>
          `,
    });
  }
}

module.exports = new MailService();
