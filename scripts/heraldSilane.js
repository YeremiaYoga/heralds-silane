async function heraldSilane_renderAccessButton() {
  const existingButton = document.getElementById(
    "heraldSilane-accessButtonContainer",
  );
  if (existingButton) {
    existingButton.remove();
  }

  try {
    const html = await fetch(
      "/modules/heralds-silane/templates/accessButton.html",
    ).then((response) => response.text());

    const div = document.createElement("div");
    div.innerHTML = html;
    const exporter = div.firstChild;
    exporter.id = "heraldSilane-accessButtonContainer";

    exporter.classList.add("heraldSilane-accessButtonWrapper");

    const accessButton = document.createElement("button");
    accessButton.id = "heraldSilane-accessButton";
    accessButton.classList.add("heraldSilane-accessButton");
    accessButton.innerHTML =
      '<i class="fa-solid fa-file-import" style="margin-left:2px;"></i>';
    accessButton.title = "Open Herald Importer / Exporter";

    accessButton.addEventListener("click", async function () {
      await heraldSilane_showDialog();
    });

    exporter.appendChild(accessButton);
    document.body.appendChild(exporter);
  } catch (err) {
    console.error("Herald Silane: failed to render access button", err);
  }
}

export { heraldSilane_renderAccessButton };
