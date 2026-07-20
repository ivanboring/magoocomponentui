/**
 * Petition signer - collects a name and email and fires petition:sign.
 *
 * Pressing Sign dispatches petition:sign with the current { name, email } read from
 * the two inputs (empty strings if left blank). No count mutation happens here - the
 * displayed total is server-driven. Config comes from the DOM (portable init passes
 * no props object); the click listener is cleaned up.
 */
export default function init(root) {
  const button = root.querySelector(".petition-signer__sign");
  const name = root.querySelector(".petition-signer__name");
  const email = root.querySelector(".petition-signer__email");
  if (!button) return () => {};

  function sign() {
    root.dispatchEvent(new CustomEvent("petition:sign", {
      bubbles: true,
      detail: {
        name: name ? name.value : "",
        email: email ? email.value : "",
      },
    }));
  }

  button.addEventListener("click", sign);
  return () => button.removeEventListener("click", sign);
}
