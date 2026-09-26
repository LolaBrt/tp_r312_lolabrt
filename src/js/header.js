function initMobileMenu() {
  const toggle = document.querySelector("#menu-btn");
  const nav = document.querySelector("#menu");
  const page = document.body;

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const isOpen = toggle.ariaExpanded === "true";
      const isClosed = !isOpen;
      toggle.ariaExpanded = String(isClosed);
      nav.ariaHidden = String(isOpen);
      page.classList.toggle("overflow-hidden", isClosed);
    });
  }
}
initMobileMenu();

function initHeaderScroll() {
  const navBar = document.querySelector("#header");
  if (!navBar) return;

  let lastScrollY = 0;
  let ticking = false;
  const offset = 205;

  function handleScroll() {
    const currentScrollY = window.scrollY;
    const isPastOffset = currentScrollY > offset;

    // Toggle classes selon la position
    navBar.classList.toggle("bg-white", isPastOffset);
    navBar.classList.toggle(
      "-translate-y-full",
      currentScrollY > lastScrollY && isPastOffset
    );

    lastScrollY = currentScrollY;
    ticking = false;
  }

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(handleScroll);
      ticking = true;
    }
  });
}

initMobileMenu();
initHeaderScroll();