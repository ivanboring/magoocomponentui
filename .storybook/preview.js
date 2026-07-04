import "./preview.css";

/** Theme switcher in the Storybook toolbar. */
export const globalTypes = {
  theme: {
    description: "Theme",
    defaultValue: "simple",
    toolbar: {
      title: "Theme",
      icon: "paintbrush",
      dynamicTitle: true,
      items: [
        { value: "simple", title: "Simple" },
        { value: "futuristic", title: "Futuristic" },
        { value: "classic", title: "Classic" },
        { value: "smooth", title: "Smooth" },
      ],
    },
  },
};

/** Wrap each story in the selected theme. */
export const decorators = [
  (story, context) => {
    const theme = context.globals.theme || "simple";
    const wrap = document.createElement("div");
    wrap.setAttribute("data-theme", theme);
    wrap.style.padding = "2rem";
    wrap.style.background = "var(--color-background)";
    const res = story();
    if (typeof res === "string") wrap.innerHTML = res;
    else wrap.appendChild(res);
    return wrap;
  },
];

export const parameters = {
  layout: "fullscreen",
};
