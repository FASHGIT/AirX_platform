import assert from "node:assert/strict";
import { hasOrganisationPermission } from "../src/lib/auth/permissions.mjs";

assert.equal(hasOrganisationPermission("owner", "manage-members"), true);
assert.equal(hasOrganisationPermission("admin", "manage-members"), true);
assert.equal(hasOrganisationPermission("operator", "manage-members"), false);
assert.equal(hasOrganisationPermission("operator", "manage-listings"), true);
assert.equal(hasOrganisationPermission("finance", "manage-listings"), false);
assert.equal(hasOrganisationPermission("finance", "view-finance"), true);
assert.equal(hasOrganisationPermission("viewer", "view-finance"), false);

process.stdout.write("Organisation permission matrix checks passed (7 assertions).\n");

