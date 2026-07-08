const dotenv = require('dotenv');

dotenv.config();

module.exports = {
    DATABASE_URL,
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    ADMIN_PHONE_NUMBER,
    TWILIO_PHONE_NUMBER,
	JWT_SECRET_KEY,
    BASE_URL,
    SERVER_PORT,
} = process.env;