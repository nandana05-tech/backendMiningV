const fs = require('fs');
const path = require('path');
const mjml = require('mjml');
const nodemailer = require('nodemailer');

function renderMJML(templateName, variables = {}) {
  const filePath = path.join(__dirname, '..', 'templates', 'emails', `${templateName}.mjml`);
  let content = fs.readFileSync(filePath, 'utf8');

  Object.keys(variables).forEach(key => {
    content = content.replace(new RegExp(`{{${key}}}`, 'g'), variables[key]);
  });

  return mjml(content).html;
}

async function sendEmail({ to, subject, template, variables }) {
  const html = renderMJML(template, variables);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MY_EMAIL,
      pass: process.env.MY_PASSWORD,
    },
  });

  return transporter.sendMail({
    from: process.env.MY_EMAIL,
    to,
    subject,
    html,
  });
}

module.exports = { sendEmail };
