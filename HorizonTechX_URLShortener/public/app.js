document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("shortener-form");
    const longUrlInput = document.getElementById("long-url");
    const submitBtn = document.getElementById("submit-btn");
    const statusMsg = document.getElementById("status-message");
    const resultArea = document.getElementById("result-area");
    const shortUrlInput = document.getElementById("short-url");
    const copyBtn = document.getElementById("copy-btn");
    const visitBtn = document.getElementById("visit-btn");
    const historyList = document.getElementById("history-list");
    const refreshBtn = document.getElementById("refresh-btn");
    const toastContainer = document.getElementById("toast-container");

    // Load URL history on startup
    fetchHistory();

    // Handle Form Submit
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const longUrl = longUrlInput.value.trim();
        if (!longUrl) return;

        // Clear previous states
        hideMessage();
        resultArea.classList.add("hidden");
        setLoadingState(true);

        try {
            const response = await fetch("/api/url/shorten", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ longUrl })
            });

            const data = await response.json();

            if (response.ok) {
                // Show result
                shortUrlInput.value = data.shortUrl;
                visitBtn.href = data.shortUrl;
                resultArea.classList.remove("hidden");
                
                // Show success status
                showMessage("Link shortened successfully!", "success");
                showToast("Success! Link shortened.");
                
                // Reset input
                longUrlInput.value = "";
                
                // Refresh list
                fetchHistory();
            } else {
                showMessage(data.error || "Something went wrong.", "error");
                showToast(data.error || "Failed to shorten link.", "danger");
            }
        } catch (err) {
            console.error("Shortening error:", err);
            showMessage("Could not connect to the server. Please check your network.", "error");
            showToast("Connection error.", "danger");
        } finally {
            setLoadingState(false);
        }
    });

    // Handle Copy to Clipboard
    copyBtn.addEventListener("click", () => {
        const shortUrl = shortUrlInput.value;
        if (!shortUrl) return;

        copyToClipboard(shortUrl);
    });

    // Handle Refresh Manual Trigger
    refreshBtn.addEventListener("click", () => {
        fetchHistory();
        showToast("History refreshed");
    });

    // Fetch History from API
    async function fetchHistory() {
        try {
            const response = await fetch("/api/url/history");
            const data = await response.json();

            if (response.ok) {
                renderHistory(data);
            } else {
                console.error("Failed to load history:", data.error);
            }
        } catch (err) {
            console.error("Error fetching history:", err);
        }
    }

    // Render History table rows
    function renderHistory(urls) {
        if (!urls || urls.length === 0) {
            historyList.innerHTML = `
                <tr class="empty-state">
                    <td colspan="5">
                        <i class="fa-regular fa-folder-open empty-icon"></i>
                        <p>No shortened links yet. Shorten your first link above!</p>
                    </td>
                </tr>
            `;
            return;
        }

        historyList.innerHTML = urls.map(url => {
            const formattedDate = new Date(url.date).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            return `
                <tr>
                    <td class="original-link-cell">
                        <a href="${url.longUrl}" target="_blank" title="${url.longUrl}">
                            ${escapeHtml(url.longUrl)}
                        </a>
                    </td>
                    <td class="short-link-cell">
                        <a href="${url.shortUrl}" target="_blank">${escapeHtml(url.shortUrl)}</a>
                    </td>
                    <td>
                        <span class="badge badge-clicks">
                            <i class="fa-solid fa-chart-simple" style="margin-right: 4px;"></i>
                            ${url.clicks} clicks
                        </span>
                    </td>
                    <td class="date-cell">${formattedDate}</td>
                    <td class="actions-cell">
                        <button class="btn btn-icon-only copy-row-btn" data-url="${url.shortUrl}" title="Copy Link">
                            <i class="fa-regular fa-copy"></i>
                        </button>
                        <a href="${url.shortUrl}" target="_blank" class="btn btn-icon-only" style="display: inline-flex; align-items: center; justify-content: center;" title="Visit Link">
                            <i class="fa-solid fa-up-right-from-square"></i>
                        </a>
                    </td>
                </tr>
            `;
        }).join("");

        // Attach copy events to individual rows
        document.querySelectorAll(".copy-row-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const targetUrl = btn.getAttribute("data-url");
                copyToClipboard(targetUrl);
            });
        });
    }

    // Helper functions
    function setLoadingState(isLoading) {
        if (isLoading) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span>Shortening...</span> <i class="fa-solid fa-spinner fa-spin"></i>`;
        } else {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<span>Shorten</span> <i class="fa-solid fa-arrow-right"></i>`;
        }
    }

    function showMessage(text, type) {
        statusMsg.textContent = text;
        statusMsg.className = `message ${type}`;
    }

    function hideMessage() {
        statusMsg.className = "message hidden";
        statusMsg.textContent = "";
    }

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            showToast("Copied to clipboard!");
            
            // Temporary button animation if it was the main copy button
            if (text === shortUrlInput.value) {
                const originalContent = copyBtn.innerHTML;
                copyBtn.innerHTML = `<i class="fa-solid fa-check" style="color: #10b981;"></i> <span>Copied</span>`;
                setTimeout(() => {
                    copyBtn.innerHTML = originalContent;
                }, 2000);
            }
        }).catch(err => {
            console.error("Clipboard copy failed:", err);
            showToast("Failed to copy link.", "danger");
        });
    }

    function showToast(message, type = "success") {
        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="${type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-triangle-exclamation'}"></i>
            <span>${message}</span>
        `;
        
        toastContainer.appendChild(toast);

        // Animate out and remove
        setTimeout(() => {
            toast.classList.add("toast-exit");
            toast.addEventListener("animationend", () => {
                toast.remove();
            });
        }, 3000);
    }

    function escapeHtml(string) {
        return String(string)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});
