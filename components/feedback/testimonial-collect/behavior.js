/**
 * Testimonial collection behavior — pick a star rating and submit the form.
 * The chosen rating (0-5) lives on the root's data-rating attribute. Clicking a star sets the rating
 * and fills every star up to and including it (data-active drives the CSS highlight); the star
 * radios expose the selection via aria-checked. Submitting prevents the native navigation and
 * dispatches a bubbling "testimonial:submit" CustomEvent with { rating, name, role, message } so the
 * host can persist it. Returns a cleanup that removes every listener.
 */
export default function init(root) {
  const stars = Array.from(root.querySelectorAll(".testimonial-collect__star"));
  const nameEl = root.querySelector(".testimonial-collect__name");
  const roleEl = root.querySelector(".testimonial-collect__role");
  const messageEl = root.querySelector(".testimonial-collect__message");

  function paint(rating) {
    stars.forEach((star) => {
      const on = Number(star.dataset.starValue) <= rating;
      star.dataset.active = on ? "true" : "false";
      star.setAttribute("aria-checked", Number(star.dataset.starValue) === rating ? "true" : "false");
    });
  }

  const starHandlers = stars.map((star) => {
    const onClick = () => {
      const rating = Number(star.dataset.starValue);
      root.dataset.rating = String(rating);
      paint(rating);
    };
    star.addEventListener("click", onClick);
    return onClick;
  });

  function onSubmit(event) {
    event.preventDefault();
    root.dispatchEvent(
      new CustomEvent("testimonial:submit", {
        bubbles: true,
        detail: {
          rating: Number(root.dataset.rating) || 0,
          name: nameEl ? nameEl.value : "",
          role: roleEl ? roleEl.value : "",
          message: messageEl ? messageEl.value : "",
        },
      })
    );
  }
  root.addEventListener("submit", onSubmit);

  return () => {
    stars.forEach((star, i) => star.removeEventListener("click", starHandlers[i]));
    root.removeEventListener("submit", onSubmit);
  };
}
