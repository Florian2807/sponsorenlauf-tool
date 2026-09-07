import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { dbGet, dbRun } from './database.js';
import { validateEmail } from './validation.js';

const getEncryptionKey = () => {
    const secret = process.env.SPONSORENLAUF_SECRET_KEY;
    if (!secret && process.env.NODE_ENV === 'production') {
        throw new Error('SPONSORENLAUF_SECRET_KEY ist für die SMTP-Konfiguration erforderlich.');
    }
    return crypto.createHash('sha256').update(secret || 'sponsorenlauf-development-only-key').digest();
};

const encryptPassword = (password) => {
    if (!password) return null;
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(password, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return ['v1', iv.toString('base64url'), tag.toString('base64url'), encrypted.toString('base64url')].join(':');
};

const decryptPassword = (value) => {
    if (!value) return '';
    const [version, ivValue, tagValue, encryptedValue] = value.split(':');
    if (version !== 'v1' || !ivValue || !tagValue || !encryptedValue) {
        throw new Error('Gespeichertes SMTP-Passwort hat ein unbekanntes Format.');
    }
    const decipher = crypto.createDecipheriv('aes-256-gcm', getEncryptionKey(), Buffer.from(ivValue, 'base64url'));
    decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
    return Buffer.concat([
        decipher.update(Buffer.from(encryptedValue, 'base64url')),
        decipher.final(),
    ]).toString('utf8');
};

export const validateSmtpConfiguration = (configuration, { passwordRequired = false } = {}) => {
    const errors = [];
    const host = String(configuration?.host || '').trim();
    const port = Number(configuration?.port);
    const security = configuration?.security;
    const fromAddress = String(configuration?.fromAddress || '').trim();
    const fromName = String(configuration?.fromName || '').trim();

    if (!host || host.length > 255 || !/^[a-zA-Z0-9.-]+$/.test(host)) errors.push('Ungültiger SMTP-Server');
    if (!Number.isInteger(port) || port < 1 || port > 65535) errors.push('Ungültiger SMTP-Port');
    if (!['tls', 'starttls', 'none'].includes(security)) errors.push('Ungültige SMTP-Verschlüsselung');
    if (!validateEmail(fromAddress)) errors.push('Ungültige Absenderadresse');
    if (!fromName || fromName.length > 100) errors.push('Ungültiger Absendername');
    if (passwordRequired && !configuration?.password) errors.push('SMTP-Passwort fehlt');
    if (configuration?.username && String(configuration.username).length > 255) errors.push('SMTP-Benutzername ist zu lang');
    return errors;
};

export const getSmtpConfiguration = async ({ includePassword = false } = {}) => {
    const row = await dbGet('SELECT * FROM smtp_configuration WHERE id = 1');
    if (!row) return null;
    const configuration = {
        host: row.host,
        port: row.port,
        security: row.security,
        username: row.username || '',
        fromAddress: row.from_address,
        fromName: row.from_name,
        passwordConfigured: Boolean(row.password_encrypted),
        updatedAt: row.updated_at,
    };
    if (includePassword) configuration.password = decryptPassword(row.password_encrypted);
    return configuration;
};

export const saveSmtpConfiguration = async (configuration) => {
    const current = await dbGet('SELECT password_encrypted FROM smtp_configuration WHERE id = 1');
    const errors = validateSmtpConfiguration(configuration, {
        passwordRequired: Boolean(configuration?.username) && !current?.password_encrypted,
    });
    if (errors.length) {
        const error = new Error(errors.join(', '));
        error.validationErrors = errors;
        throw error;
    }

    const encryptedPassword = configuration.password
        ? encryptPassword(String(configuration.password))
        : current?.password_encrypted;
    await dbRun(
        `INSERT INTO smtp_configuration
            (id, host, port, security, username, password_encrypted, from_address, from_name)
         VALUES (1, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET host = excluded.host, port = excluded.port,
            security = excluded.security, username = excluded.username,
            password_encrypted = excluded.password_encrypted,
            from_address = excluded.from_address, from_name = excluded.from_name,
            updated_at = CURRENT_TIMESTAMP`,
        [
            String(configuration.host).trim(),
            Number(configuration.port),
            configuration.security,
            String(configuration.username || '').trim(),
            encryptedPassword,
            String(configuration.fromAddress).trim(),
            String(configuration.fromName).trim(),
        ]
    );
    return getSmtpConfiguration();
};

export const createSmtpTransport = (configuration) => {
    const auth = configuration.username
        ? { user: configuration.username, pass: configuration.password || '' }
        : undefined;
    return nodemailer.createTransport({
        host: configuration.host,
        port: Number(configuration.port),
        secure: configuration.security === 'tls',
        requireTLS: configuration.security === 'starttls',
        ignoreTLS: configuration.security === 'none',
        auth,
        tls: {
            rejectUnauthorized: true,
            servername: configuration.host,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 30000,
    });
};

export const testSmtpConfiguration = async (configuration) => {
    const stored = await getSmtpConfiguration({ includePassword: true });
    const merged = {
        ...stored,
        ...configuration,
        password: configuration?.password || stored?.password || '',
    };
    const errors = validateSmtpConfiguration(merged, { passwordRequired: Boolean(merged.username) });
    if (errors.length) throw new Error(errors.join(', '));
    const transporter = createSmtpTransport(merged);
    await transporter.verify();
    transporter.close();
    return true;
};

export const getConfiguredSmtpTransport = async () => {
    const configuration = await getSmtpConfiguration({ includePassword: true });
    if (!configuration) throw new Error('SMTP-Server ist noch nicht konfiguriert.');
    return { configuration, transporter: createSmtpTransport(configuration) };
};
