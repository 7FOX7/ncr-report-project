// credentials.js
// -------------------------------------------------------
// This file is responsible for:
//  - Storing & reading "who is logged in" from localStorage
//  - Switching navbar text between Login / Logout
//  - Handling DEMO role buttons on login.html
//  - Handling username/password login (simple mapping)
//  - Exposing getCurrentRole() for other pages (like edit.js)
// -------------------------------------------------------

// LocalStorage key
const CREDENTIALS_KEY = 'userCredentials';

// ---------------------- BASIC HELPERS ----------------------

function LoggedOut() {
  const logout = { type: 'loggedOut' };
  localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(logout));
}

function saveCredentials(roleType) {
  const credentials = { type: roleType };
  localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
  console.log('Saved credentials:', credentials);
}

function getCredentials() {
  try {
    const data = localStorage.getItem(CREDENTIALS_KEY);
    const parsed = data ? JSON.parse(data) : null;
    console.log('Retrieved credentials from localStorage:', parsed);
    return parsed;
  } catch (e) {
    console.error('Error parsing credentials:', e);
    return null;
  }
}

function isLoggedIn() {
  const credentials = getCredentials();
  console.log('Checking isLoggedIn with credentials:', credentials);
  if (!credentials) return false;
  if (!credentials.type) return false;
  if (credentials.type === 'loggedOut') return false;
  return true;
}

// Expose a simple helper for other scripts (edit.js will use this)
function getCurrentRole() {
  const creds = getCredentials();
  return creds && creds.type ? creds.type : null;
}
// Make sure it's visible globally
window.getCurrentRole = getCurrentRole;

// ---------------------- LOGIN / LOGOUT ACTIONS ----------------------

function handleLogin(role) {
  saveCredentials(role);
  // After login, send user back to home (NCR list)
  window.location.href = 'index.html';
}

function handleLogout() {
  LoggedOut();
  // Redirect to login page
  window.location.href = 'login.html';
}

// ---------------------- NAVBAR TEXT ----------------------

function updateNavbarLoginLink() {
  const loginNavLink = document.getElementById('login-nav-link');
  if (!loginNavLink) {
    console.warn('login-nav-link element not found in this page');
    return;
  }

  const homeNavItem = document.getElementById('home-nav-item');

  console.log('Updating navbar link, isLoggedIn:', isLoggedIn());

  if (isLoggedIn()) {
    loginNavLink.textContent = 'Logout';
    // When clicked while logged in, perform logout instead of going to login page
    loginNavLink.addEventListener('click', function (e) {
      e.preventDefault();
      handleLogout();
    });
    // Show Home link when logged in
    if (homeNavItem) homeNavItem.style.display = '';
  } else {
    loginNavLink.textContent = 'Login';
    // Default behavior: go to login.html
    // Hide Home link when not logged in
    if (homeNavItem) homeNavItem.style.display = 'none';
  }
}

// ---------------------- LOGIN PAGE LOGIC ----------------------

function updateLoginPage() {
  const currentPath = window.location.pathname;
  // Only run this on login.html
  if (!currentPath.includes('login.html')) return;

  const heading = document.getElementById('login-heading');
  const loginContent = document.querySelector('.login-content');
  const demoButtons = document.querySelectorAll('.login-demo-btn');
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');

  console.log('Login page detected. DEMO buttons found:', demoButtons.length);

  if (isLoggedIn()) {
    // ---------- Already LOGGED IN: show logout view ----------
    const credentials = getCredentials();
    const role = credentials?.type || 'Unknown';

    if (heading) heading.textContent = 'Logout';

    if (loginContent) {
      loginContent.innerHTML = `
        <div class="about-message">
          <p style="margin-bottom: 1.5rem; font-size: 1.1rem;">
            You are currently logged in as <strong>${role}</strong>.
          </p>
          <button class="btn btn-primary" id="logout-btn">Logout</button>
        </div>
      `;

      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
          e.preventDefault();
          handleLogout();
        });
      }
    }

    // Hide demo buttons if logged in
    demoButtons.forEach(btn => btn.style.display = 'none');

    // No normal login form when already logged in
    if (loginForm) {
      loginForm.style.display = 'none';
    }

  } else {
    // ---------- NOT LOGGED IN: show login + demo buttons ----------
    if (heading) heading.textContent = 'Login';

    // DEMO BUTTON HANDLERS
    demoButtons.forEach(btn => {
      const role = btn.getAttribute('data-role');
      console.log('Binding DEMO button for role:', role);

      btn.addEventListener('click', function (e) {
        e.preventDefault();
        if (!role) return;
        handleLogin(role);
      });
    });

    // NORMAL LOGIN FORM HANDLING
    if (loginForm) {
      loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        if (loginError) {
          loginError.textContent = '';
        }

        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');

        const username = (usernameInput?.value || '').trim();
        const password = (passwordInput?.value || '').trim();

        if (!username || !password) {
          if (loginError) {
            loginError.textContent = 'Please enter both username and password.';
          }
          return;
        }

        // ---------------------------------------------------------
        // SIMPLE USERNAME → ROLE MAPPING FOR DEMO
        // You can replace this with your teammate's real credential logic.
        //
        // Example:
        //   qi1 / pass123  -> Quality Inspector
        //   eng1 / pass123 -> Engineer
        //   po1 / pass123  -> Purchasing/Operations
        // ---------------------------------------------------------
        let detectedRole = null;

        if ((username === 'qi1' || username === 'inspector') && password === 'pass123') {
          detectedRole = 'Quality Inspector';
        } else if ((username === 'eng1' || username === 'engineer') && password === 'pass123') {
          detectedRole = 'Engineer';
        } else if ((username === 'po1' || username === 'purchasing') && password === 'pass123') {
          detectedRole = 'Purchasing/Operations';
        }

        if (!detectedRole) {
          // If nothing matched, show error but DO NOT log in
          if (loginError) {
            loginError.textContent =
              'Invalid credentials. For now, you can also use the [DEMO] buttons above to pick a role.';
          }
          return;
        }

        // Success → save credentials and redirect
        handleLogin(detectedRole);
      });
    }
  }
}

// ---------------------- INIT ON PAGE LOAD ----------------------

(function () {
  function init() {
    updateNavbarLoginLink();
    updateLoginPage();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
