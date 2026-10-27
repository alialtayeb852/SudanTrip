(() => {
    "use strict";

    const STORAGE_KEYS = {
        search: "sudantrip_search",
        trips: "sudantrip_trips",
        selectedTrip: "sudantrip_selected_trip",
        seatSelection: "sudantrip_seat_selection",
        bookings: "sudantrip_bookings",
        currentBooking: "sudantrip_current_booking"
    };

    /* =========================
       Storage Helpers
    ========================= */

    function getStorage(key, fallback = null) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : fallback;
        } catch (error) {
            console.error("Storage read error:", error);
            return fallback;
        }
    }

    function setStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error("Storage write error:", error);
            return false;
        }
    }

    function removeStorage(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error("Storage remove error:", error);
        }
    }

    /* =========================
       General Helpers
    ========================= */

    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatPrice(value) {
        const number = Number(value) || 0;
        return `${number.toLocaleString("ar-SD")} جنيه`;
    }

    function generateReference() {
        const now = new Date();

        const datePart =
            now.getFullYear().toString().slice(-2) +
            String(now.getMonth() + 1).padStart(2, "0") +
            String(now.getDate()).padStart(2, "0");

        const randomPart = Math.floor(1000 + Math.random() * 9000);

        return `ST-${datePart}-${randomPart}`;
    }

    function generateBookingId() {
        return `BOOK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }

    function showMessage(element, message, type = "info") {
        if (!element) return;

        element.textContent = message;
        element.className = `booking-message ${type}`;
        element.hidden = false;
    }

    function clearMessage(element) {
        if (!element) return;

        element.textContent = "";
        element.hidden = true;
        element.className = "booking-message";
    }

    /* =========================
       Validation
    ========================= */

    function isValidSudanPhone(phone) {
        const cleaned = String(phone || "")
            .replace(/\s+/g, "")
            .replace(/-/g, "");

        return /^(0(9|1)\d{8}|\+249(9|1)\d{8}|249(9|1)\d{8})$/.test(cleaned);
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            String(email || "").trim()
        );
    }

    function clearErrors() {
        const errorIds = [
            "passengerNameError",
            "phoneError",
            "emailError",
            "nationalityError",
            "termsError"
        ];

        errorIds.forEach((id) => {
            const element = document.getElementById(id);

            if (element) {
                element.textContent = "";
                element.hidden = true;
            }
        });
    }

    function setError(id, message) {
        const element = document.getElementById(id);

        if (!element) return;

        element.textContent = message;
        element.hidden = false;
    }

    /* =========================
       Load Booking Data
    ========================= */

    function getSelectedTrip() {
        return getStorage(STORAGE_KEYS.selectedTrip, null);
    }

    function getSearchData() {
        return getStorage(STORAGE_KEYS.search, null);
    }

    function getSeatSelection() {
        return getStorage(STORAGE_KEYS.seatSelection, null);
    }

    function getBookings() {
        return getStorage(STORAGE_KEYS.bookings, []);
    }

    function saveBookings(bookings) {
        return setStorage(STORAGE_KEYS.bookings, bookings);
    }

    /* =========================
       Booking Page
    ========================= */

    function renderBookingSummary() {
        const trip = getSelectedTrip();
        const search = getSearchData();
        const seatSelection = getSeatSelection();

        if (!trip) {
            showBookingPageMessage(
                "لم يتم العثور على الرحلة المحددة. الرجاء البحث عن رحلة واختيارها أولاً.",
                "error"
            );

            return false;
        }

        const bookingFrom = document.getElementById("bookingFrom");
        const bookingTo = document.getElementById("bookingTo");
        const bookingDate = document.getElementById("bookingDate");
        const bookingDeparture = document.getElementById("bookingDeparture");
        const bookingArrival = document.getElementById("bookingArrival");
        const bookingCompany = document.getElementById("bookingCompany");
        const bookingBus = document.getElementById("bookingBus");
        const bookingSeats = document.getElementById("bookingSeats");
        const bookingPassengers = document.getElementById("bookingPassengers");
        const bookingTotal = document.getElementById("bookingTotal");

        if (bookingFrom) {
            bookingFrom.textContent =
                trip.from || search?.from || "غير محدد";
        }

        if (bookingTo) {
            bookingTo.textContent =
                trip.to || search?.to || "غير محدد";
        }

        if (bookingDate) {
            bookingDate.textContent =
                search?.date ||
                trip.date ||
                "غير محدد";
        }

        if (bookingDeparture) {
            bookingDeparture.textContent =
                trip.departure || trip.departureTime || "غير محدد";
        }

        if (bookingArrival) {
            bookingArrival.textContent =
                trip.arrival || trip.arrivalTime || "غير محدد";
        }

        if (bookingCompany) {
            bookingCompany.textContent =
                trip.company || "SudanTrip";
        }

        if (bookingBus) {
            bookingBus.textContent =
                trip.bus || trip.busNumber || "غير محدد";
        }

        const seats =
            seatSelection?.seats ||
            trip.selectedSeats ||
            [];

        const passengers =
            Number(
                seatSelection?.passengers ||
                search?.passengers ||
                seats.length ||
                1
            );

        const total =
            Number(
                seatSelection?.total ||
                trip.price * passengers ||
                0
            );

        if (bookingSeats) {
            bookingSeats.textContent =
                seats.length > 0
                    ? seats.join("، ")
                    : "سيتم تحديد المقاعد";
        }

        if (bookingPassengers) {
            bookingPassengers.textContent = passengers;
        }

        if (bookingTotal) {
            bookingTotal.textContent = formatPrice(total);
        }

        return true;
    }

    function showBookingPageMessage(message, type = "info") {
        const element = document.getElementById("bookingMessage");

        if (element) {
            showMessage(element, message, type);
        }
    }

    /* =========================
       Create Booking
    ========================= */

    function createBooking() {
        const trip = getSelectedTrip();
        const search = getSearchData();
        const seatSelection = getSeatSelection();

        if (!trip) {
            showBookingPageMessage(
                "لا توجد رحلة محددة.",
                "error"
            );

            return null;
        }

        const passengerName =
            document.getElementById("passengerName")?.value.trim() || "";

        const phone =
            document.getElementById("phone")?.value.trim() || "";

        const email =
            document.getElementById("email")?.value.trim() || "";

        const nationality =
            document.getElementById("nationality")?.value || "";

        const notes =
            document.getElementById("notes")?.value.trim() || "";

        const seats =
            seatSelection?.seats ||
            [];

        const passengers =
            Number(
                seatSelection?.passengers ||
                search?.passengers ||
                seats.length ||
                1
            );

        const total =
            Number(
                seatSelection?.total ||
                trip.price * passengers ||
                0
            );

        const booking = {
            id: generateBookingId(),
            reference: generateReference(),

            status: "confirmed",

            createdAt: new Date().toISOString(),

            from:
                trip.from ||
                search?.from ||
                "",

            to:
                trip.to ||
                search?.to ||
                "",

            date:
                search?.date ||
                trip.date ||
                "",

            departure:
                trip.departure ||
                trip.departureTime ||
                "",

            arrival:
                trip.arrival ||
                trip.arrivalTime ||
                "",

            company:
                trip.company ||
                "SudanTrip",

            bus:
                trip.bus ||
                trip.busNumber ||
                "",

            tripId:
                trip.id ||
                trip.tripId ||
                "",

            seats: seats,

            passengers: passengers,

            total: total,

            passengerName: passengerName,

            phone: phone,

            email: email,

            nationality: nationality,

            notes: notes
        };

        return booking;
    }

    function updateTripAfterBooking(booking) {
        const trips = getStorage(STORAGE_KEYS.trips, []);

        if (!Array.isArray(trips) || !trips.length) {
            return true;
        }

        const bookingSeatsCount =
            Array.isArray(booking.seats)
                ? booking.seats.length
                : Number(booking.passengers) || 0;

        const tripIndex = trips.findIndex((trip) => {
            const tripId =
                trip.id ||
                trip.tripId ||
                "";

            return String(tripId) === String(booking.tripId);
        });

        if (tripIndex === -1) {
            return true;
        }

        const currentAvailable =
            Number(trips[tripIndex].availableSeats);

        if (Number.isNaN(currentAvailable)) {
            return true;
        }

        trips[tripIndex].availableSeats =
            Math.max(
                0,
                currentAvailable - bookingSeatsCount
            );

        return setStorage(
            STORAGE_KEYS.trips,
            trips
        );
    }

    function saveNewBooking(booking) {
        const bookings = getBookings();

        if (!Array.isArray(bookings)) {
            return false;
        }

        bookings.push(booking);

        const saved =
            saveBookings(bookings);

        if (!saved) {
            return false;
        }

        updateTripAfterBooking(booking);

        setStorage(
            STORAGE_KEYS.currentBooking,
            booking
        );

        return true;
    }

    /* =========================
       Booking Form Validation
    ========================= */

    function validateBookingForm() {
        clearErrors();

        let valid = true;

        const passengerName =
            document.getElementById("passengerName")?.value.trim() || "";

        const phone =
            document.getElementById("phone")?.value.trim() || "";

        const email =
            document.getElementById("email")?.value.trim() || "";

        const nationality =
            document.getElementById("nationality")?.value || "";

        const agreeTerms =
            document.getElementById("agreeTerms");

        if (passengerName.length < 3) {
            setError(
                "passengerNameError",
                "يرجى إدخال اسم المسافر بشكل صحيح."
            );

            valid = false;
        }

        if (!isValidSudanPhone(phone)) {
            setError(
                "phoneError",
                "يرجى إدخال رقم هاتف سوداني صحيح، مثال: 0912345678."
            );

            valid = false;
        }

        if (!isValidEmail(email)) {
            setError(
                "emailError",
                "يرجى إدخال بريد إلكتروني صحيح."
            );

            valid = false;
        }

        if (!nationality) {
            setError(
                "nationalityError",
                "يرجى اختيار الجنسية."
            );

            valid = false;
        }

        if (agreeTerms && !agreeTerms.checked) {
            setError(
                "termsError",
                "يجب الموافقة على الشروط والأحكام لإتمام الحجز."
            );

            valid = false;
        }

        return valid;
    }

    function handleBookingSubmit(event) {
        event.preventDefault();

        clearMessage(
            document.getElementById("bookingMessage")
        );

        if (!validateBookingForm()) {
            showBookingPageMessage(
                "يرجى تصحيح البيانات المطلوبة قبل تأكيد الحجز.",
                "error"
            );

            return;
        }

        const booking = createBooking();

        if (!booking) {
            return;
        }

        const saved = saveNewBooking(booking);

        if (!saved) {
            showBookingPageMessage(
                "حدث خطأ أثناء حفظ الحجز. يرجى المحاولة مرة أخرى.",
                "error"
            );

            return;
        }

        showBookingPageMessage(
            "تم تأكيد الحجز بنجاح. سيتم فتح التذكرة الآن.",
            "success"
        );

        setTimeout(() => {
            window.location.href = "ticket.html";
        }, 500);
    }

    function setupBookingForm() {
        const form =
            document.getElementById("bookingForm");

        if (!form) {
            return;
        }

        form.addEventListener(
            "submit",
            handleBookingSubmit
        );
    }

    /* =========================
       Manage Booking Page
    ========================= */

    function findBooking(email, phone) {
        const bookings = getBookings();

        if (!Array.isArray(bookings)) {
            return null;
        }

        const cleanEmail =
            String(email || "")
                .trim()
                .toLowerCase();

        const cleanPhone =
            String(phone || "")
                .replace(/\s+/g, "")
                .replace(/-/g, "");

        return (
            bookings
                .slice()
                .reverse()
                .find((booking) => {
                    const bookingEmail =
                        String(
                            booking.email || ""
                        )
                            .trim()
                            .toLowerCase();

                    const bookingPhone =
                        String(
                            booking.phone || ""
                        )
                            .replace(/\s+/g, "")
                            .replace(/-/g, "");

                    return (
                        bookingEmail === cleanEmail &&
                        bookingPhone === cleanPhone
                    );
                }) || null
        );
    }

    function renderManagedBooking(booking) {
        const managedBooking =
            document.getElementById("managedBooking");

        if (managedBooking) {
            managedBooking.hidden = false;
        }

        const fields = {
            managedBookingStatus:
                booking.status === "cancelled"
                    ? "ملغي"
                    : "مؤكد",

            managedBookingReference:
                booking.reference || "",

            managedFrom:
                booking.from || "",

            managedDeparture:
                booking.departure || "",

            managedTo:
                booking.to || "",

            managedArrival:
                booking.arrival || "",

            managedDate:
                booking.date || "",

            managedCompany:
                booking.company || "",

            managedBus:
                booking.bus || "",

            managedSeats:
                Array.isArray(booking.seats)
                    ? booking.seats.join("، ")
                    : "",

            managedPassengers:
                booking.passengers || "",

            managedTotal:
                formatPrice(booking.total),

            managedPassengerName:
                booking.passengerName || "",

            managedPassengerPhone:
                booking.phone || "",

            managedPassengerEmail:
                booking.email || "",

            managedNationality:
                booking.nationality || ""
        };

        Object.entries(fields).forEach(
            ([id, value]) => {
                const element =
                    document.getElementById(id);

                if (element) {
                    element.textContent = value;
                }
            }
        );

        const statusElement =
            document.getElementById(
                "managedBookingStatus"
            );

        if (statusElement) {
            statusElement.className =
                `booking-status ${
                    booking.status === "cancelled"
                        ? "cancelled"
                        : "confirmed"
                }`;
        }

        const cancelBox =
            document.getElementById(
                "cancelBookingBox"
            );

        if (cancelBox) {
            cancelBox.hidden =
                booking.status === "cancelled";
        }

        setStorage(
            STORAGE_KEYS.currentBooking,
            booking
        );
    }

    function handleFindBooking(event) {
        event.preventDefault();

        const email =
            document.getElementById(
                "bookingEmail"
            )?.value.trim() || "";

        const phone =
            document.getElementById(
                "bookingPhone"
            )?.value.trim() || "";

        const message =
            document.getElementById(
                "bookingManagementMessage"
            );

        const managedBooking =
            document.getElementById(
                "managedBooking"
            );

        if (managedBooking) {
            managedBooking.hidden = true;
        }

        if (!isValidEmail(email)) {
            showMessage(
                message,
                "يرجى إدخال بريد إلكتروني صحيح.",
                "error"
            );

            return;
        }

        if (!isValidSudanPhone(phone)) {
            showMessage(
                message,
                "يرجى إدخال رقم هاتف سوداني صحيح.",
                "error"
            );

            return;
        }

        const booking =
            findBooking(email, phone);

        if (!booking) {
            showMessage(
                message,
                "لم يتم العثور على حجز مطابق للبريد الإلكتروني ورقم الهاتف.",
                "error"
            );

            return;
        }

        clearMessage(message);

        renderManagedBooking(booking);
    }

    function setupManageBookingForm() {
        const form =
            document.getElementById(
                "manageBookingForm"
            );

        if (!form) {
            return;
        }

        form.addEventListener(
            "submit",
            handleFindBooking
        );
    }

    /* =========================
       Cancel Booking
    ========================= */

    function restoreTripSeats(booking) {
        const trips =
            getStorage(
                STORAGE_KEYS.trips,
                []
            );

        if (!Array.isArray(trips)) {
            return;
        }

        const tripIndex =
            trips.findIndex((trip) => {
                const tripId =
                    trip.id ||
                    trip.tripId ||
                    "";

                return (
                    String(tripId) ===
                    String(booking.tripId)
                );
            });

        if (tripIndex === -1) {
            return;
        }

        const seatsCount =
            Array.isArray(booking.seats)
                ? booking.seats.length
                : Number(booking.passengers) || 0;

        const currentAvailable =
            Number(
                trips[tripIndex].availableSeats
            );

        if (Number.isNaN(currentAvailable)) {
            return;
        }

        trips[tripIndex].availableSeats =
            currentAvailable + seatsCount;

        setStorage(
            STORAGE_KEYS.trips,
            trips
        );
    }

    function cancelCurrentBooking() {
        const currentBooking =
            getStorage(
                STORAGE_KEYS.currentBooking,
                null
            );

        const message =
            document.getElementById(
                "bookingManagementMessage"
            );

        if (!currentBooking) {
            showMessage(
                message,
                "لم يتم العثور على الحجز المطلوب.",
                "error"
            );

            return;
        }

        if (
            currentBooking.status ===
            "cancelled"
        ) {
            showMessage(
                message,
                "هذا الحجز ملغي بالفعل.",
                "info"
            );

            return;
        }

        const bookings =
            getBookings();

        const index =
            bookings.findIndex(
                (booking) =>
                    booking.id ===
                    currentBooking.id
            );

        if (index === -1) {
            showMessage(
                message,
                "تعذر العثور على الحجز.",
                "error"
            );

            return;
        }

        bookings[index].status =
            "cancelled";

        bookings[index].cancelledAt =
            new Date().toISOString();

        saveBookings(bookings);

        restoreTripSeats(
            bookings[index]
        );

        setStorage(
            STORAGE_KEYS.currentBooking,
            bookings[index]
        );

        renderManagedBooking(
            bookings[index]
        );

        showMessage(
            message,
            "تم إلغاء الحجز بنجاح.",
            "success"
        );
    }

    function setupCancelBooking() {
        const cancelButton =
            document.getElementById(
                "cancelBooking"
            );

        const confirmButton =
            document.getElementById(
                "confirmCancelBooking"
            );

        const closeButton =
            document.getElementById(
                "closeCancelBox"
            );

        const cancelBox =
            document.getElementById(
                "cancelBookingBox"
            );

        if (cancelButton && cancelBox) {
            cancelButton.addEventListener(
                "click",
                () => {
                    cancelBox.hidden = false;
                }
            );
        }

        if (closeButton && cancelBox) {
            closeButton.addEventListener(
                "click",
                () => {
                    cancelBox.hidden = true;
                }
            );
        }

        if (confirmButton) {
            confirmButton.addEventListener(
                "click",
                () => {
                    if (cancelBox) {
                        cancelBox.hidden = true;
                    }

                    cancelCurrentBooking();
                }
            );
        }
    }

    /* =========================
       Ticket Actions
    ========================= */

    function openCurrentBookingTicket() {
        const booking =
            getStorage(
                STORAGE_KEYS.currentBooking,
                null
            );

        if (!booking) {
            const message =
                document.getElementById(
                    "bookingManagementMessage"
                );

            showMessage(
                message,
                "لا توجد تذكرة متاحة لهذا الحجز.",
                "error"
            );

            return;
        }

        window.location.href =
            "ticket.html";
    }

    function setupTicketActions() {
        const printButton =
            document.getElementById(
                "printBookingTicket"
            );

        const downloadButton =
            document.getElementById(
                "downloadBookingPdf"
            );

        if (printButton) {
            printButton.addEventListener(
                "click",
                openCurrentBookingTicket
            );
        }

        if (downloadButton) {
            downloadButton.addEventListener(
                "click",
                openCurrentBookingTicket
            );
        }
    }

    /* =========================
       Initialize
    ========================= */

    function initializeBookingPage() {
        const bookingForm =
            document.getElementById(
                "bookingForm"
            );

        const manageForm =
            document.getElementById(
                "manageBookingForm"
            );

        if (bookingForm) {
            renderBookingSummary();
            setupBookingForm();
        }

        if (manageForm) {
            setupManageBookingForm();
            setupCancelBooking();
            setupTicketActions();
        }
    }

    document.addEventListener(
        "DOMContentLoaded",
        initializeBookingPage
    );

})();