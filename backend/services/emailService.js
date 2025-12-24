const nodemailer = require('nodemailer');

const createTransporter = () => {
  // Configuration pour le test (console) si les variables d'env ne sont pas définies
  if (!process.env.EMAIL_HOST) {
    console.log('⚠️ Configuration email manquante. Les emails seront simulés dans la console.');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

const sendEmail = async (to, subject, html) => {
  const transporter = createTransporter();

  // Simulation si pas de transporteur
  if (!transporter) {
    console.log('📧 --- SIMULATION EMAIL ---');
    console.log('À:', to);
    console.log('Sujet:', subject);
    console.log('Contenu:', html);
    console.log('-------------------------');
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Delta Fashion'}" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html
    });
    console.log('Message sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

const sendAdminInvitation = async (email, firstName, senderName, link) => {
  const subject = "Invitation à devenir Administrateur - Delta Fashion";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #333;">Delta Fashion</h2>
      </div>
      
      <p>Bonjour${firstName ? ' ' + firstName : ''},</p>
      
      <p>Vous avez été invité(e) par <strong>${senderName}</strong> à rejoindre l'équipe d'administration de Delta Fashion.</p>
      
      <p>En tant qu'administrateur, vous aurez accès au tableau de bord complet, à la gestion des produits, des commandes et des clients.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${link}" style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Accepter l'invitation</a>
      </div>
      
      <p style="font-size: 12px; color: #666;">Si le bouton ne fonctionne pas, copiez ce lien : ${link}</p>
      
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      
      <p style="font-size: 12px; color: #999; text-align: center;">Ceci est un email automatique, merci de ne pas y répondre.</p>
    </div>
  `;

  return sendEmail(email, subject, html);
};

const sendApprovalNotification = async (email, firstName, dashboardLink) => {
  const subject = "Demande d'administration approuvée !";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #333;">Delta Fashion</h2>
      </div>
      
      <h3 style="color: #059669; text-align: center;">Félicitations ! 🎉</h3>
      
      <p>Bonjour ${firstName},</p>
      
      <p>Votre demande pour devenir administrateur a été <strong>approuvée</strong>.</p>
      
      <p>Vous pouvez dès maintenant accéder à votre espace d'administration et commencer à gérer la boutique.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${dashboardLink}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Accéder au Dashboard</a>
      </div>
      
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      
      <p style="font-size: 12px; color: #999; text-align: center;">Bienvenue dans l'équipe !</p>
    </div>
  `;

  return sendEmail(email, subject, html);
};

module.exports = {
  sendAdminInvitation,
  sendApprovalNotification
};
