import { AcceptInvitationForm } from "@/components/OrganisationForms";
import { getSignedInUser } from "@/lib/auth/session";

export default async function AcceptInvitationPage() {
  const session = await getSignedInUser();
  return (
    <>
      <p className="eyebrow">ORGANISATION INVITATION</p>
      <h1>Join an organisation</h1>
      <p className="auth-description">The invitation is single-use and must be accepted with the invited email address.</p>
      <AcceptInvitationForm isSignedIn={!!session} />
    </>
  );
}

