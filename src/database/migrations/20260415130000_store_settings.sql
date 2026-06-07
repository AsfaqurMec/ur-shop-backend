SET NAMES utf8mb4;

INSERT INTO `settings` (`key`, `value`)
VALUES (
  'store_settings',
  JSON_OBJECT(
    'siteTitle', 'Digital Store',
    'siteLogo', '',
    'emailHeaderLogo', '',
    'emailHeaderSlogan', 'Digital products, crafted for creators and teams.',
    'emailHeaderSubtitle', '',
    'emailFooterSupportEmail', '',
    'emailFooterSupportNumber', '',
    'storeName', 'Digital Store',
    'contactEmail', '',
    'address', '',
    'currency', 'BDT',
    'timezone', 'UTC'
  )
)
ON DUPLICATE KEY UPDATE `value` = `value`;
