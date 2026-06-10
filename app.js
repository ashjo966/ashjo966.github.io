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
    link.href = 'Ashwin_CV.pdf';
    link.download = 'Ashwin_CV.pdf';
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

// Email Sending using Serverless Netlify Function & Resend
function sendEmail(event) {
    event.preventDefault();
    const email = document.getElementById('visitor-email').value;
    
    if (!email) return;

    const btn = event.target.querySelector('button');
    const originalText = btn.innerText;
    btn.innerText = 'Sending...';
    btn.disabled = true;

    // Call the serverless function endpoint
    fetch('/api/send-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email })
    })
    .then(async response => {
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to send email');
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

        // Save the email and current time in IST (local logs)
        const options = {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        };
        const formatter = new Intl.DateTimeFormat('en-GB', options);
        const formattedDate = formatter.format(new Date()).replace(',', '');
        
        const emailsList = JSON.parse(localStorage.getItem('resume_emails') || '[]');
        emailsList.push({ email: email, datetime: formattedDate });
        localStorage.setItem('resume_emails', JSON.stringify(emailsList));

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
