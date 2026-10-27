(() => {
    "use strict";

    /*
     * SudanTrip
     * trips.js
     *
     * مسؤول عن:
     * 1. قراءة بيانات البحث.
     * 2. تحميل الرحلات.
     * 3. تصفية الرحلات حسب المدينة والتاريخ.
     * 4. عرض الرحلات.
     * 5. اختيار الرحلة وحفظها.
     * 6. الانتقال إلى صفحة اختيار المقاعد.
     */

    const STORAGE_KEYS = {
        search: "sudantrip_search",
        trips: "sudantrip_trips",
        selectedTrip: "sudantrip_selected_trip"
    };

    const DEMO_TRIPS = [
        {
            id: "TRIP-001",
            from: "الخرطوم",
            to: "مدني",
            departure: "07:00",
            arrival: "10:30",
            price: 15000,
            company: "سودان ترافل",
            bus: "باص VIP",
            totalSeats: 40,
            availableSeats: 40,
            status: "active"
        },
        {
            id: "TRIP-002",
            from: "الخرطوم",
            to: "مدني",
            departure: "10:00",
            arrival: "13:30",
            price: 20000,
            company: "النيل للنقل",
            bus: "باص سياحي",
            totalSeats: 40,
            availableSeats: 30,
            status: "active"
        },
        {
            id: "TRIP-003",
            from: "الخرطوم",
            to: "مدني",
            departure: "14:00",
            arrival: "17:30",
            price: 15000,
            company: "سودان ترافل",
            bus: "باص VIP",
            totalSeats: 45,
            availableSeats: 45,
            status: "active"
        },
        {
            id: "TRIP-004",
            from: "مدني",
            to: "الخرطوم",
            departure: "08:00",
            arrival: "11:30",
            price: 15000,
            company: "سودان ترافل",
            bus: "باص VIP",
            totalSeats: 40,
            availableSeats: 40,
            status: "active"
        },
        {
            id: "TRIP-005",
            from: "مدني",
            to: "الدويم",
            departure: "09:00",
            arrival: "13:00",
            price: 18000,
            company: "النيل للنقل",
            bus: "باص سياحي",
            totalSeats: 40,
            availableSeats: 35,
            status: "active"
        },
        {
            id: "TRIP-006",
            from: "الخرطوم",
            to: "القضارف",
            departure: "06:30",
            arrival: "11:30",
            price: 22000,
            company: "شرق السودان للنقل",
            bus: "باص VIP",
            totalSeats: 40,
            availableSeats: 40,
            status: "active"
        }
    ];

    function getStorage(key, fallback = null) {
        try {
            const value = localStorage.getItem(key);

            if (value === null) {
                return fallback;
            }

            return JSON.parse(value);
        } catch (error) {
            console.error(`SudanTrip Storage Error [${key}]:`, error);
            return fallback;
        }
    }

    function setStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`SudanTrip Storage Save Error [${key}]:`, error);
            return false;
        }
    }

    function getSearchData() {
        return getStorage(STORAGE_KEYS.search, null);
    }

    function initializeTrips() {
        const existingTrips = getStorage(STORAGE_KEYS.trips, null);

        if (!Array.isArray(existingTrips) || existingTrips.length === 0) {
            setStorage(STORAGE_KEYS.trips, DEMO_TRIPS);
            return DEMO_TRIPS;
        }

        return existingTrips;
    }

    function normalize(value) {
        return String(value ?? "")
            .trim()
            .toLowerCase();
    }

    function formatPrice(price) {
        const number = Number(price) || 0;

        return new Intl.NumberFormat("ar-SD").format(number) + " جنيه";
    }

    function getDateText(dateValue) {
        if (!dateValue) {
            return "غير محدد";
        }

        try {
            const date = new Date(`${dateValue}T00:00:00`);

            if (Number.isNaN(date.getTime())) {
                return dateValue;
            }

            return date.toLocaleDateString("ar-SD", {
                year: "numeric",
                month: "long",
                day: "numeric"
            });
        } catch (error) {
            return dateValue;
        }
    }

    function filterTrips(trips, search) {
        if (!search) {
            return [];
        }

        const from = normalize(search.from);
        const to = normalize(search.to);

        return trips.filter((trip) => {
            const tripFrom = normalize(trip.from);
            const tripTo = normalize(trip.to);

            const correctRoute =
                tripFrom === from &&
                tripTo === to;

            const availableSeats =
                Number(trip.availableSeats ?? trip.totalSeats ?? 0);

            const activeTrip =
                trip.status === undefined ||
                trip.status === "active";

            return (
                correctRoute &&
                availableSeats > 0 &&
                activeTrip
            );
        });
    }

    function updateSearchSummary(search, resultsCount) {
        const summary = document.getElementById("searchSummary");

        if (!summary) {
            return;
        }

        if (!search) {
            summary.innerHTML = `
                <div class="empty-state">
                    <h3>لم يتم العثور على بيانات البحث</h3>
                    <p>يرجى العودة إلى الصفحة الرئيسية والبحث عن رحلة.</p>
                    <a href="index.html" class="btn btn-primary">
                        العودة للرئيسية
                    </a>
                </div>
            `;
            return;
        }

        const dateText = getDateText(search.date);

        summary.innerHTML = `
            <div class="search-summary-content">
                <div>
                    <span class="summary-label">من</span>
                    <strong>${escapeHTML(search.from || "-")}</strong>
                </div>

                <div class="summary-arrow">←</div>

                <div>
                    <span class="summary-label">إلى</span>
                    <strong>${escapeHTML(search.to || "-")}</strong>
                </div>

                <div>
                    <span class="summary-label">التاريخ</span>
                    <strong>${escapeHTML(dateText)}</strong>
                </div>

                <div>
                    <span class="summary-label">المسافرون</span>
                    <strong>${Number(search.passengers) || 1}</strong>
                </div>

                <div>
                    <span class="summary-label">الرحلات المتاحة</span>
                    <strong>${resultsCount}</strong>
                </div>
            </div>
        `;
    }

    function renderNoTrips() {
        const container = document.getElementById("tripsList");

        if (!container) {
            return;
        }

        container.innerHTML = `
            <div class="empty-state no-trips">
                <div class="empty-state-icon">🚌</div>
                <h3>لا توجد رحلات متاحة</h3>
                <p>
                    لم نجد رحلة متاحة لهذا المسار في الوقت الحالي.
                    يمكنك العودة والبحث عن مسار آخر.
                </p>

                <a href="index.html#search" class="btn btn-primary">
                    بحث جديد
                </a>
            </div>
        `;
    }

    function renderTrips(trips, search) {
        const container = document.getElementById("tripsList");

        if (!container) {
            return;
        }

        if (!Array.isArray(trips) || trips.length === 0) {
            renderNoTrips();
            return;
        }

        container.innerHTML = trips.map((trip) => {
            const availableSeats =
                Number(trip.availableSeats ?? trip.totalSeats ?? 0);

            const totalSeats =
                Number(trip.totalSeats ?? availableSeats);

            const passengerCount =
                Number(search?.passengers) || 1;

            const canBook =
                availableSeats >= passengerCount;

            return `
                <article class="trip-card">
                    <div class="trip-card-main">

                        <div class="trip-route">
                            <div class="trip-location">
                                <span class="trip-time">
                                    ${escapeHTML(trip.departure || "--:--")}
                                </span>
                                <strong>
                                    ${escapeHTML(trip.from || "-")}
                                </strong>
                            </div>

                            <div class="trip-line">
                                <span class="trip-duration">
                                    رحلة
                                </span>
                                <span class="trip-line-arrow">→</span>
                            </div>

                            <div class="trip-location">
                                <span class="trip-time">
                                    ${escapeHTML(trip.arrival || "--:--")}
                                </span>
                                <strong>
                                    ${escapeHTML(trip.to || "-")}
                                </strong>
                            </div>
                        </div>

                        <div class="trip-details">

                            <div class="trip-detail">
                                <span>الشركة</span>
                                <strong>
                                    ${escapeHTML(trip.company || "غير محدد")}
                                </strong>
                            </div>

                            <div class="trip-detail">
                                <span>الحافلة</span>
                                <strong>
                                    ${escapeHTML(trip.bus || "غير محدد")}
                                </strong>
                            </div>

                            <div class="trip-detail">
                                <span>المقاعد</span>
                                <strong>
                                    ${availableSeats} / ${totalSeats}
                                </strong>
                            </div>

                            <div class="trip-detail trip-price">
                                <span>السعر للمسافر</span>
                                <strong>
                                    ${formatPrice(trip.price)}
                                </strong>
                            </div>

                        </div>
                    </div>

                    <div class="trip-card-action">

                        ${
                            canBook
                            ? `
                                <button
                                    type="button"
                                    class="btn btn-primary select-trip-btn"
                                    data-trip-id="${escapeHTML(trip.id)}"
                                >
                                    اختيار الرحلة
                                </button>
                            `
                            : `
                                <button
                                    type="button"
                                    class="btn btn-disabled"
                                    disabled
                                >
                                    المقاعد غير كافية
                                </button>
                            `
                        }

                        <span class="available-seats">
                            ${
                                availableSeats > 0
                                ? `متبقي ${availableSeats} مقعد`
                                : "لا توجد مقاعد"
                            }
                        </span>

                    </div>
                </article>
            `;
        }).join("");

        setupTripSelection(trips);
    }

    function setupTripSelection(trips) {
        const buttons = document.querySelectorAll(".select-trip-btn");

        buttons.forEach((button) => {
            button.addEventListener("click", () => {
                const tripId = button.dataset.tripId;

                if (!tripId) {
                    return;
                }

                const selectedTrip = trips.find(
                    (trip) => String(trip.id) === String(tripId)
                );

                if (!selectedTrip) {
                    showMessage(
                        "تعذر العثور على الرحلة المختارة. يرجى إعادة المحاولة.",
                        "error"
                    );
                    return;
                }

                const search = getSearchData();

                const passengerCount =
                    Number(search?.passengers) || 1;

                const availableSeats =
                    Number(
                        selectedTrip.availableSeats ??
                        selectedTrip.totalSeats ??
                        0
                    );

                if (availableSeats < passengerCount) {
                    showMessage(
                        "عدد المقاعد المتاحة أقل من عدد المسافرين.",
                        "error"
                    );
                    return;
                }

                const saved = setStorage(
                    STORAGE_KEYS.selectedTrip,
                    selectedTrip
                );

                if (!saved) {
                    showMessage(
                        "تعذر حفظ الرحلة المختارة. يرجى المحاولة مرة أخرى.",
                        "error"
                    );
                    return;
                }

                window.location.href = "seats.html";
            });
        });
    }

    function showMessage(message, type = "info") {
        const existing = document.getElementById("tripsPageMessage");

        if (existing) {
            existing.remove();
        }

        const messageBox = document.createElement("div");

        messageBox.id = "tripsPageMessage";
        messageBox.className = `page-message ${type}`;
        messageBox.textContent = message;

        const main =
            document.querySelector("main") ||
            document.body;

        main.insertBefore(
            messageBox,
            main.firstChild
        );

        window.setTimeout(() => {
            messageBox.remove();
        }, 5000);
    }

    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function initializeTripsPage() {
        const tripsList = document.getElementById("tripsList");

        if (!tripsList) {
            return;
        }

        const search = getSearchData();
        const allTrips = initializeTrips();
        const matchingTrips = filterTrips(allTrips, search);

        updateSearchSummary(
            search,
            matchingTrips.length
        );

        renderTrips(
            matchingTrips,
            search
        );
    }

    document.addEventListener(
        "DOMContentLoaded",
        initializeTripsPage
    );

})();