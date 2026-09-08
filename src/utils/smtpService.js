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

const encryptSecret = (password) => {
    if (!password) return null;
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(password, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return ['v1', iv.toString('base64url'), tag.toString('base64url'), encrypted.toString('base64url')].join(':');
};

const decryptSecret = (value) => {
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

const validateGraphConfiguration = (configuration, { secretRequired = false } = {}) => {
    const errors = [];
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(String(configuration?.tenantId || '').trim())) errors.push('Ungültige Microsoft Tenant-ID');
    if (!uuidPattern.test(String(configuration?.clientId || '').trim())) errors.push('Ungültige Microsoft Client-ID');
    if (secretRequired && !configuration?.clientSecret) errors.push('Microsoft Client-Secret fehlt');
    if (!validateEmail(String(configuration?.fromAddress || '').trim())) errors.push('Ungültige Absenderadresse');
    const fromName = String(configuration?.fromName || '').trim();
    if (!fromName || fromName.length > 100) errors.push('Ungültiger Absendername');
    return errors;
};

export const getSmtpConfiguration = async ({ includePassword = false } = {}) => {
    const row = await dbGet('SELECT * FROM smtp_configuration WHERE id = 1');
    if (!row) return null;
    const configuration = {
        provider: row.provider || 'smtp',
        host: row.host,
        port: row.port,
        security: row.security,
        username: row.username || '',
        fromAddress: row.from_address,
        fromName: row.from_name,
        passwordConfigured: Boolean(row.password_encrypted),
        tenantId: row.tenant_id || '',
        clientId: row.client_id || '',
        clientSecretConfigured: Boolean(row.client_secret_encrypted),
        updatedAt: row.updated_at,
    };
    if (includePassword) {
        configuration.password = decryptSecret(row.password_encrypted);
        configuration.clientSecret = decryptSecret(row.client_secret_encrypted);
    }
    return configuration;
};

export const saveSmtpConfiguration = async (configuration) => {
    const current = await dbGet('SELECT provider, password_encrypted, client_secret_encrypted FROM smtp_configuration WHERE id = 1');
    const provider = configuration?.provider === 'microsoft' ? 'microsoft' : 'smtp';
    const errors = provider === 'microsoft'
        ? validateGraphConfiguration(configuration, {
            secretRequired: current?.provider !== 'microsoft' || !current?.client_secret_encrypted,
        })
        : validateSmtpConfiguration(configuration, {
            passwordRequired: Boolean(configuration?.username) && !current?.password_encrypted,
        });
    if (errors.length) {
        const error = new Error(errors.join(', '));
        error.validationErrors = errors;
        throw error;
    }

    const encryptedPassword = provider === 'smtp'
        ? (configuration.password ? encryptSecret(String(configuration.password)) : current?.password_encrypted)
        : null;
    const encryptedClientSecret = provider === 'microsoft'
        ? (configuration.clientSecret ? encryptSecret(String(configuration.clientSecret)) : current?.client_secret_encrypted)
        : null;
    await dbRun(
        `INSERT INTO smtp_configuration
            (id, provider, host, port, security, username, password_encrypted, from_address, from_name,
             tenant_id, client_id, client_secret_encrypted)
         VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET host = excluded.host, port = excluded.port,
            provider = excluded.provider,
            security = excluded.security, username = excluded.username,
            password_encrypted = excluded.password_encrypted,
            from_address = excluded.from_address, from_name = excluded.from_name,
            tenant_id = excluded.tenant_id, client_id = excluded.client_id,
            client_secret_encrypted = excluded.client_secret_encrypted,
            updated_at = CURRENT_TIMESTAMP`,
        [
            provider,
            provider === 'microsoft' ? 'graph.microsoft.com' : String(configuration.host).trim(),
            provider === 'microsoft' ? 443 : Number(configuration.port),
            provider === 'microsoft' ? 'tls' : configuration.security,
            String(configuration.username || '').trim(),
            encryptedPassword,
            String(configuration.fromAddress).trim(),
            String(configuration.fromName).trim(),
            String(configuration.tenantId || '').trim(),
            String(configuration.clientId || '').trim(),
            encryptedClientSecret,
        ]
    );
    return getSmtpConfiguration();
};

const graphTokenCache = new Map();

const acquireGraphToken = async (configuration) => {
    const secretFingerprint = crypto.createHash('sha256').update(configuration.clientSecret || '').digest('hex');
    const cacheKey = `${configuration.tenantId}:${configuration.clientId}:${secretFingerprint}`;
    const cached = graphTokenCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now() + 60_000) return cached.accessToken;

    const tokenResponse = await fetch(
        `https://login.microsoftonline.com/${encodeURIComponent(configuration.tenantId)}/oauth2/v2.0/token`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: configuration.clientId,
                client_secret: configuration.clientSecret,
                scope: 'https://graph.microsoft.com/.default',
                grant_type: 'client_credentials',
            }),
            signal: AbortSignal.timeout(15000),
        }
    );
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
        throw new Error(tokenData.error_description || 'Microsoft-Anmeldung fehlgeschlagen');
    }
    graphTokenCache.set(cacheKey, {
        accessToken: tokenData.access_token,
        expiresAt: Date.now() + (Number(tokenData.expires_in || 3600) * 1000),
    });
    return tokenData.access_token;
};

const graphRequest = async (configuration, path, options = {}) => {
    const accessToken = await acquireGraphToken(configuration);
    const response = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            ...options.headers,
        },
        signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error?.message || `Microsoft Graph antwortete mit Status ${response.status}`);
    }
};

const addressList = (value) => String(value || '').split(',').map((address) => address.trim()).filter(Boolean)
    .map((address) => ({ emailAddress: { address } }));

const createGraphTransport = (configuration) => ({
    verify: async () => acquireGraphToken(configuration),
    sendMail: async (mail) => graphRequest(configuration, `/users/${encodeURIComponent(configuration.fromAddress)}/sendMail`, {
        method: 'POST',
        body: JSON.stringify({
            message: {
                subject: mail.subject,
                body: { contentType: 'HTML', content: mail.html || String(mail.text || '').replace(/\n/g, '<br>') },
                toRecipients: addressList(mail.to),
                ccRecipients: addressList(mail.cc),
                bccRecipients: addressList(mail.bcc),
                attachments: (mail.attachments || []).map((attachment) => ({
                    '@odata.type': '#microsoft.graph.fileAttachment',
                    name: attachment.filename,
                    contentType: attachment.contentType || 'application/octet-stream',
                    contentBytes: Buffer.isBuffer(attachment.content) ? attachment.content.toString('base64') : attachment.content,
                    isInline: false,
                })),
            },
            saveToSentItems: true,
        }),
    }),
    close: () => undefined,
});

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
        clientSecret: configuration?.clientSecret || stored?.clientSecret || '',
    };
    const provider = merged.provider === 'microsoft' ? 'microsoft' : 'smtp';
    const errors = provider === 'microsoft'
        ? validateGraphConfiguration(merged, { secretRequired: true })
        : validateSmtpConfiguration(merged, { passwordRequired: Boolean(merged.username) });
    if (errors.length) throw new Error(errors.join(', '));
    const transporter = provider === 'microsoft' ? createGraphTransport(merged) : createSmtpTransport(merged);
    await transporter.verify();
    if (provider === 'microsoft') {
        await transporter.sendMail({
            to: merged.fromAddress,
            subject: 'Sponsorenlauf-Tool: Microsoft 365 erfolgreich eingerichtet',
            text: 'Diese Test-E-Mail bestätigt, dass der Versand über Microsoft Graph funktioniert.',
            html: '<p>Diese Test-E-Mail bestätigt, dass der Versand über <strong>Microsoft Graph</strong> funktioniert.</p>',
        });
    } else {
        await transporter.sendMail({
            from: `${merged.fromName} <${merged.fromAddress}>`,
            to: merged.fromAddress,
            subject: 'Sponsorenlauf-Tool: E-Mail-Versand erfolgreich eingerichtet',
            text: 'Diese Test-E-Mail bestätigt, dass der Versand über Ihren SMTP-Mailserver funktioniert.',
            html: '<p>Diese Test-E-Mail bestätigt, dass der Versand über Ihren <strong>SMTP-Mailserver</strong> funktioniert.</p>',
        });
    }
    transporter.close();
    return true;
};

export const getConfiguredSmtpTransport = async () => {
    const configuration = await getSmtpConfiguration({ includePassword: true });
    if (!configuration) throw new Error('SMTP-Server ist noch nicht konfiguriert.');
    return {
        configuration,
        transporter: configuration.provider === 'microsoft'
            ? createGraphTransport(configuration)
            : createSmtpTransport(configuration),
    };
};
