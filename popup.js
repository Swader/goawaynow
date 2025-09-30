let isRunning = false;

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const usernamesTextarea = document.getElementById('usernames');
const delayInput = document.getElementById('delay');
const status = document.getElementById('status');

// Load saved data
chrome.storage.local.get(['usernames', 'delay'], (result) => {
  if (result.usernames) {
    usernamesTextarea.value = result.usernames;
  }
  if (result.delay) {
    delayInput.value = result.delay;
  }
});

// Save on change
usernamesTextarea.addEventListener('input', () => {
  chrome.storage.local.set({ usernames: usernamesTextarea.value });
});

delayInput.addEventListener('input', () => {
  chrome.storage.local.set({ delay: delayInput.value });
});

startBtn.addEventListener('click', async () => {
  const usernames = usernamesTextarea.value
    .split('\n')
    .map(u => u.trim().replace(/^@/, '')) // Remove leading @ if present
    .filter(u => u.length > 0);

  if (usernames.length === 0) {
    showStatus('Please enter at least one username', 'error');
    return;
  }

  const delay = parseInt(delayInput.value) || 2000;

  // Get active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab.url.includes('x.com') && !tab.url.includes('twitter.com')) {
    showStatus('Please navigate to x.com first', 'error');
    return;
  }

  isRunning = true;
  startBtn.disabled = true;
  stopBtn.style.display = 'inline-block';
  usernamesTextarea.disabled = true;
  delayInput.disabled = true;

  showStatus(`Starting removal for ${usernames.length} users...`, 'info');

  // Process users one by one, with popup controlling navigation
  processUsers(tab.id, usernames, delay);
});

stopBtn.addEventListener('click', () => {
  isRunning = false;
  resetUI();
  showStatus('Stopped by user', 'info');
});

async function processUsers(tabId, usernames, delay) {
  let success = 0;
  let failed = 0;
  let skipped = 0; // Not followers

  for (let i = 0; i < usernames.length; i++) {
    if (!isRunning) {
      showStatus('Stopped by user', 'info');
      return;
    }

    const username = usernames[i];
    showStatus(`Processing ${i + 1} of ${usernames.length}: @${username}`, 'info');

    try {
      // Navigate to profile
      await chrome.tabs.update(tabId, { url: `https://x.com/${username}` });
      
      // Wait for page to load
      await sleep(delay);

      // Tell content script to perform the removal
      const response = await chrome.tabs.sendMessage(tabId, {
        action: 'removeCurrentProfile'
      });

      if (response && response.success) {
        success++;
      } else if (response && response.reason === 'not_follower') {
        skipped++;
        console.log(`${username} is not a follower (skipped)`);
      } else {
        failed++;
        console.error(`Failed to remove ${username}:`, response?.reason || 'unknown');
      }

      // Wait before next user
      await sleep(Math.max(delay, 1000));
    } catch (error) {
      console.error(`Error processing ${username}:`, error);
      failed++;
    }
  }

  const message = `Completed! Removed: ${success}, Not followers: ${skipped}, Failed: ${failed}`;
  showStatus(message, 'success');
  resetUI();
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'stopped') {
    isRunning = false;
    resetUI();
  }
});

function showStatus(message, type) {
  status.textContent = message;
  status.className = type;
}

function resetUI() {
  isRunning = false;
  startBtn.disabled = false;
  stopBtn.style.display = 'none';
  usernamesTextarea.disabled = false;
  delayInput.disabled = false;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}