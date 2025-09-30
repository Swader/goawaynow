chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'removeCurrentProfile') {
    removeFollower()
      .then(result => {
        sendResponse(result);
      })
      .catch(error => {
        console.error('Error removing follower:', error);
        sendResponse({ success: false, reason: 'exception', error: error.message });
      });
    return true; // Keep message channel open for async response
  }
});

async function removeFollower() {
  try {
    // Wait for page to be ready
    await waitForElement('[data-testid="primaryColumn"]', 5000);
    await sleep(500);

    // Click the "..." button (more options)
    const moreButton = await findMoreButton();
    if (!moreButton) {
      console.error('Could not find more button');
      return { success: false, reason: 'no_more_button' };
    }

    moreButton.click();
    await sleep(800);

    // Verify the menu actually has "Remove this follower" option
    const hasRemoveOption = await verifyRemoveOptionExists();
    if (!hasRemoveOption) {
      console.log('Profile does not have "Remove this follower" option - likely not a follower');
      // Close menu by pressing Escape
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      return { success: false, reason: 'not_follower' };
    }

    // Click "Remove this follower" option
    const removeOption = await findRemoveOption();
    if (!removeOption) {
      console.error('Could not find remove option');
      // Try to close menu by pressing Escape
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      return { success: false, reason: 'no_remove_option' };
    }

    removeOption.click();
    await sleep(800);

    // Click confirm button
    const confirmButton = await findConfirmButton();
    if (!confirmButton) {
      console.error('Could not find confirm button');
      return { success: false, reason: 'no_confirm_button' };
    }

    confirmButton.click();
    await sleep(500);

    return { success: true };
  } catch (error) {
    console.error('Error in removeFollower:', error);
    return { success: false, reason: 'exception', error: error.message };
  }
}

function findMoreButton() {
  // Most reliable: Find More button on profile (not in nav sidebar)
  // It should be near Follow/Following button and not inside navigation
  const profileMoreBtn = Array.from(document.querySelectorAll('button[aria-label="More"]'))
    .find(btn => !btn.closest('nav[role="navigation"]') && 
                 btn.closest('div')?.querySelector('button[aria-label*="Follow"]'));
  
  if (profileMoreBtn) return profileMoreBtn;

  // Fallback: XPath to specific location
  const xpath = '//*[@id="react-root"]/div/div/div[2]/main/div/div/div/div[1]/div/div[3]/div/div/div[1]/div[2]/div[1]/div[2]/button[1]';
  let button = getElementByXPath(xpath);
  
  if (button) return button;

  // Last resort: More button in main content area (not in nav)
  const mainButtons = document.querySelectorAll('main button[aria-label*="More"]');
  if (mainButtons.length > 0) return mainButtons[0];

  return null;
}

function verifyRemoveOptionExists() {
  // Check if the opened menu contains "Remove this follower" text
  return new Promise((resolve) => {
    // Give menu a moment to fully render
    setTimeout(() => {
      const menuItems = document.querySelectorAll('[role="menuitem"]');
      for (const item of menuItems) {
        const text = item.textContent.replace(/\s+/g, ' ').trim().toLowerCase();
        if (text.includes('remove this follower')) {
          resolve(true);
          return;
        }
      }
      resolve(false);
    }, 300);
  });
}

function findRemoveOption() {
  // Ultra-robust: Search all menu items for exact text match
  const removeFollowerOption = Array.from(document.querySelectorAll('[role="menuitem"]'))
    .find(item => {
      const text = item.textContent.replace(/\s+/g, ' ').trim().toLowerCase();
      return text.includes('remove this follower');
    });

  if (removeFollowerOption) {
    return removeFollowerOption;
  }

  // Fallback: Try XPath (though less reliable)
  const xpath = '//*[@id="layers"]/div[2]/div/div/div/div[2]/div/div[3]/div/div/div/div[4]';
  let element = getElementByXPath(xpath);
  
  if (element) {
    // Verify it contains the right text before returning
    const text = element.textContent.toLowerCase();
    if (text.includes('remove') && text.includes('follower')) {
      return element;
    }
  }

  // Last resort: search in all clickable divs with the exact text
  const allDivs = document.querySelectorAll('[role="menu"] div[tabindex="0"], [role="menu"] div[role="menuitem"]');
  for (const div of allDivs) {
    const text = div.textContent.replace(/\s+/g, ' ').trim().toLowerCase();
    if (text.includes('remove this follower')) {
      return div;
    }
  }

  console.warn('Remove this follower option not found in menu');
  return null;
}

function findConfirmButton() {
  // Try XPath first (points to div inside button)
  const xpath = '//*[@id="layers"]/div[2]/div/div/div/div/div/div[2]/div[2]/div[2]/button[1]';
  let button = getElementByXPath(xpath);
  
  if (button) return button;

  // Fallback: look for confirmation button with test id
  const confirmBtn = document.querySelector('button[data-testid*="confirmationSheetConfirm"]');
  if (confirmBtn) return confirmBtn;

  // Another fallback: find button with "Remove" text in a modal
  const modals = document.querySelectorAll('[role="dialog"], [role="alertdialog"]');
  for (const modal of modals) {
    const buttons = modal.querySelectorAll('button');
    for (const btn of buttons) {
      const text = btn.textContent.toLowerCase().trim();
      if (text === 'remove') {
        return btn;
      }
    }
  }

  // Last resort: any button with "Remove" in visible modal/overlay
  const overlayButtons = document.querySelectorAll('[id="layers"] button');
  for (const btn of overlayButtons) {
    const text = btn.textContent.toLowerCase().trim();
    if (text === 'remove') {
      return btn;
    }
  }

  return null;
}

function getElementByXPath(xpath) {
  try {
    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    return result.singleNodeValue;
  } catch (error) {
    console.error('XPath error:', error);
    return null;
  }
}

function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      resolve(null); // Resolve with null instead of rejecting
    }, timeout);
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}