const organisationPermissions = Object.freeze({
  "manage-members": ["owner", "admin"],
  "manage-listings": ["owner", "admin", "operator"],
  "view-finance": ["owner", "admin", "finance"],
});

/**
 * UI permission hints only. Server actions and database RLS are authoritative.
 * @param {"owner"|"admin"|"operator"|"finance"|"viewer"} role
 * @param {"manage-members"|"manage-listings"|"view-finance"} capability
 */
export function hasOrganisationPermission(role, capability) {
  return organisationPermissions[capability]?.includes(role) ?? false;
}

