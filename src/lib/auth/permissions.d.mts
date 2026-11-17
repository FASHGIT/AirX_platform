export type OrganisationRole = "owner" | "admin" | "operator" | "finance" | "viewer";
export type OrganisationCapability = "manage-members" | "manage-listings" | "view-finance";
export function hasOrganisationPermission(
  role: OrganisationRole,
  capability: OrganisationCapability,
): boolean;

