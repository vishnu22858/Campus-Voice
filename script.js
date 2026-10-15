
const newAnnouncement = document.getElementById("newAnnouncement");
const announcementForm = document.getElementById("announcementForm");
const form = document.getElementById("form");
const announcements = document.getElementById("announcements");
const cancel = document.getElementById("cancel");

const filterButtons = document.querySelectorAll(".filter-button");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const noResults = document.getElementById("noResults");

// Current category
let selectedCategory = "All";

// Read saved data safely from browser storage
function readStorage(key) {
    try {
        const savedData = JSON.parse(localStorage.getItem(key));
        return savedData && typeof savedData === "object"
            && !Array.isArray(savedData) ? savedData : {};
    } catch (error) {
        return {};
    }
}

let starCounts = readStorage("starCounts");
let starred = readStorage("starred");

// Show or hide the announcement form
newAnnouncement.addEventListener("click", function () {
    announcementForm.classList.toggle("hidden");
});

// Cancel the form
cancel.addEventListener("click", function () {
    announcementForm.classList.add("hidden");
    form.reset();
});

// Save star information
function saveStars() {
    try {
        localStorage.setItem("starCounts", JSON.stringify(starCounts));
        localStorage.setItem("starred", JSON.stringify(starred));
    } catch (error) {
        console.warn("Star information could not be saved.");
    }
}

// Add a star button to an announcement
function addStarButton(card) {
    const id = card.id;

    if (!id || card.querySelector(".star-button")) {
        return;
    }

    if (starCounts[id] === undefined) {
        starCounts[id] = 0;
    }

    const starButton = document.createElement("button");

    starButton.type = "button";
    starButton.className =
        "star-button mt-4 inline-flex items-center rounded-lg " +
        "border border-amber-200 bg-amber-50 px-3 py-2 " +
        "text-sm font-semibold text-amber-700 " +
        "hover:bg-amber-100 transition";

    function updateStarButton() {
        if (starred[id]) {
            starButton.textContent = "★ Starred (" + starCounts[id] + ")";
            starButton.setAttribute("aria-pressed", "true");
        } else {
            starButton.textContent = "☆ Star (" + starCounts[id] + ")";
            starButton.setAttribute("aria-pressed", "false");
        }
    }

    updateStarButton();

    starButton.addEventListener("click", function () {
        if (starred[id]) {
            starCounts[id] = Math.max(0, starCounts[id] - 1);
            delete starred[id];
        } else {
            starCounts[id]++;
            starred[id] = true;
        }

        saveStars();
        updateStarButton();
        renderAnnouncements();
    });

    card.appendChild(starButton);
}

// Add star buttons to existing announcements
document.querySelectorAll(".announcement").forEach(function (card) {
    addStarButton(card);
});

// Search, filter and sort announcements
function renderAnnouncements() {
    const cards = Array.from(
        document.querySelectorAll(".announcement")
    );

    const searchText = searchInput.value.trim().toLowerCase();
    const sortType = sortSelect.value;

    // Filter announcements by category and their actual content
    cards.forEach(function (card) {
        const category = card.dataset.category || "";

        const title = card.querySelector("h3")?.textContent || "";
        const description = Array.from(card.querySelectorAll("p"))
            .filter(function (paragraph) {
                return !paragraph.closest(".star-button");
            })
            .map(function (paragraph) {
                return paragraph.textContent;
            })
            .join(" ");

        const searchableText =
            (category + " " + title + " " + description).toLowerCase();

        const matchesCategory =
            selectedCategory === "All" ||
            category === selectedCategory;

        const matchesSearch = searchableText.includes(searchText);

        card.classList.toggle(
            "hidden",
            !(matchesCategory && matchesSearch)
        );
    });

    // Sort announcements
    cards.sort(function (a, b) {
        const titleA = a.querySelector("h3").textContent.trim();
        const titleB = b.querySelector("h3").textContent.trim();

        if (sortType === "az") {
            return titleA.localeCompare(titleB);
        }

        if (sortType === "za") {
            return titleB.localeCompare(titleA);
        }

        // Most starred first
        return (starCounts[b.id] || 0) - (starCounts[a.id] || 0);
    });

    // Put cards in their new order
    cards.forEach(function (card) {
        announcements.appendChild(card);
    });

    // Show a message if no announcements match
    const hasVisibleCards = cards.some(function (card) {
        return !card.classList.contains("hidden");
    });

    noResults.classList.toggle("hidden", hasVisibleCards);
}

// Category buttons
filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        selectedCategory = button.dataset.filter;

        filterButtons.forEach(function (btn) {
            const isSelected = btn === button;

            // Match the classes used in index.html
            btn.classList.toggle("bg-indigo-600", isSelected);
            btn.classList.toggle("text-white", isSelected);

            btn.classList.toggle("bg-slate-100", !isSelected);
            btn.classList.toggle("text-slate-700", !isSelected);
        });

        renderAnnouncements();
    });
});

// Search as the user types
searchInput.addEventListener("input", renderAnnouncements);

// Sort when the selection changes
sortSelect.addEventListener("change", renderAnnouncements);

// Format the date and time
function formatDate(dateValue) {
    const date = new Date(dateValue);

    return date.toLocaleString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    });
}

// Publish a new announcement
form.addEventListener("submit", function (event) {
    event.preventDefault();

    const category = document.getElementById("category").value;
    const title = document.getElementById("title").value.trim();
    const description = document.getElementById("description").value.trim();
    const date = document.getElementById("date").value;

    // Create the announcement card
    const card = document.createElement("section");

    card.id = "announcement-" + Date.now();
    card.dataset.category = category;

    card.className =
        "announcement bg-white p-6 rounded-2xl border " +
        "border-slate-200 shadow-sm hover:shadow-md " +
        "hover:border-indigo-200 transition duration-200";

    // Category badge
    const categoryText = document.createElement("p");

    categoryText.className =
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold";

    if (category === "Academic") {
        categoryText.classList.add("bg-blue-50", "text-blue-700");
    } else if (category === "Events") {
        categoryText.classList.add("bg-purple-50", "text-purple-700");
    } else if (category === "Placement") {
        categoryText.classList.add("bg-emerald-50", "text-emerald-700");
    }

    categoryText.textContent = category.toUpperCase();

    // Announcement title
    const titleText = document.createElement("h3");

    titleText.className = "text-lg font-bold mt-5 leading-snug";
    titleText.textContent = title;

    // Announcement description
    const descriptionText = document.createElement("p");

    descriptionText.className =
        "text-slate-700 text-base mt-3 leading-7";
    descriptionText.textContent = description;

    // Announcement date
    const dateText = document.createElement("p");

    dateText.className =
        "text-slate-500 text-xs border-t border-slate-100 mt-5 pt-4";
    dateText.textContent = formatDate(date);

    // Add content to the card
    card.append(
        categoryText,
        titleText,
        descriptionText,
        dateText
    );

    // Add the card and its star button
    announcements.prepend(card);
    addStarButton(card);

    // Reset the form and display all announcements
    form.reset();
    announcementForm.classList.add("hidden");
    searchInput.value = "";

    // Return to the All category
    const allButton = Array.from(filterButtons).find(function (button) {
        return button.dataset.filter === "All";
    });

    if (allButton) {
        allButton.click();
    } else {
        renderAnnouncements();
    }
});

// Set the initial order
renderAnnouncements();
