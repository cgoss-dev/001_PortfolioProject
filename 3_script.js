// =========================
// MENU TOGGLE
// =========================

const menuButton = document.querySelector(".menu-button");
const dropdownLow = document.getElementById("dropdownLow");

if (menuButton && dropdownLow) {
     menuButton.addEventListener("click", function () {
          dropdownLow.classList.toggle("menu-open");

          if (dropdownLow.classList.contains("menu-open")) {
               menuButton.textContent = "×";
          } else {
               menuButton.textContent = "+";
          }
     });
}
