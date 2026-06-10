"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUserByEmail = findUserByEmail;
exports.findUserById = findUserById;
exports.createUser = createUser;
exports.updateUserEmailVerified = updateUserEmailVerified;
exports.updateUserPassword = updateUserPassword;
exports.emailExistsExcludingUser = emailExistsExcludingUser;
exports.updateUserProfile = updateUserProfile;
exports.updateUserName = updateUserName;
exports.updateUserContact = updateUserContact;
exports.softDeleteUser = softDeleteUser;
exports.createSession = createSession;
exports.updateSessionTokenHash = updateSessionTokenHash;
exports.findSessionByTokenHash = findSessionByTokenHash;
exports.findSessionById = findSessionById;
exports.deleteSessionById = deleteSessionById;
exports.deleteSessionsByUserId = deleteSessionsByUserId;
exports.createEmailVerification = createEmailVerification;
exports.findEmailVerificationByToken = findEmailVerificationByToken;
exports.markEmailVerificationVerified = markEmailVerificationVerified;
exports.createPasswordReset = createPasswordReset;
exports.findPasswordResetByToken = findPasswordResetByToken;
exports.markPasswordResetUsed = markPasswordResetUsed;
const models_1 = require("../database/models");
const counter_1 = require("../database/counter");
function date(v) {
    return v ? new Date(v) : new Date();
}
function userRow(doc) {
    return {
        id: Number(doc.id),
        email: String(doc.email),
        password_hash: String(doc.password_hash),
        name: String(doc.name),
        mobile: doc.mobile != null && String(doc.mobile).trim() ? String(doc.mobile).trim() : null,
        address: doc.address != null && String(doc.address).trim() ? String(doc.address).trim() : null,
        email_verified_at: doc.email_verified_at ? date(doc.email_verified_at) : null,
        created_at: date(doc.created_at),
        updated_at: date(doc.updated_at),
        deleted_at: doc.deleted_at ? date(doc.deleted_at) : null,
    };
}
function sessionRow(doc) {
    return {
        id: Number(doc.id),
        user_id: Number(doc.user_id),
        token_hash: String(doc.token_hash),
        ip: doc.ip ?? null,
        user_agent: doc.user_agent ?? null,
        expires_at: date(doc.expires_at),
        created_at: date(doc.created_at),
    };
}
function verificationRow(doc) {
    return {
        id: Number(doc.id),
        user_id: Number(doc.user_id),
        email: String(doc.email),
        token: String(doc.token),
        expires_at: date(doc.expires_at),
        verified_at: doc.verified_at ? date(doc.verified_at) : null,
        created_at: date(doc.created_at),
    };
}
function resetRow(doc) {
    return {
        id: Number(doc.id),
        user_id: Number(doc.user_id),
        token: String(doc.token),
        expires_at: date(doc.expires_at),
        used_at: doc.used_at ? date(doc.used_at) : null,
        created_at: date(doc.created_at),
    };
}
async function findUserByEmail(email) {
    const row = await models_1.UserModel.findOne({ email: email.trim(), deleted_at: null }).lean();
    return row ? userRow(row) : null;
}
async function findUserById(id) {
    const row = await models_1.UserModel.findOne({ id, deleted_at: null }).lean();
    return row ? userRow(row) : null;
}
async function createUser(email, passwordHash, name, contact) {
    const id = await (0, counter_1.nextId)('users');
    await models_1.UserModel.create({
        id,
        email: email.trim(),
        password_hash: passwordHash,
        name,
        mobile: contact?.mobile?.trim() || null,
        address: contact?.address?.trim() || null,
        email_verified_at: null,
        deleted_at: null,
    });
    return id;
}
async function updateUserEmailVerified(userId) {
    await models_1.UserModel.updateOne({ id: userId }, { $set: { email_verified_at: new Date() } });
}
async function updateUserPassword(userId, passwordHash) {
    await models_1.UserModel.updateOne({ id: userId }, { $set: { password_hash: passwordHash } });
}
async function emailExistsExcludingUser(email, excludeUserId) {
    return Boolean(await models_1.UserModel.exists({ email: email.trim(), id: { $ne: excludeUserId }, deleted_at: null }));
}
async function updateUserProfile(userId, data) {
    const set = {
        email: data.email.trim(),
        name: data.name.trim(),
    };
    if (data.mobile !== undefined)
        set.mobile = data.mobile?.trim() || null;
    if (data.address !== undefined)
        set.address = data.address?.trim() || null;
    await models_1.UserModel.updateOne({ id: userId, deleted_at: null }, { $set: set });
}
async function updateUserName(userId, name) {
    await models_1.UserModel.updateOne({ id: userId, deleted_at: null }, { $set: { name: name.trim() } });
}
async function updateUserContact(userId, data) {
    const set = {};
    if (data.name !== undefined)
        set.name = data.name.trim();
    if (data.mobile !== undefined)
        set.mobile = data.mobile?.trim() || null;
    if (data.address !== undefined)
        set.address = data.address?.trim() || null;
    if (Object.keys(set).length === 0)
        return;
    await models_1.UserModel.updateOne({ id: userId, deleted_at: null }, { $set: set });
}
async function softDeleteUser(userId) {
    const result = await models_1.UserModel.updateOne({ id: userId, deleted_at: null }, { $set: { deleted_at: new Date() } });
    return result.modifiedCount > 0;
}
async function createSession(userId, tokenHash, expiresAt, ip, userAgent) {
    const id = await (0, counter_1.nextId)('user_sessions');
    await models_1.UserSessionModel.create({ id, user_id: userId, token_hash: tokenHash, expires_at: expiresAt, ip, user_agent: userAgent });
    return id;
}
async function updateSessionTokenHash(sessionId, tokenHash) {
    await models_1.UserSessionModel.updateOne({ id: sessionId }, { $set: { token_hash: tokenHash } });
}
async function findSessionByTokenHash(tokenHash) {
    const row = await models_1.UserSessionModel.findOne({ token_hash: tokenHash }).lean();
    return row ? sessionRow(row) : null;
}
async function findSessionById(sessionId) {
    const row = await models_1.UserSessionModel.findOne({ id: sessionId }).lean();
    return row ? sessionRow(row) : null;
}
async function deleteSessionById(sessionId) {
    await models_1.UserSessionModel.deleteOne({ id: sessionId });
}
async function deleteSessionsByUserId(userId) {
    await models_1.UserSessionModel.deleteMany({ user_id: userId });
}
async function createEmailVerification(userId, email, token, expiresAt) {
    const id = await (0, counter_1.nextId)('email_verifications');
    await models_1.EmailVerificationModel.create({
        id,
        user_id: userId,
        email,
        token,
        expires_at: expiresAt,
        verified_at: null,
    });
    return id;
}
async function findEmailVerificationByToken(token) {
    const row = await models_1.EmailVerificationModel.findOne({ token }).lean();
    return row ? verificationRow(row) : null;
}
async function markEmailVerificationVerified(verificationId) {
    await models_1.EmailVerificationModel.updateOne({ id: verificationId }, { $set: { verified_at: new Date() } });
}
async function createPasswordReset(userId, token, expiresAt) {
    const id = await (0, counter_1.nextId)('password_resets');
    await models_1.PasswordResetModel.create({
        id,
        user_id: userId,
        token,
        expires_at: expiresAt,
        used_at: null,
    });
    return id;
}
async function findPasswordResetByToken(token) {
    const row = await models_1.PasswordResetModel.findOne({ token, used_at: null }).lean();
    return row ? resetRow(row) : null;
}
async function markPasswordResetUsed(resetId) {
    await models_1.PasswordResetModel.updateOne({ id: resetId }, { $set: { used_at: new Date() } });
}
//# sourceMappingURL=authRepository.js.map