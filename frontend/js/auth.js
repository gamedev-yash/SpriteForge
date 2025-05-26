// Example usage: call register(), login(), logout(), or getProfile() from your UI

async function register(username, password) {
  const res = await fetch('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}

async function login(username, password) {
  const res = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}

async function logout() {
  const res = await fetch('/logout', { method: 'POST' });
  return res.json();
}

async function getProfile() {
  const res = await fetch('/profile');
  return res.json();
}

// Export functions if using modules
// export { register, login, logout, getProfile };