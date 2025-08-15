document.addEventListener('DOMContentLoaded', () => {

    /* ==================== HERO ANIMATION ==================== */
    const heading = document.querySelector('.hero h1');
    const paragraph = document.querySelector('.hero p');
    if (heading && paragraph) {
        setTimeout(() => heading.classList.add('animate'), 200);
        setTimeout(() => paragraph.classList.add('animate'), 600);
    }

    /* ==================== SIDEBAR TOGGLE ==================== */
    const portalHamburger = document.getElementById("portal-hamburger");
    const portalSidebar = document.getElementById("portal-sidebar");
    const navHamburger = document.getElementById("hamburger");
    const navSidebar = document.getElementById("sidebar");

    function closeAllSidebars() {
        if (portalSidebar) portalSidebar.classList.remove("active");
        if (navSidebar) navSidebar.classList.remove("active");
    }

    function anySidebarOpen() {
        return (portalSidebar?.classList.contains("active") || navSidebar?.classList.contains("active"));
    }

    // Universal toggle for portal hamburger
    if (portalHamburger && portalSidebar) {
        portalHamburger.addEventListener("click", e => {
            e.stopPropagation();
            if (anySidebarOpen()) {
                closeAllSidebars();
            } else {
                closeAllSidebars();
                portalSidebar.classList.add("active");
            }
        });

        // Toggle when clicking inside portalSidebar
        portalSidebar.addEventListener("click", e => {
            e.stopPropagation();
            portalSidebar.classList.toggle("active");
        });
    }

    // Universal toggle for nav hamburger
    if (navHamburger && navSidebar) {
        navHamburger.addEventListener("click", e => {
            e.stopPropagation();
            if (anySidebarOpen()) {
                closeAllSidebars();
            } else {
                closeAllSidebars();
                navSidebar.classList.add("active");
            }
        });

        // Toggle when clicking inside navSidebar
        navSidebar.addEventListener("click", e => {
            e.stopPropagation();
            navSidebar.classList.toggle("active");
        });
    }

    // Click outside to close all
    document.addEventListener("click", e => {
        if (
            (!portalSidebar || !portalSidebar.contains(e.target)) &&
            (!portalHamburger || !portalHamburger.contains(e.target)) &&
            (!navSidebar || !navSidebar.contains(e.target)) &&
            (!navHamburger || !navHamburger.contains(e.target))
        ) {
            closeAllSidebars();
        }
    });

    /* ==================== NAV ANIMATION ==================== */
    const nav = document.querySelector(".header nav");
    if (nav) setTimeout(() => nav.classList.add("animate-in"), 200);

    /* ==================== INFO BOX OBSERVER ==================== */
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('animate');
        });
    }, { threshold: 0.3 });

    document.querySelectorAll('.info-box').forEach(box => observer.observe(box));

    /* ==================== STUDENT/TEACHER INFO ANIMATION ==================== */
    const container = document.querySelector(".student-info-container");
    if (container) {
        if (window.innerWidth > 768) {
            container.classList.add("visible");
        } else {
            function onScroll() {
                const rect = container.getBoundingClientRect();
                if (rect.top < window.innerHeight && rect.bottom >= 0) {
                    container.classList.add("visible");
                    window.removeEventListener("scroll", onScroll);
                }
            }
            window.addEventListener("scroll", onScroll);
            onScroll();
        }
    }

    const teacherBox = document.getElementById('teacherInfo');
    if (teacherBox) teacherBox.classList.add('visible');

    /* ==================== ACCESS ALERT ==================== */
    window.alertAccess = function (event) {
        event.preventDefault();
        alert("⚠️ Only authorized persons can log in.\nYour email is shared with Mr. Zafar Iqbal and Mr. Muhammad Ahmad Hasham for security purposes.");
    };

});



/*==================== News Boxes ====================*/

document.addEventListener("DOMContentLoaded", function () {
  const elements = document.querySelectorAll(".animate-right, .animate-left");

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("animate-show");
        observer.unobserve(entry.target); // animate only once
      }
    });
  }, { threshold: 0.2 });

  elements.forEach(el => observer.observe(el));
});

/*loading*/
// Show loader when submit button is clicked
document.getElementById("applicationForm").addEventListener("submit", function () {
    document.getElementById("loading-overlay").classList.remove("hidden");
});

// Wrap default alert to hide loader automatically
(function() {
    const originalAlert = window.alert;
    window.alert = function(message) {
        document.getElementById("loading-overlay").classList.add("hidden"); // hide loader
        originalAlert(message); // show original alert
    };
})();
