(() => {
    "use strict";

    /*
     * SudanTrip
     * seats.js
     *
     * مسؤول عن:
     * 1. قراءة الرحلة المختارة.
     * 2. قراءة عدد المسافرين.
     * 3. إنشاء مخطط المقاعد.
     * 4. تحديد المقاعد المحجوزة.
     * 5. اختيار المقاعد.
     * 6. حساب إجمالي السعر.
     * 7. حفظ المقاعد المختارة.
     * 8. الانتقال إلى booking.html
     */

    const STORAGE_KEYS = {
        search: "sudantrip_search",
        trips: "sudantrip_trips",
        selectedTrip: "sudantrip_selected_trip",
        seatSelection: "sudantrip_seat_selection"
    };

    const DEMO_BOOKED_SEATS = [3, 8, 15, 22];

    let selectedTrip = null;
    let searchData = null;
    let selectedSeats = [];

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

    function removeStorage(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error(`SudanTrip Storage Remove Error [${key}]:`, error);
        }
    }

    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatPrice(value) {
        const price = Number(value) || 0;

        return new Intl.NumberFormat("ar-SD").format(price) + " جنيه";
    }

    function getPassengerCount() {
        const count = Number(searchData?.passengers);

        if (!Number.isFinite(count) || count < 1) {
            return 1;
        }

        return Math.min(Math.floor(count), 5);
    }

    function getTotalSeats() {
        const total = Number(
            selectedTrip?.totalSeats ??
            selectedTrip?.availableSeats ??
            40
        );

        if (!Number.isFinite(total) || total < 1) {
            return 40;
        }

        return Math.floor(total);
    }

    function getAvailableSeats() {
        const available = Number(
            selectedTrip?.availableSeats ??
            selectedTrip?.totalSeats ??
            40
        );

        if (!Number.isFinite(available) || available < 0) {
            return 0;
        }

        return Math.floor(available);
    }

    function getBookedSeats() {
        /*
         * المقاعد المحجوزة الحقيقية سيتم ربطها لاحقًا
         * بالحجوزات الموجودة في localStorage.
         *
         * في النسخة الحالية نستخدم بعض المقاعد التجريبية
         * حتى تظهر وظيفة اختيار المقاعد بشكل واقعي.
         */

        const booked = [...DEMO_BOOKED_SEATS];

        const bookings = getStorage(
            "sudantrip_bookings",
            []
        );

        if (!Array.isArray(bookings)) {
            return booked;
        }

        bookings.forEach((booking) => {
            const sameTrip =
                booking.tripId &&
                selectedTrip?.id &&
                String(booking.tripId) === String(selectedTrip.id);

            if (!sameTrip) {
                return;
            }

            let seats = booking.seats;

            if (typeof seats === "string") {
                seats = seats
                    .split(",")
                    .map((seat) => seat.trim());
            }

            if (!Array.isArray(seats)) {
                return;
            }

            seats.forEach((seat) => {
                const seatNumber = Number(
                    String(seat).replace(/\D/g, "")
                );

                if (
                    Number.isInteger(seatNumber) &&
                    seatNumber > 0 &&
                    !booked.includes(seatNumber)
                ) {
                    booked.push(seatNumber);
                }
            });
        });

        return booked.sort((a, b) => a - b);
    }

    function loadData() {
        selectedTrip = getStorage(
            STORAGE_KEYS.selectedTrip,
            null
        );

        searchData = getStorage(
            STORAGE_KEYS.search,
            null
        );

        if (!selectedTrip) {
            showPageError(
                "لم يتم اختيار رحلة.",
                "يرجى العودة إلى صفحة الرحلات واختيار رحلة أولاً."
            );

            return false;
        }

        if (!searchData) {
            showPageError(
                "بيانات البحث غير موجودة.",
                "يرجى العودة إلى الصفحة الرئيسية والبحث عن رحلة جديدة."
            );

            return false;
        }

        return true;
    }

    function showPageError(title, message) {
        const wrapper =
            document.querySelector(".seat-layout-wrapper") ||
            document.querySelector("main") ||
            document.body;

        wrapper.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🚌</div>

                <h2>${escapeHTML(title)}</h2>

                <p>
                    ${escapeHTML(message)}
                </p>

                <a
                    href="index.html"
                    class="btn btn-primary"
                >
                    العودة للرئيسية
                </a>

                <a
                    href="trips.html"
                    class="btn btn-secondary"
                >
                    العودة للرحلات
                </a>
            </div>
        `;
    }

    function renderTripInfo() {
        const tripInfo =
            document.getElementById("seatTripInfo");

        if (!tripInfo) {
            return;
        }

        tripInfo.innerHTML = `
            <div class="seat-trip-route">
                <div class="seat-route-location">
                    <span>من</span>
                    <strong>
                        ${escapeHTML(selectedTrip.from || "-")}
                    </strong>
                    <small>
                        ${escapeHTML(selectedTrip.departure || "--:--")}
                    </small>
                </div>

                <div class="seat-route-arrow">
                    →
                </div>

                <div class="seat-route-location">
                    <span>إلى</span>
                    <strong>
                        ${escapeHTML(selectedTrip.to || "-")}
                    </strong>
                    <small>
                        ${escapeHTML(selectedTrip.arrival || "--:--")}
                    </small>
                </div>
            </div>

            <div class="seat-trip-details">
                <div>
                    <span>الشركة</span>
                    <strong>
                        ${escapeHTML(selectedTrip.company || "-")}
                    </strong>
                </div>

                <div>
                    <span>الحافلة</span>
                    <strong>
                        ${escapeHTML(selectedTrip.bus || "-")}
                    </strong>
                </div>

                <div>
                    <span>السعر</span>
                    <strong>
                        ${formatPrice(selectedTrip.price)}
                    </strong>
                </div>

                <div>
                    <span>المسافرون</span>
                    <strong>
                        ${getPassengerCount()}
                    </strong>
                </div>
            </div>
        `;
    }

    function createSeatElement(seatNumber, bookedSeats) {
        const seat = document.createElement("button");

        seat.type = "button";
        seat.className = "seat";
        seat.dataset.seatNumber = String(seatNumber);
        seat.setAttribute(
            "aria-label",
            `المقعد رقم ${seatNumber}`
        );

        const isBooked =
            bookedSeats.includes(seatNumber);

        if (isBooked) {
            seat.classList.add("booked");
            seat.disabled = true;
            seat.setAttribute(
                "aria-label",
                `المقعد رقم ${seatNumber} محجوز`
            );
        }

        seat.innerHTML = `
            <span class="seat-number">
                ${seatNumber}
            </span>
        `;

        if (!isBooked) {
            seat.addEventListener(
                "click",
                () => toggleSeat(seatNumber, seat)
            );
        }

        return seat;
    }

    function renderSeats() {
        const container =
            document.getElementById("seatsContainer");

        if (!container) {
            return;
        }

        container.innerHTML = "";

        const totalSeats = getTotalSeats();
        const bookedSeats = getBookedSeats();

        /*
         * تخطيط الحافلة:
         *
         * [1] [2]   [3] [4]
         * [5] [6]   [7] [8]
         *
         * وهكذا.
         */

        for (
            let rowStart = 1;
            rowStart <= totalSeats;
            rowStart += 4
        ) {
            const row = document.createElement("div");

            row.className = "seat-row";

            const leftSide =
                document.createElement("div");

            leftSide.className = "seat-side";

            const aisle =
                document.createElement("div");

            aisle.className = "seat-aisle";

            const rightSide =
                document.createElement("div");

            rightSide.className = "seat-side";

            const firstSeat = rowStart;
            const secondSeat = rowStart + 1;
            const thirdSeat = rowStart + 2;
            const fourthSeat = rowStart + 3;

            if (firstSeat <= totalSeats) {
                leftSide.appendChild(
                    createSeatElement(
                        firstSeat,
                        bookedSeats
                    )
                );
            }

            if (secondSeat <= totalSeats) {
                leftSide.appendChild(
                    createSeatElement(
                        secondSeat,
                        bookedSeats
                    )
                );
            }

            if (thirdSeat <= totalSeats) {
                rightSide.appendChild(
                    createSeatElement(
                        thirdSeat,
                        bookedSeats
                    )
                );
            }

            if (fourthSeat <= totalSeats) {
                rightSide.appendChild(
                    createSeatElement(
                        fourthSeat,
                        bookedSeats
                    )
                );
            }

            row.appendChild(leftSide);
            row.appendChild(aisle);
            row.appendChild(rightSide);

            container.appendChild(row);
        }

        restoreSavedSeats();
        updateSelectionUI();
    }

    function toggleSeat(seatNumber, seatElement) {
        const passengerCount =
            getPassengerCount();

        const index =
            selectedSeats.indexOf(seatNumber);

        if (index !== -1) {
            selectedSeats.splice(index, 1);

            seatElement.classList.remove(
                "selected"
            );

            updateSelectionUI();

            return;
        }

        if (selectedSeats.length >= passengerCount) {
            showSeatMessage(
                `يمكنك اختيار ${passengerCount} مقعد${
                    passengerCount > 1 ? "ات" : ""
                } فقط حسب عدد المسافرين.`,
                "warning"
            );

            return;
        }

        selectedSeats.push(seatNumber);

        seatElement.classList.add("selected");

        updateSelectionUI();
    }

    function restoreSavedSeats() {
        const saved =
            getStorage(
                STORAGE_KEYS.seatSelection,
                null
            );

        if (!saved) {
            return;
        }

        if (
            !saved.tripId ||
            !selectedTrip?.id ||
            String(saved.tripId) !==
                String(selectedTrip.id)
        ) {
            return;
        }

        if (!Array.isArray(saved.seats)) {
            return;
        }

        const passengerCount =
            getPassengerCount();

        const bookedSeats =
            getBookedSeats();

        selectedSeats =
            saved.seats
                .map(Number)
                .filter(
                    (seat) =>
                        Number.isInteger(seat) &&
                        seat > 0 &&
                        !bookedSeats.includes(seat)
                )
                .slice(0, passengerCount);

        selectedSeats.forEach((seatNumber) => {
            const element =
                document.querySelector(
                    `.seat[data-seat-number="${seatNumber}"]`
                );

            if (element) {
                element.classList.add("selected");
            }
        });
    }

    function updateSelectionUI() {
        const passengerCount =
            getPassengerCount();

        const totalPrice =
            Number(selectedTrip?.price || 0) *
            selectedSeats.length;

        const selectedSeatsElement =
            document.getElementById(
                "selectedSeats"
            );

        const selectedCountElement =
            document.getElementById(
                "selectedSeatsCount"
            );

        const totalElement =
            document.getElementById(
                "seatsTotal"
            );

        const continueButton =
            document.getElementById(
                "continueToBooking"
            );

        if (selectedSeatsElement) {
            selectedSeatsElement.textContent =
                selectedSeats.length
                    ? selectedSeats
                        .slice()
                        .sort((a, b) => a - b)
                        .join("، ")
                    : "لم يتم اختيار أي مقعد";
        }

        if (selectedCountElement) {
            selectedCountElement.textContent =
                `${selectedSeats.length} / ${passengerCount}`;
        }

        if (totalElement) {
            totalElement.textContent =
                formatPrice(totalPrice);
        }

        if (continueButton) {
            const ready =
                selectedSeats.length ===
                passengerCount;

            continueButton.disabled = !ready;

            if (ready) {
                continueButton.classList.remove(
                    "btn-disabled"
                );
            } else {
                continueButton.classList.add(
                    "btn-disabled"
                );
            }
        }

        const counter =
            document.getElementById(
                "seatSelectionCounter"
            );

        if (counter) {
            counter.textContent =
                `تم اختيار ${selectedSeats.length} من ${passengerCount}`;
        }
    }

    function showSeatMessage(message, type = "info") {
        const oldMessage =
            document.getElementById(
                "seatPageMessage"
            );

        if (oldMessage) {
            oldMessage.remove();
        }

        const messageBox =
            document.createElement("div");

        messageBox.id = "seatPageMessage";
        messageBox.className =
            `page-message ${type}`;

        messageBox.textContent =
            message;

        const target =
            document.querySelector("main") ||
            document.body;

        target.insertBefore(
            messageBox,
            target.firstChild
        );

        window.setTimeout(() => {
            messageBox.remove();
        }, 4000);
    }

    function saveSeatSelection() {
        const passengerCount =
            getPassengerCount();

        if (
            selectedSeats.length !==
            passengerCount
        ) {
            showSeatMessage(
                `يرجى اختيار ${passengerCount} ${
                    passengerCount === 1
                        ? "مقعد"
                        : "مقاعد"
                } للمتابعة.`,
                "warning"
            );

            return false;
        }

        const seatSelection = {
            tripId: selectedTrip.id,
            seats: selectedSeats
                .slice()
                .sort((a, b) => a - b),
            passengers: passengerCount,
            total:
                Number(selectedTrip.price || 0) *
                selectedSeats.length
        };

        return setStorage(
            STORAGE_KEYS.seatSelection,
            seatSelection
        );
    }

    function setupContinueButton() {
        const button =
            document.getElementById(
                "continueToBooking"
            );

        if (!button) {
            return;
        }

        button.addEventListener(
            "click",
            () => {
                if (!saveSeatSelection()) {
                    showSeatMessage(
                        "تعذر حفظ اختيار المقاعد. حاول مرة أخرى.",
                        "error"
                    );

                    return;
                }

                window.location.href =
                    "booking.html";
            }
        );
    }

    function setupBackButton() {
        const buttons =
            document.querySelectorAll(
                "[data-seat-back]"
            );

        buttons.forEach((button) => {
            button.addEventListener(
                "click",
                () => {
                    window.location.href =
                        "trips.html";
                }
            );
        });
    }

    function clearInvalidOldSelection() {
        const saved =
            getStorage(
                STORAGE_KEYS.seatSelection,
                null
            );

        if (!saved) {
            return;
        }

        if (
            !selectedTrip?.id ||
            String(saved.tripId) !==
                String(selectedTrip.id)
        ) {
            removeStorage(
                STORAGE_KEYS.seatSelection
            );
        }
    }

    function initializeSeatsPage() {
        const seatsContainer =
            document.getElementById(
                "seatsContainer"
            );

        if (!seatsContainer) {
            return;
        }

        if (!loadData()) {
            return;
        }

        clearInvalidOldSelection();

        renderTripInfo();
        renderSeats();

        setupContinueButton();
        setupBackButton();
    }

    document.addEventListener(
        "DOMContentLoaded",
        initializeSeatsPage
    );

})();