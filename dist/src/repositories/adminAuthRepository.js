"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findAdminByEmail = findAdminByEmail;
exports.findAdminById = findAdminById;
exports.createAdminSession = createAdminSession;
exports.updateAdminSessionTokenHash = updateAdminSessionTokenHash;
exports.findAdminSessionByTokenHash = findAdminSessionByTokenHash;
exports.findAdminSessionById = findAdminSessionById;
exports.deleteAdminSessionById = deleteAdminSessionById;
exports.deleteAllAdminSessionsForAdmin = deleteAllAdminSessionsForAdmin;
exports.createAdmin = createAdmin;
exports.updateAdminPassword = updateAdminPassword;
exports.updateAdminName = updateAdminName;
const models_1 = require("../database/models");
const counter_1 = require("../database/counter");
function date(v) {
    return v ? new Date(v) : new Date();
}
function adminRow(doc) {
    return {
        id: Number(doc.id),
        email: String(doc.email),
        password_hash: String(doc.password_hash),
        name: String(doc.name),
        role: String(doc.role ?? 'admin'),
        created_at: date(doc.created_at),
        updated_at: date(doc.updated_at),
        deleted_at: doc.deleted_at ? date(doc.deleted_at) : null,
    };
}
function sessionRow(doc) {
    return {
        id: Number(doc.id),
        admin_id: Number(doc.admin_id),
        token_hash: String(doc.token_hash),
        ip: doc.ip ?? null,
        user_agent: doc.user_agent ?? null,
        expires_at: date(doc.expires_at),
        created_at: date(doc.created_at),
    };
}
async function findAdminByEmail(email) {
    const row = await models_1.AdminModel.findOne({ email: email.trim(), deleted_at: null }).lean();
    return row ? adminRow(row) : null;
}
async function findAdminById(id) {
    const row = await models_1.AdminModel.findOne({ id, deleted_at: null }).lean();
    return row ? adminRow(row) : null;
}
async function createAdminSession(adminId, tokenHash, expiresAt, ip, userAgent) {
    const id = await (0, counter_1.nextId)('admin_sessions');
    await models_1.AdminSessionModel.create({ id, admin_id: adminId, token_hash: tokenHash, expires_at: expiresAt, ip, user_agent: userAgent });
    return id;
}
async function updateAdminSessionTokenHash(sessionId, tokenHash) {
    await models_1.AdminSessionModel.updateOne({ id: sessionId }, { $set: { token_hash: tokenHash } });
}
async function findAdminSessionByTokenHash(tokenHash) {
    const row = await models_1.AdminSessionModel.findOne({ token_hash: tokenHash }).lean();
    return row ? sessionRow(row) : null;
}
async function findAdminSessionById(sessionId) {
    const row = await models_1.AdminSessionModel.findOne({ id: sessionId }).lean();
    return row ? sessionRow(row) : null;
}
async function deleteAdminSessionById(sessionId) {
    await models_1.AdminSessionModel.deleteOne({ id: sessionId });
}
async function deleteAllAdminSessionsForAdmin(adminId) {
    await models_1.AdminSessionModel.deleteMany({ admin_id: adminId });
}
async function createAdmin(email, passwordHash, name, role) {
    const id = await (0, counter_1.nextId)('admins');
    await models_1.AdminModel.create({
        id,
        email: email.trim(),
        password_hash: passwordHash,
        name: name.trim(),
        role,
        deleted_at: null,
    });
    return id;
}
async function updateAdminPassword(adminId, passwordHash) {
    await models_1.AdminModel.updateOne({ id: adminId, deleted_at: null }, { $set: { password_hash: passwordHash } });
}
async function updateAdminName(adminId, name) {
    await models_1.AdminModel.updateOne({ id: adminId, deleted_at: null }, { $set: { name: name.trim() } });
}
//# sourceMappingURL=adminAuthRepository.js.map