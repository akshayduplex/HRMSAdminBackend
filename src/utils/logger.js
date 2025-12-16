const fs = require('fs');
const path = require('path');

const logDirectory = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory);
}

const logFile = path.join(logDirectory, `app-${new Date().toISOString().slice(0,10)}.log`);

const log = (type, message) => {
    const timestamp = new Date().toISOString();
    const logMsg = `[${timestamp}] [${type}] ${message}\n`;
    fs.appendFile(logFile, logMsg, err => {
        if (err) console.error('Logging error:', err);
    });
};

module.exports = {
    info: (msg) => log('INFO', msg),
    error: (msg) => log('ERROR', msg),
    warn: (msg) => log('WARN', msg)
};
