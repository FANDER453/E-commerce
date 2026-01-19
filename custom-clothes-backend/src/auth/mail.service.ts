import nodemailer from 'nodemailer'
export class MailService{
  async mailSend(email, link){
    let transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.MAIL_SEND,
        pass: process.env.MAIL_PASSWORD
      }
    })
    let mailOptions = {
      from: 'testserverlogin1111@gmail.com',
      to: email,
      html:
        `
          <div>
            <h1>Activation account</h1>
            <a href="${link}">${link}</a>
          </div>>
        `
    };
    transporter.sendMail(mailOptions, (err) => {
      if(err){
        console.error(err)
      }
    })

  }
}