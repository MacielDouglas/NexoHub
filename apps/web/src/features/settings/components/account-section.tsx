import { exitOrgAction, signOutAction } from "../actions/settings.actions";
import { SubmitButton } from "./submit-button";

type Props = {
  slug: string;
  isSuperUser: boolean;
  accountLabel: string;
  adminLabel: string;
  signOutLabel: string;
  exitOrgLabel: string;
};

export function AccountSection({
  isSuperUser,
  accountLabel,
  adminLabel,
  signOutLabel,
  exitOrgLabel,
}: Props) {
  return (
    <>
      <section className="mb-12">
        <h2 className="mb-4 text-base font-semibold">{accountLabel}</h2>
        <form action={signOutAction}>
          <SubmitButton className="w-full rounded-xl border border-red-600 py-2.5 text-sm font-semibold text-red-600 transition-opacity hover:opacity-80">
            {signOutLabel}
          </SubmitButton>
        </form>
      </section>

      {isSuperUser ? (
        <section>
          <h2 className="mb-4 text-base font-semibold">{adminLabel}</h2>
          <form action={exitOrgAction}>
            <SubmitButton className="w-full rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-80">
              {exitOrgLabel}
            </SubmitButton>
          </form>
        </section>
      ) : null}
    </>
  );
}
