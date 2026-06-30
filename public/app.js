// --- Custom Toast Notification Helper ---
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Add toast content
    toast.innerHTML = `
        <span style="font-weight: 500;">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(toast);

    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s reverse forwards';
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 4000);
}

// --- Loading Button Helpers ---
function setButtonLoading(btnId, isLoading, defaultText = 'Submit') {
    const btn = document.getElementById(btnId);
    if (!btn) return;

    if (isLoading) {
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner"></span>`;
    } else {
        btn.disabled = false;
        btn.innerHTML = `<span>${defaultText}</span>`;
    }
}

// --- Sign-Up Handler ---
async function signup(event) {
    event.preventDefault();

    const form = event.target;
    const btnId = 'signupBtn';

    const data = {
        name: form.name.value,
        age: parseInt(form.age.value),
        location: form.location.value,
        email: form.email.value,
        password: form.password.value
    };

    setButtonLoading(btnId, true);

    try {
        const response = await fetch("http://localhost:3000/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();

        if (!response.ok) {
            showToast(result.message || "Failed to register.", "error");
            setButtonLoading(btnId, false, "Sign-Up");
            return;
        }

        showToast(result.message || "User Registered Successfully!", "success");
        form.reset();

        // Redirect after delay to let user see toast
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);

    } catch (err) {
        showToast(err.message || "Network error. Try again.", "error");
        setButtonLoading(btnId, false, "Sign-Up");
    }
}

// --- Login Handler ---
async function login(event) {
    event.preventDefault();

    const form = event.target;
    const btnId = 'loginBtn';

    const data = {
        email: form.loginEmail.value,
        password: form.loginPassword.value
    };

    setButtonLoading(btnId, true);

    try {
        const response = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();

        if (!response.ok) {
            showToast(result.message || "Invalid credentials.", "error");
            setButtonLoading(btnId, false, "Login");
            return;
        }

        localStorage.setItem("token", result.token);
        showToast(result.message || "Login Successful!", "success");
        form.reset();

        setTimeout(() => {
            window.location.href = "profile.html";
        }, 1200);

    } catch (err) {
        showToast(err.message || "Network error. Try again.", "error");
        setButtonLoading(btnId, false, "Login");
    }
}

// --- Load Profile ---
async function loadProfile() {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch("http://localhost:3000/user", { 
            headers: { Authorization: `Bearer ${token}` } 
        });

        const user = await response.json();

        if (!response.ok) {
            showToast(user.message || "Session expired.", "error");
            setTimeout(() => {
                localStorage.removeItem("token");
                window.location.href = "login.html";
            }, 1500);
            return;
        }

        // Set dynamic content in profile
        const profileDiv = document.getElementById("profile");
        if (profileDiv) {
            profileDiv.innerHTML = `
                <div class="profile-item">
                    <span class="profile-label">Name</span>
                    <span class="profile-value">${user.name}</span>
                </div>
                <div class="profile-item">
                    <span class="profile-label">Age</span>
                    <span class="profile-value">${user.age}</span>
                </div>
                <div class="profile-item">
                    <span class="profile-label">Email</span>
                    <span class="profile-value">${user.email}</span>
                </div>
                <div class="profile-item">
                    <span class="profile-label">Location</span>
                    <span class="profile-value">${user.location}</span>
                </div>
            `;
        }

        // Set avatar icon initial
        const avatar = document.getElementById("avatarIcon");
        if (avatar && user.name) {
            avatar.innerText = user.name.charAt(0).toUpperCase();
        }

        // Populate the update form
        const form = document.forms.updateForm;
        if (form) {
            form.name.value = user.name;
            form.age.value = user.age;
            form.location.value = user.location;
        }
    } catch (err) {
        showToast(err.message || "Failed to load profile.", "error");
    }
}

// --- Toggle Update Profile Form ---
function toggleEditForm() {
    const panel = document.getElementById("editFormPanel");
    if (panel) {
        panel.classList.toggle("open");
    }
}

// --- Update User ---
async function updateUser(event) {
    event.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const form = event.target;
    const btnId = 'updateBtn';

    const data = {
        name: form.name.value,
        age: parseInt(form.age.value),
        location: form.location.value
    };

    setButtonLoading(btnId, true);

    try {
        const response = await fetch("http://localhost:3000/user", {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            showToast(result.message || "Update failed.", "error");
            setButtonLoading(btnId, false, "Save Changes");
            return;
        }

        showToast(result.message || "Profile updated successfully!", "success");
        setButtonLoading(btnId, false, "Save Changes");
        
        await loadProfile();
    } catch (err) {
        showToast(err.message || "Network error.", "error");
        setButtonLoading(btnId, false, "Save Changes");
    }
}

// --- Delete Account Modal Handlers ---
function openDeleteModal() {
    const modal = document.getElementById("deleteModal");
    if (modal) {
        modal.classList.add("active");
    }
}

// --- Close Delete Modal ---
function closeDeleteModal() {
    const modal = document.getElementById("deleteModal");
    if (modal) {
        modal.classList.remove("active");
    }
}

// --- Confirm Delete User ---
async function confirmDeleteUser() {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const btnId = 'confirmDeleteBtn';
    setButtonLoading(btnId, true);

    try {
        const response = await fetch("http://localhost:3000/user", {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });

        const result = await response.json();

        if (!response.ok) {
            showToast(result.message || "Could not delete user.", "error");
            setButtonLoading(btnId, false, "Delete");
            closeDeleteModal();
            return;
        }

        showToast(result.message || "Account Deleted Successfully.", "success");
        
        // Clean up token and redirect
        localStorage.removeItem("token");
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);

    } catch (err) {
        showToast(err.message || "Network error.", "error");
        setButtonLoading(btnId, false, "Delete");
        closeDeleteModal();
    }
}

// --- Logout ---
function logout() {
    localStorage.removeItem("token");
    showToast("Logged out successfully.", "success");
    setTimeout(() => {
        window.location.href = "login.html";
    }, 1000);
}

// --- Theme Handling ---
function initTheme() {
    const savedTheme = localStorage.getItem("theme") || "dark";
    const btn = document.getElementById("themeToggleBtn");
    
    if (savedTheme === "light") {
        document.documentElement.classList.add("light-theme");
        document.body.classList.add("light-theme");
        if (btn) btn.innerHTML = "🌙";
    } else {
        document.documentElement.classList.remove("light-theme");
        document.body.classList.remove("light-theme");
        if (btn) btn.innerHTML = "☀️";
    }
}

function toggleTheme() {
    const btn = document.getElementById("themeToggleBtn");
    const isLight = document.body.classList.toggle("light-theme");
    document.documentElement.classList.toggle("light-theme", isLight);
    
    if (isLight) {
        localStorage.setItem("theme", "light");
        if (btn) btn.innerHTML = "🌙";
        showToast("Switched to Light theme", "info");
    } else {
        localStorage.setItem("theme", "dark");
        if (btn) btn.innerHTML = "☀️";
        showToast("Switched to Dark theme", "info");
    }
}
