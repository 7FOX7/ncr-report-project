
// Set logged out state
function LoggedOut() 
{
    const logout = { type: 'loggedOut' };
    localStorage.setItem('userCredentials', JSON.stringify(logout));
}

// Set credentials
function saveCredentials(Type) 
{
  const credentials = { type: Type };
  localStorage.setItem('userCredentials', JSON.stringify(credentials));
  console.log('Saved credentials:', credentials);
}

// Get current credentials
function getCredentials() 
{
  try 
  {
    const data = localStorage.getItem('userCredentials');
    const parsed = data ? JSON.parse(data) : null;
    console.log('Retrieved credentials from localStorage:', parsed);
    return parsed;
  } 
  catch (e) { 
    console.error('Error parsing credentials:', e);
    return null; 
  }
}

// Check if user is logged in
function isLoggedIn() 
{
  const credentials = getCredentials();
  console.log('Checking isLoggedIn with credentials:', credentials);
  if (!credentials) return false;
  if (!credentials.type) return false;
  if (credentials.type === 'loggedOut') return false;
  return true;
}

// Handle login button clicks
function handleLogin(role) 
{
  saveCredentials(role);
  window.location.href = 'index.html';
}

// Handle logout
function handleLogout() 
{
  LoggedOut();
  window.location.reload();
}

// Update navbar link text based on authentication state
function updateNavbarLoginLink() 
{
  const loginNavLink = document.getElementById('login-nav-link');
  if (!loginNavLink) {
    console.warn('login-nav-link element not found');
    return;
  }

  console.log('Updating navbar link, isLoggedIn:', isLoggedIn());
  
  if (isLoggedIn()) {
    loginNavLink.textContent = 'Logout';
  } else {
    loginNavLink.textContent = 'Login';
  }
}

// Update login page based on authentication state
function updateLoginPage() 
{
  const currentPage = window.location.pathname;
  if (!currentPage.includes('login.html')) return;

  const heading = document.getElementById('login-heading');
  const loginContent = document.querySelector('.login-content');
  const demoButtons = document.querySelectorAll('main > .btn-primary');

  console.log('Found demo buttons:', demoButtons.length);

  if (isLoggedIn()) {
    // Show logout page
    const credentials = getCredentials();
    if (heading) heading.textContent = 'Logout';
    
    if (loginContent) {
      loginContent.innerHTML = `
        <div class="about-message">
          <p style="margin-bottom: 1.5rem; font-size: 1.1rem;">You are currently logged in as <strong>${credentials.type}</strong>.</p>
          <button class="btn btn-primary" id="logout-btn">Logout</button>
        </div>
      `;
      
      document.getElementById('logout-btn').addEventListener('click', handleLogout);
    }

    // Hide demo buttons
    demoButtons.forEach(btn => btn.style.display = 'none');
  } else {
    // Show login page
    if (heading) heading.textContent = 'Login';
    
    // Add click handlers to demo buttons (only the [DEMO] ones)
    demoButtons.forEach(btn => {
      const text = btn.textContent;
      console.log('Adding handler to button:', text);
      
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Button clicked:', text);
        
        if (text.includes('Quality Inspector')) {
          handleLogin('Quality Inspector');
        } else if (text.includes('Engineer')) {
          handleLogin('Engineer');
        } else if (text.includes('Purchasing Inspector')) {
          handleLogin('Purchasing Inspector');
        }
      });
    });
  }
}

// Run check on page load
(function() {
  function init() {
    updateNavbarLoginLink();
    updateLoginPage();
  }

  // Run immediately if DOM is already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();