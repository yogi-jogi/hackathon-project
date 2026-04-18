const API_BASE_URL =
    window.location.protocol === "file:"
        ? "http://localhost:5000"
        : `${window.location.protocol}//${window.location.hostname}:5000`;

const capsuleForm  = document.getElementById("capsuleForm");
const textInput    = document.getElementById("text");
const timeInput    = document.getElementById("time");
const createButton = document.getElementById("createButton");
const list         = document.getElementById("list");
const feedback     = document.getElementById("feedback");
const status       = document.getElementById("status");

// ── Helpers ──────────────────────────────────────────────────────────────────

function setFeedback(message, type = "") {
    feedback.textContent = message;
    feedback.className   = `feedback ${type}`.trim();
}

function formatDate(value) {
    return new Date(value).toLocaleString();
}

// ── Render ────────────────────────────────────────────────────────────────────

function renderCapsules(capsules) {
    if (!capsules.length) {
        list.innerHTML = '<p class="empty">No capsules yet. Create the first one.</p>';
        return;
    }

    const now = new Date();

    list.innerHTML = capsules
        .map((capsule) => {
            const unlockTime = new Date(capsule.unlockTime);
            const isUnlocked = now >= unlockTime;

            if (isUnlocked) {
                return `
                    <article class="card">
                        <strong>Unlocked</strong>
                        <p>${capsule.text}</p>
                        <div class="meta">Opened on ${formatDate(capsule.unlockTime)}</div>
                    </article>
                `;
            }

            return `
                <article class="card locked">
                    <strong>Locked</strong>
                    <p>This capsule will open later.</p>
                    <div class="meta">Unlocks at ${formatDate(capsule.unlockTime)}</div>
                </article>
            `;
        })
        .join("");
}

// ── API calls ─────────────────────────────────────────────────────────────────

async function loadStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);

        if (!response.ok) {
            throw new Error("Health check failed.");
        }

        const data     = await response.json();
        status.textContent = `Server ready. Storage: ${data.storage}.`;
    } catch {
        status.textContent = "Server unavailable. Start the backend on port 5000.";
    }
}

async function loadCapsules() {
    try {
        const response = await fetch(`${API_BASE_URL}/capsules`);

        if (!response.ok) {
            throw new Error("Failed to load capsules.");
        }

        const capsules = await response.json();
        renderCapsules(capsules);
    } catch {
        list.innerHTML = '<p class="empty">Could not load capsules. Check whether the backend is running.</p>';
    }
}

async function createCapsuleRequest(payload) {
    const response = await fetch(`${API_BASE_URL}/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || "Failed to create capsule.");
    }

    return result;
}

// ── Form handler ──────────────────────────────────────────────────────────────

async function createCapsule(event) {
    event.preventDefault();

    const text       = textInput.value.trim();
    const unlockTime = timeInput.value;

    if (!text || !unlockTime) {
        setFeedback("Please fill in both fields.", "error");
        return;
    }

    createButton.disabled = true;
    setFeedback("Saving capsule...");

    try {
        const result = await createCapsuleRequest({ text, unlockTime });

        textInput.value = "";
        timeInput.value = "";
        setFeedback(result.message || "Capsule created successfully.", "success");
        await loadCapsules();
    } catch (error) {
        setFeedback(error.message, "error");
    } finally {
        createButton.disabled = false;
    }
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

capsuleForm.addEventListener("submit", createCapsule);

loadStatus();
loadCapsules();
