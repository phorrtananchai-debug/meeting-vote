// Add emails of users who are allowed to access the admin dashboard
export const ALLOWED_ADMINS = [
  'admin@example.com',
  // Add more admin emails here
];

export const isAdmin = (email) => {
  return ALLOWED_ADMINS.includes(email);
};
