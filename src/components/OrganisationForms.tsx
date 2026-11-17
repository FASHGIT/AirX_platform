"use client";

import { useActionState } from "react";
import { useInvitationToken } from "@/lib/auth/useInvitationToken";
import {
  acceptOrganisationInvitationAction,
  createOrganisationInvitationAction,
  submitOrganisationApplicationAction,
  type OrganisationActionState,
} from "@/app/actions/organisations";
import {
  removeOrganisationMemberAction,
  reviewOrganisationApplicationAction,
  setOrganisationMemberRoleAction,
  type AuthActionState,
} from "@/app/actions/auth";

type OrganisationType = { code: string; display_name: string };

export function OrganisationApplicationForm({ types }: { types: OrganisationType[] }) {
  const [state, formAction, pending] = useActionState<OrganisationActionState, FormData>(submitOrganisationApplicationAction, {});
  return (
    <form className="form-stack form-card" action={formAction}>
      <div className="form-grid">
        <label>Organisation name<input name="name" required minLength={2} maxLength={160} /></label>
        <label>Organisation category
          <select name="type_code" required defaultValue="">
            <option value="" disabled>Select a category</option>
            {types.map((type) => <option key={type.code} value={type.code}>{type.display_name}</option>)}
          </select>
        </label>
        <label>Country code<input name="country_code" defaultValue="NG" required minLength={2} maxLength={2} /></label>
        <label>Business contact email<input name="contact_email" type="email" required maxLength={254} /></label>
        <label>Business contact phone <span className="optional">(optional)</span><input name="contact_phone" type="tel" maxLength={80} /></label>
        <label>Registered address <span className="optional">(optional)</span><input name="registered_address" maxLength={500} /></label>
        <label>Business registration number <span className="optional">(optional)</span><input name="business_registration_number" maxLength={120} /></label>
        <label>Tax identifier <span className="optional">(optional)</span><input name="tax_identifier" maxLength={120} /></label>
      </div>
      <p className="form-footnote">The application will be submitted for AirX review. Do not upload identity documents here; secure document handling is not enabled yet.</p>
      <button className="button button-primary" type="submit" disabled={pending || types.length === 0}>{pending ? "Submitting…" : "Submit for review"}</button>
      <p aria-live="polite" className={state.error ? "form-message error" : "form-message"}>{state.error || state.message || ""}</p>
    </form>
  );
}

export function OrganisationInvitationForm({ organisationId }: { organisationId: string }) {
  const [state, formAction, pending] = useActionState<OrganisationActionState, FormData>(createOrganisationInvitationAction, {});
  const isLink = state.message?.startsWith("https://") || state.message?.startsWith("http://");
  return (
    <form className="form-stack form-card" action={formAction}>
      <input type="hidden" name="organisation_id" value={organisationId} />
      <div className="form-grid">
        <label>Invite email<input name="email" type="email" required maxLength={254} /></label>
        <label>Organisation role
          <select name="role" defaultValue="viewer">
            <option value="admin">Administrator</option><option value="operator">Operations</option>
            <option value="finance">Finance</option><option value="viewer">Viewer</option>
          </select>
        </label>
      </div>
      <p className="form-footnote">AirX creates a single-use link valid for seven days. Share it out of band; email delivery is not configured.</p>
      <button className="button button-secondary" type="submit" disabled={pending}>{pending ? "Creating link…" : "Create invitation link"}</button>
      {state.error && <p className="form-message error" aria-live="polite">{state.error}</p>}
      {isLink && <p className="form-message success" aria-live="polite">Copy and share this one-time link: <a href={state.message}>{state.message}</a></p>}
    </form>
  );
}

export function AcceptInvitationForm({ isSignedIn }: { isSignedIn: boolean }) {
  const token = useInvitationToken();
  const [state, formAction, pending] = useActionState<OrganisationActionState, FormData>(acceptOrganisationInvitationAction, {});

  if (!isSignedIn) {
    const hash = token ? "#token=" + token : "";
    return (
      <div className="form-stack">
        <p>Sign in with the email address this invitation was sent to. The database checks that email before adding membership.</p>
        <div className="form-links"><a href={"/login" + hash}>Sign in</a><a href={"/register" + hash}>Create an account</a></div>
      </div>
    );
  }
  return (
    <form className="form-stack" action={formAction}>
      <input type="hidden" name="token" value={token} />
      {!token && <p aria-live="polite" className="form-message error">Invitation token is missing. Open the complete invitation link again.</p>}
      <button className="button button-primary" type="submit" disabled={pending || !token}>{pending ? "Checking invitation…" : "Accept invitation"}</button>
      {state.error && <p className="form-message error" aria-live="polite">{state.error}</p>}
    </form>
  );
}

export function MemberRoleForm({
  organisationId, userId, currentRole, canAssignOwner,
}: {
  organisationId: string; userId: string; currentRole: string; canAssignOwner: boolean;
}) {
  const [state, action, pending] = useActionState<AuthActionState, FormData>(setOrganisationMemberRoleAction, {});
  const [removeState, removeAction, removing] = useActionState<AuthActionState, FormData>(removeOrganisationMemberAction, {});
  return (
    <div className="member-actions">
      <form action={action}>
        <input type="hidden" name="organisation_id" value={organisationId} /><input type="hidden" name="user_id" value={userId} />
        <select name="role" defaultValue={currentRole} aria-label="Member role">
          {canAssignOwner && <option value="owner">Owner</option>}
          <option value="admin">Administrator</option><option value="operator">Operations</option>
          <option value="finance">Finance</option><option value="viewer">Viewer</option>
        </select>
        <button className="button button-small" type="submit" disabled={pending}>{pending ? "Saving…" : "Save role"}</button>
        {state.message && <small className="success">{state.message}</small>}
        {state.error && <small className="error">{state.error}</small>}
      </form>
      <form action={removeAction}>
        <input type="hidden" name="organisation_id" value={organisationId} /><input type="hidden" name="user_id" value={userId} />
        <button className="button button-danger button-small" type="submit" disabled={removing}>{removing ? "Removing…" : "Remove"}</button>
        {removeState.message && <small className="success">{removeState.message}</small>}
        {removeState.error && <small className="error">{removeState.error}</small>}
      </form>
    </div>
  );
}

export function ReviewApplicationForm({ applicationId }: { applicationId: string }) {
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(reviewOrganisationApplicationAction, {});
  return (
    <form className="review-form" action={formAction}>
      <input type="hidden" name="application_id" value={applicationId} />
      <select name="decision" defaultValue="under_review" aria-label="Review decision">
        <option value="under_review">Mark under review</option><option value="more_information_required">Request more information</option>
        <option value="approved">Approve application</option><option value="rejected">Reject application</option>
      </select>
      <input name="notes" aria-label="Review notes" placeholder="Decision notes" maxLength={4000} />
      <button className="button button-small" type="submit" disabled={pending}>{pending ? "Recording…" : "Record review"}</button>
      {state.message && <small className="success">{state.message}</small>}
      {state.error && <small className="error">{state.error}</small>}
    </form>
  );
}






