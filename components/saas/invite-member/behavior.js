/**
 * Invite member — on submit, emits member:invite with the entered email and selected role.
 * Config comes from the form's own inputs (portable init passes no props object). The component
 * only reports intent; the host app is responsible for actually sending the invitation.
 */
export default function init(root) {
  const form = root.matches("form.invite-member") ? root : root.querySelector("form.invite-member");
  if (!form) return () => {};
  const email = form.querySelector(".invite-member__email");
  const role = form.querySelector(".invite-member__role");

  function onSubmit(event) {
    event.preventDefault();
    form.dispatchEvent(
      new CustomEvent("member:invite", {
        bubbles: true,
        detail: { email: email ? email.value : "", role: role ? role.value : "" },
      })
    );
  }

  form.addEventListener("submit", onSubmit);
  return () => form.removeEventListener("submit", onSubmit);
}
