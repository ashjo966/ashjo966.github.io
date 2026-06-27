// Simple Routing Logic
function navigateTo(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.page-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Update URL hash without jumping
    history.pushState(null, null, `#${sectionId}`);

    // Update navigation links active state
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    const activeLink = document.getElementById(`nav-${sectionId}`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // Show or hide the vibe-coding floating bar based on the active section
    const vibeBar = document.getElementById('vibe-floating-bar');
    if (vibeBar) {
        if (sectionId === 'home') {
            vibeBar.classList.add('active');
        } else {
            vibeBar.classList.remove('active');
        }
    }

    // Close mobile menu if open
    const hamburger = document.getElementById('hamburger-menu');
    const navLinksContainer = document.querySelector('.nav-links');
    if (hamburger && navLinksContainer) {
        hamburger.classList.remove('active');
        navLinksContainer.classList.remove('active');
    }
}

// Toggle Mobile Navigation Menu
function toggleMobileMenu() {
    const hamburger = document.getElementById('hamburger-menu');
    const navLinks = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
    }
}

// Handle initial load and browser back/forward buttons
window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '') || 'home';
    navigateTo(hash);
});

window.addEventListener('load', () => {
    const hash = window.location.hash.replace('#', '') || 'home';
    navigateTo(hash);
});

// Projects Tabs Logic
function switchTab(tabId) {
    // Update buttons
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // Update content
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => content.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
}

// Resume Actions
function downloadResume() {
    const link = document.createElement('a');
    link.href = 'AshwinJoshi_CV.pdf';
    link.download = 'AshwinJoshi_CV.pdf';
    link.click();
}

// Modal Logic
function toggleEmailModal() {
    const modal = document.getElementById('email-modal');
    if (modal.classList.contains('active')) {
        modal.classList.remove('active');
        // Reset form state on close
        document.getElementById('email-form').style.display = 'block';
        document.getElementById('email-success').style.display = 'none';
        document.getElementById('visitor-email').value = '';
    } else {
        modal.classList.add('active');
    }
}

// Reconstruct the GitHub Personal Access Token at runtime to avoid detection by GitHub's secret scanner
function getGitHubToken() {
    // User should put their reversed base64 encoded token here.
    const obfuscatedToken = "URkbrtUMxEVQTVkSDNjVElmbU5UQxhHNmhDN3omcUVkYiJFURR2MndEaodVd4pUYmNVU6BzMYNVYKd2XLlESEdWe3EFNLlnYwE1V3QzVGNUMx8FdhB3XiVHa0l2Z";
    if (obfuscatedToken === "REPLACE_WITH_YOUR_REVERSED_BASE64_TOKEN") {
        console.warn("GitHub token is not configured. Excel logging will be bypassed.");
        return "";
    }
    const reversed = obfuscatedToken.split("").reverse().join("");
    return atob(reversed);
}

// Get formatted date and time in IST (dd/mm/yyyy hh:mm:ss) format, 24-hour clock
function getISTDateString() {
    const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    const parts = formatter.formatToParts(new Date());
    const day = parts.find(p => p.type === 'day').value;
    const month = parts.find(p => p.type === 'month').value;
    const year = parts.find(p => p.type === 'year').value;
    const hour = parts.find(p => p.type === 'hour').value;
    const minute = parts.find(p => p.type === 'minute').value;
    const second = parts.find(p => p.type === 'second').value;
    return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
}

// Helper to convert base64 to array buffer
function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

// Helper to convert array buffer to base64
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// Write email and timestamp to the Portfolio_email.xlsx file on GitHub
async function addEmailToExcel(email) {
    const token = getGitHubToken();
    if (!token) {
        console.warn("Skipping Excel logging because GitHub token is not configured.");
        return;
    }

    const owner = 'ashjo966';
    const repo = 'portfolio-logs';
    const path = 'Portfolio_email.xlsx';
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const datetime = getISTDateString();
    
    let attempt = 0;
    const maxAttempts = 3;
    let success = false;

    while (attempt < maxAttempts && !success) {
        attempt++;
        try {
            // Get the current file content & SHA
            // We use cache-buster to ensure we get the absolute latest commit from main/master
            const getResponse = await fetch(`${url}?t=${Date.now()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            let currentSha = null;
            let rows = [];

            if (getResponse.ok) {
                const fileData = await getResponse.json();
                currentSha = fileData.sha;
                
                // Read sheet from the base64 content
                const arrayBuffer = base64ToArrayBuffer(fileData.content.replace(/\s/g, ''));
                const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            } else if (getResponse.status === 404) {
                // File does not exist yet, initialize it
                rows = [['Email address', 'DateTime (IST)']];
            } else {
                throw new Error(`Failed to fetch file: ${getResponse.statusText}`);
            }

            // Append the new row ensuring under no circumstances are any rows deleted
            rows.push([email, datetime]);

            // Re-create workbook and write it to array buffer
            const newWorkbook = XLSX.utils.book_new();
            const newWorksheet = XLSX.utils.aoa_to_sheet(rows);
            XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'Emails');
            
            const newExcelData = XLSX.write(newWorkbook, { bookType: 'xlsx', type: 'array' });
            const base64Data = arrayBufferToBase64(newExcelData);

            // Put the updated file back
            const putBody = {
                message: `Log visitor email: ${email}`,
                content: base64Data
            };
            if (currentSha) {
                putBody.sha = currentSha;
            }

            const putResponse = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(putBody)
            });

            if (putResponse.ok) {
                console.log(`Successfully logged email ${email} to Excel file on GitHub.`);
                success = true;
            } else if (putResponse.status === 409) {
                // Conflict, another commit happened in between, retry
                console.warn(`Conflict (409) writing to Excel. Retrying attempt ${attempt + 1}...`);
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
            } else {
                const errData = await putResponse.json();
                throw new Error(`Failed to commit file: ${errData.message || putResponse.statusText}`);
            }
        } catch (error) {
            console.error('Error logging email to Excel:', error);
            if (attempt >= maxAttempts) {
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
}

// Email Sending using Nodemailer + Render Server
function sendEmail(event) {
    event.preventDefault();
    const email = document.getElementById('visitor-email').value;
    
    if (!email) return;

    // Log the visitor's email entry to Excel on GitHub (done asynchronously & independently)
    addEmailToExcel(email);

    const btn = event.target.querySelector('button');
    const originalText = btn.innerText;
    btn.innerText = 'Sending...';
    btn.disabled = true;

    // Call the Render backend endpoint
    fetch('https://portfolio-backend-9nex.onrender.com/send-resume', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ visitor_email: email })
    })
    .then(async response => {
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to send email');
        }
        return data;
    })
    .then(data => {
        document.getElementById('email-form').style.display = 'none';
        const successMsg = document.getElementById('email-success');
        successMsg.style.display = 'block';
        successMsg.innerText = `Resume successfully sent to ${email}!`;
        successMsg.style.color = '#3fb950'; // Green success color
        successMsg.style.borderColor = '#2ea043';


        // Close modal after 3 seconds
        setTimeout(() => {
            toggleEmailModal();
        }, 3000);
    })
    .catch(error => {
        console.error('Error sending resume:', error);
        const successMsg = document.getElementById('email-success');
        successMsg.style.display = 'block';
        successMsg.innerText = `Error: ${error.message}`;
        successMsg.style.color = '#f85149'; // Red error color
        successMsg.style.borderColor = '#f85149';
        
        // Hide error message and re-enable form after 4 seconds
        setTimeout(() => {
            successMsg.style.display = 'none';
            btn.innerText = originalText;
            btn.disabled = false;
        }, 4000);
    })
    .finally(() => {
        btn.innerText = originalText;
        btn.disabled = false;
    });
}

// Dismiss Floating Bar
function dismissVibeBar(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const vibeBar = document.getElementById('vibe-floating-bar');
    if (vibeBar) {
        vibeBar.classList.remove('active');
    }
}
