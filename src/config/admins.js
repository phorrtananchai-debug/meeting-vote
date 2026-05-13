// Add emails of users who are allowed to access the admin dashboard
export const ALLOWED_ADMINS = [
  'phorr.tananchai@beblanktobehindstudio.com',
  'phorr.tananchai@gmail.com',
];

export const isAdmin = (email) => {
  return ALLOWED_ADMINS.includes(email);
};
