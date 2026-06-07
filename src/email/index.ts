/**
 * Email module: layout helpers and template registry.
 * Use services/emailService for sending (sendTemplateEmail, sendWelcomeEmail, etc.).
 */

export {
  wrapHtml,
  escapeHtml,
  escapeAttr,
  link,
  paragraph,
  getStoreName,
  mobileFieldLabel,
} from './layout';
export {
  getTemplate,
  renderTemplate,
  type TemplateName,
  type TemplateDataMap,
  type RenderedEmail,
} from './templates';
