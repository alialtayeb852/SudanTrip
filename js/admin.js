(() => {
    "use strict";

    /*
     * SudanTrip
     * Admin Panel JavaScript
     * ---------------------------------------
     * Handles:
     * - Admin login
     * - Dashboard
     * - Cities management
     * - Trips management
     * - Buses management
     * - Bookings management
     * - Users management
     * - Reports
     *
     * Storage is currently localStorage.
     * It can be replaced later with a real backend/database.
     */

    const STORAGE_KEYS = {
        cities: "sudantrip_cities",
        trips: "sudantrip_trips",
        buses: "sudantrip_buses",
        bookings: "sudantrip_bookings",
        users: "sudantrip_users",
        adminSession: "sudantrip_admin_session"
    };

    const DEFAULT_CITIES = [
        "الخرطوم",
        "مدني",
        "الدويم",
        "القضارف",
        "كسلا",
        "كوستي",
        "أم درمان",
        "بورتسودان",
        "سواكن",
        "نيالا",
        "الفاشر",
        "الجنينة",
        "زالنجي",
        "القطينة",
        "جبل أولياء",
        "ربك",
        "سنار",
        "المناقل"
    ];

    const DEFAULT_BUSES = [
        {
            id: "BUS-001",
            name: "حافلة 001",
            company: "سودان ترافل",
            seats: 40,
            type: "عادية",
            status: "active"
        },
        {
            id: "BUS-002",
            name: "حافلة 002",
            company: "سودان ترافل",
            seats: 30,
            type: "مميزة",
            status: "active"
        },
        {
            id: "BUS-003",
            name: "حافلة 003",
            company: "النيل للنقل",
            seats: 45,
            type: "عادية",
            status: "active"
        }
    ];

    /* =========================================================
       Storage Helpers
    ========================================================= */

    function getStorage(key, fallback) {
        try {
            const value = localStorage.getItem(key);

            if (value === null) {
                return fallback;
            }

            return JSON.parse(value);
        } catch (error) {
            console.error("SudanTrip storage read error:", error);
            return fallback;
        }
    }

    function setStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error("SudanTrip storage write error:", error);
            return false;
        }
    }

    function removeStorage(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error("SudanTrip storage remove error:", error);
        }
    }

    function getCities() {
        let cities = getStorage(STORAGE_KEYS.cities, []);

        if (!Array.isArray(cities) || cities.length === 0) {
            cities = [...DEFAULT_CITIES];
            setStorage(STORAGE_KEYS.cities, cities);
        }

        return cities;
    }

    function getTrips() {
        const trips = getStorage(STORAGE_KEYS.trips, []);
        return Array.isArray(trips) ? trips : [];
    }

    function getBuses() {
        let buses = getStorage(STORAGE_KEYS.buses, []);

        if (!Array.isArray(buses) || buses.length === 0) {
            buses = [...DEFAULT_BUSES];
            setStorage(STORAGE_KEYS.buses, buses);
        }

        return buses;
    }

    function getBookings() {
        const bookings = getStorage(STORAGE_KEYS.bookings, []);
        return Array.isArray(bookings) ? bookings : [];
    }

    function getUsers() {
        const users = getStorage(STORAGE_KEYS.users, []);
        return Array.isArray(users) ? users : [];
    }

    /* =========================================================
       General Helpers
    ========================================================= */

    function $(id) {
        return document.getElementById(id);
    }

    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function generateId(prefix) {
        return (
            prefix +
            "-" +
            Date.now().toString(36).toUpperCase() +
            "-" +
            Math.random().toString(36).substring(2, 7).toUpperCase()
        );
    }

    function formatPrice(value) {
        const number = Number(value) || 0;

        return new Intl.NumberFormat("ar-SD").format(number) + " جنيه";
    }

    function formatDate(dateValue) {
        if (!dateValue) {
            return "-";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return escapeHTML(dateValue);
        }

        return date.toLocaleDateString("ar-SD");
    }

    function todayString() {
        const now = new Date();

        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    function showMessage(element, message, type = "success") {
        if (!element) {
            return;
        }

        element.textContent = message;
        element.className = "admin-message " + type;
        element.style.display = "block";

        window.setTimeout(() => {
            element.style.display = "none";
        }, 4000);
    }

    function statusText(status) {
        const map = {
            active: "نشط",
            inactive: "غير نشط",
            cancelled: "ملغي",
            confirmed: "مؤكد",
            pending: "قيد الانتظار",
            completed: "مكتمل"
        };

        return map[status] || status || "-";
    }

    function statusClass(status) {
        const map = {
            active: "status-active",
            inactive: "status-inactive",
            cancelled: "status-cancelled",
            confirmed: "status-confirmed",
            pending: "status-pending",
            completed: "status-completed"
        };

        return map[status] || "";
    }

    function normalizePhone(phone) {
        return String(phone || "")
            .replace(/\s+/g, "")
            .replace(/-/g, "");
    }

    /* =========================================================
       Admin Session
    ========================================================= */

    function isAdminPage() {
        return window.location.pathname.includes("/admin/");
    }

    function isLoginPage() {
        return (
            window.location.pathname.endsWith("/admin/login.html") ||
            window.location.pathname.endsWith("/admin/")
        );
    }

    function getAdminSession() {
        return getStorage(STORAGE_KEYS.adminSession, null);
    }

    function isAdminLoggedIn() {
        const session = getAdminSession();

        return !!(
            session &&
            session.loggedIn === true &&
            session.role === "admin"
        );
    }

    function saveAdminSession(username) {
        return setStorage(STORAGE_KEYS.adminSession, {
            loggedIn: true,
            role: "admin",
            username: username || "admin",
            loginTime: new Date().toISOString()
        });
    }

    function logoutAdmin() {
        removeStorage(STORAGE_KEYS.adminSession);
        window.location.href = "login.html";
    }

    function setupAdminProtection() {
        if (!isAdminPage()) {
            return;
        }

        if (isLoginPage()) {
            if (isAdminLoggedIn()) {
                const dashboard =
                    window.location.pathname.endsWith("/admin/")
                        ? "dashboard.html"
                        : "dashboard.html";

                window.location.href = dashboard;
            }

            return;
        }

        if (!isAdminLoggedIn()) {
            window.location.href = "login.html";
        }
    }

    /* =========================================================
       Admin Login
    ========================================================= */

    function setupAdminLogin() {
        const form = $("adminLoginForm");

        if (!form) {
            return;
        }

        form.addEventListener("submit", function (event) {
            event.preventDefault();

            const usernameInput =
                $("adminUsername") ||
                $("username") ||
                $("loginUsername");

            const passwordInput =
                $("adminPassword") ||
                $("password") ||
                $("loginPassword");

            const message =
                $("adminLoginMessage") ||
                $("loginMessage");

            const username = usernameInput
                ? usernameInput.value.trim()
                : "";

            const password = passwordInput
                ? passwordInput.value
                : "";

            if (!username || !password) {
                showMessage(
                    message,
                    "يرجى إدخال اسم المستخدم وكلمة المرور.",
                    "error"
                );
                return;
            }

            /*
             * Demo admin credentials.
             *
             * Later, these should be replaced by a secure
             * backend authentication system.
             */
            const validUsername = "admin";
            const validPassword = "admin123";

            if (
                username === validUsername &&
                password === validPassword
            ) {
                saveAdminSession(username);

                showMessage(
                    message,
                    "تم تسجيل الدخول بنجاح.",
                    "success"
                );

                window.setTimeout(() => {
                    window.location.href = "dashboard.html";
                }, 500);

                return;
            }

            /*
             * Also allow an existing user marked as admin.
             */
            const users = getUsers();

            const adminUser = users.find((user) => {
                const userName =
                    user.username ||
                    user.email ||
                    user.name ||
                    "";

                return (
                    String(userName).toLowerCase() ===
                        username.toLowerCase() &&
                    user.password === password &&
                    (
                        user.role === "admin" ||
                        user.isAdmin === true
                    )
                );
            });

            if (adminUser) {
                saveAdminSession(
                    adminUser.username ||
                    adminUser.email ||
                    adminUser.name ||
                    username
                );

                showMessage(
                    message,
                    "تم تسجيل الدخول بنجاح.",
                    "success"
                );

                window.setTimeout(() => {
                    window.location.href = "dashboard.html";
                }, 500);

                return;
            }

            showMessage(
                message,
                "اسم المستخدم أو كلمة المرور غير صحيحة.",
                "error"
            );
        });
    }

    /* =========================================================
       Admin Navigation
    ========================================================= */

    function setupAdminLogout() {
        const buttons = document.querySelectorAll(
            "#adminLogout, #logoutAdmin, [data-admin-logout]"
        );

        buttons.forEach((button) => {
            button.addEventListener("click", function (event) {
                event.preventDefault();
                logoutAdmin();
            });
        });
    }

    function setupAdminUsername() {
        const session = getAdminSession();

        if (!session) {
            return;
        }

        const elements = document.querySelectorAll(
            "#adminUsernameDisplay, #currentAdminName, [data-admin-name]"
        );

        elements.forEach((element) => {
            element.textContent = session.username || "admin";
        });
    }

    /* =========================================================
       Cities
    ========================================================= */

    function renderCities() {
        const body =
            $("citiesTableBody") ||
            $("cityTableBody");

        if (!body) {
            return;
        }

        const cities = getCities();

        if (cities.length === 0) {
            body.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        لا توجد مدن حالياً.
                    </td>
                </tr>
            `;
            return;
        }

        body.innerHTML = cities
            .map((city, index) => {
                const cityObject =
                    typeof city === "string"
                        ? {
                              id: "CITY-" + (index + 1),
                              name: city,
                              status: "active"
                          }
                        : city;

                return `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${escapeHTML(cityObject.name)}</td>
                        <td>
                            <span class="status-badge ${statusClass(
                                cityObject.status || "active"
                            )}">
                                ${statusText(
                                    cityObject.status || "active"
                                )}
                            </span>
                        </td>
                        <td>
                            <button
                                type="button"
                                class="btn btn-small"
                                data-edit-city="${escapeHTML(
                                    cityObject.id
                                )}"
                            >
                                تعديل
                            </button>

                            <button
                                type="button"
                                class="btn btn-small btn-danger"
                                data-delete-city="${escapeHTML(
                                    cityObject.id
                                )}"
                            >
                                حذف
                            </button>
                        </td>
                    </tr>
                `;
            })
            .join("");

        body.querySelectorAll("[data-edit-city]").forEach((button) => {
            button.addEventListener("click", () => {
                editCity(button.dataset.editCity);
            });
        });

        body.querySelectorAll("[data-delete-city]").forEach((button) => {
            button.addEventListener("click", () => {
                deleteCity(button.dataset.deleteCity);
            });
        });
    }

    function setupCityForm() {
        const form = $("cityForm");

        if (!form) {
            renderCities();
            return;
        }

        const nameInput =
            $("cityName") ||
            $("city_name") ||
            form.querySelector('input[name="cityName"]');

        const statusInput =
            $("cityStatus") ||
            form.querySelector('select[name="cityStatus"]');

        const idInput =
            $("cityId") ||
            form.querySelector('input[name="cityId"]');

        const message =
            $("cityMessage") ||
            $("citiesMessage");

        form.addEventListener("submit", function (event) {
            event.preventDefault();

            const name = nameInput
                ? nameInput.value.trim()
                : "";

            const status = statusInput
                ? statusInput.value || "active"
                : "active";

            if (!name) {
                showMessage(
                    message,
                    "يرجى إدخال اسم المدينة.",
                    "error"
                );
                return;
            }

            const cities = getCities();

            const duplicate = cities.some((city) => {
                const cityName =
                    typeof city === "string"
                        ? city
                        : city.name;

                const cityId =
                    typeof city === "string"
                        ? ""
                        : city.id;

                return (
                    cityId !== (idInput ? idInput.value : "") &&
                    String(cityName).trim().toLowerCase() ===
                        name.toLowerCase()
                );
            });

            if (duplicate) {
                showMessage(
                    message,
                    "هذه المدينة موجودة بالفعل.",
                    "error"
                );
                return;
            }

            const editId = idInput ? idInput.value.trim() : "";

            if (editId) {
                const index = cities.findIndex((city, indexValue) => {
                    if (typeof city === "string") {
                        return (
                            editId ===
                            "CITY-" + (indexValue + 1)
                        );
                    }

                    return city.id === editId;
                });

                if (index !== -1) {
                    cities[index] = {
                        id: editId,
                        name,
                        status
                    };
                }
            } else {
                cities.push({
                    id: generateId("CITY"),
                    name,
                    status
                });
            }

            setStorage(STORAGE_KEYS.cities, cities);

            form.reset();

            if (idInput) {
                idInput.value = "";
            }

            showMessage(
                message,
                editId
                    ? "تم تعديل المدينة بنجاح."
                    : "تمت إضافة المدينة بنجاح.",
                "success"
            );

            renderCities();
            refreshCitySelectors();
        });

        renderCities();
    }

    function editCity(id) {
        const cities = getCities();

        const index = cities.findIndex((city, indexValue) => {
            if (typeof city === "string") {
                return id === "CITY-" + (indexValue + 1);
            }

            return city.id === id;
        });

        if (index === -1) {
            return;
        }

        const city =
            typeof cities[index] === "string"
                ? {
                      id,
                      name: cities[index],
                      status: "active"
                  }
                : cities[index];

        const form = $("cityForm");

        if (!form) {
            return;
        }

        const nameInput = $("cityName");
        const statusInput = $("cityStatus");
        const idInput = $("cityId");

        if (nameInput) {
            nameInput.value = city.name || "";
        }

        if (statusInput) {
            statusInput.value = city.status || "active";
        }

        if (idInput) {
            idInput.value = city.id;
        }

        form.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }

    function deleteCity(id) {
        if (
            !window.confirm(
                "هل أنت متأكد من حذف هذه المدينة؟"
            )
        ) {
            return;
        }

        const cities = getCities();

        const filtered = cities.filter((city, indexValue) => {
            if (typeof city === "string") {
                return id !== "CITY-" + (indexValue + 1);
            }

            return city.id !== id;
        });

        setStorage(STORAGE_KEYS.cities, filtered);

        renderCities();
        refreshCitySelectors();
    }

    function refreshCitySelectors() {
        const selectors = document.querySelectorAll(
            "#tripFrom, #tripTo, #fromCity, #toCity"
        );

        const cities = getCities().map((city) =>
            typeof city === "string" ? city : city.name
        );

        selectors.forEach((select) => {
            const currentValue = select.value;

            select.innerHTML =
                '<option value="">اختر المدينة</option>' +
                cities
                    .map(
                        (city) =>
                            `<option value="${escapeHTML(
                                city
                            )}">${escapeHTML(city)}</option>`
                    )
                    .join("");

            if (cities.includes(currentValue)) {
                select.value = currentValue;
            }
        });
    }

    /* =========================================================
       Trips
    ========================================================= */

    function renderTripsAdmin() {
        const body =
            $("tripsTableBody") ||
            $("tripTableBody");

        if (!body) {
            return;
        }

        const trips = getTrips();

        if (trips.length === 0) {
            body.innerHTML = `
                <tr>
                    <td colspan="10" class="empty-state">
                        لا توجد رحلات حالياً.
                    </td>
                </tr>
            `;
            return;
        }

        body.innerHTML = trips
            .map((trip, index) => {
                const status = trip.status || "active";

                return `
                    <tr>
                        <td>${index + 1}</td>
                        <td>
                            ${escapeHTML(
                                trip.from ||
                                trip.fromCity ||
                                "-"
                            )}
                            →
                            ${escapeHTML(
                                trip.to ||
                                trip.toCity ||
                                "-"
                            )}
                        </td>
                        <td>${formatDate(trip.date)}</td>
                        <td>${escapeHTML(
                            trip.departure || "-"
                        )}</td>
                        <td>${escapeHTML(
                            trip.arrival || "-"
                        )}</td>
                        <td>${formatPrice(trip.price)}</td>
                        <td>${escapeHTML(
                            trip.company || "-"
                        )}</td>
                        <td>${Number(
                            trip.availableSeats ??
                            trip.seats ??
                            0
                        )}</td>
                        <td>
                            <span class="status-badge ${statusClass(
                                status
                            )}">
                                ${statusText(status)}
                            </span>
                        </td>
                        <td>
                            <button
                                type="button"
                                class="btn btn-small"
                                data-edit-trip="${escapeHTML(
                                    trip.id
                                )}"
                            >
                                تعديل
                            </button>

                            <button
                                type="button"
                                class="btn btn-small btn-danger"
                                data-delete-trip="${escapeHTML(
                                    trip.id
                                )}"
                            >
                                حذف
                            </button>
                        </td>
                    </tr>
                `;
            })
            .join("");

        body.querySelectorAll("[data-edit-trip]").forEach((button) => {
            button.addEventListener("click", () => {
                editTrip(button.dataset.editTrip);
            });
        });

        body.querySelectorAll("[data-delete-trip]").forEach((button) => {
            button.addEventListener("click", () => {
                deleteTrip(button.dataset.deleteTrip);
            });
        });
    }

    function setupTripForm() {
        const form = $("tripForm");

        if (!form) {
            renderTripsAdmin();
            return;
        }

        refreshCitySelectors();

        const fields = {
            id: $("tripId"),
            from: $("tripFrom"),
            to: $("tripTo"),
            date: $("tripDate"),
            departure: $("tripDeparture"),
            arrival: $("tripArrival"),
            price: $("tripPrice"),
            company: $("tripCompany"),
            bus: $("tripBus"),
            seats: $("tripSeats"),
            status: $("tripStatus")
        };

        const message =
            $("tripMessage") ||
            $("tripsMessage");

        form.addEventListener("submit", function (event) {
            event.preventDefault();

            const from = fields.from
                ? fields.from.value.trim()
                : "";

            const to = fields.to
                ? fields.to.value.trim()
                : "";

            const date = fields.date
                ? fields.date.value
                : "";

            const departure = fields.departure
                ? fields.departure.value
                : "";

            const arrival = fields.arrival
                ? fields.arrival.value
                : "";

            const price = fields.price
                ? Number(fields.price.value)
                : 0;

            const company = fields.company
                ? fields.company.value.trim()
                : "";

            const bus = fields.bus
                ? fields.bus.value.trim()
                : "";

            const seats = fields.seats
                ? Number(fields.seats.value)
                : 0;

            const status = fields.status
                ? fields.status.value || "active"
                : "active";

            if (!from || !to) {
                showMessage(
                    message,
                    "يرجى اختيار مدينة الانطلاق والوصول.",
                    "error"
                );
                return;
            }

            if (from === to) {
                showMessage(
                    message,
                    "لا يمكن أن تكون مدينة الانطلاق والوصول متطابقتين.",
                    "error"
                );
                return;
            }

            if (!date) {
                showMessage(
                    message,
                    "يرجى اختيار تاريخ الرحلة.",
                    "error"
                );
                return;
            }

            if (!departure || !arrival) {
                showMessage(
                    message,
                    "يرجى إدخال وقت المغادرة والوصول.",
                    "error"
                );
                return;
            }

            if (price <= 0) {
                showMessage(
                    message,
                    "يرجى إدخال سعر صحيح.",
                    "error"
                );
                return;
            }

            if (seats <= 0) {
                showMessage(
                    message,
                    "يرجى إدخال عدد مقاعد صحيح.",
                    "error"
                );
                return;
            }

            const trips = getTrips();
            const editId = fields.id
                ? fields.id.value.trim()
                : "";

            if (editId) {
                const index = trips.findIndex(
                    (trip) => trip.id === editId
                );

                if (index !== -1) {
                    const oldTrip = trips[index];

                    trips[index] = {
                        ...oldTrip,
                        id: editId,
                        from,
                        to,
                        date,
                        departure,
                        arrival,
                        price,
                        company,
                        bus,
                        seats,
                        availableSeats: Math.min(
                            Number(
                                oldTrip.availableSeats ??
                                seats
                            ),
                            seats
                        ),
                        status
                    };
                }
            } else {
                trips.push({
                    id: generateId("TRIP"),
                    from,
                    to,
                    date,
                    departure,
                    arrival,
                    price,
                    company,
                    bus,
                    seats,
                    availableSeats: seats,
                    status
                });
            }

            setStorage(STORAGE_KEYS.trips, trips);

            form.reset();

            if (fields.id) {
                fields.id.value = "";
            }

            showMessage(
                message,
                editId
                    ? "تم تعديل الرحلة بنجاح."
                    : "تمت إضافة الرحلة بنجاح.",
                "success"
            );

            renderTripsAdmin();
        });

        renderTripsAdmin();
    }

    function editTrip(id) {
        const trips = getTrips();

        const trip = trips.find(
            (item) => item.id === id
        );

        if (!trip) {
            return;
        }

        const form = $("tripForm");

        if (!form) {
            return;
        }

        const map = {
            tripId: trip.id,
            tripFrom: trip.from || trip.fromCity || "",
            tripTo: trip.to || trip.toCity || "",
            tripDate: trip.date || "",
            tripDeparture: trip.departure || "",
            tripArrival: trip.arrival || "",
            tripPrice: trip.price || "",
            tripCompany: trip.company || "",
            tripBus: trip.bus || "",
            tripSeats:
                trip.seats ||
                trip.availableSeats ||
                "",
            tripStatus: trip.status || "active"
        };

        Object.keys(map).forEach((idKey) => {
            const input = $(idKey);

            if (input) {
                input.value = map[idKey];
            }
        });

        form.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }

    function deleteTrip(id) {
        if (
            !window.confirm(
                "هل أنت متأكد من حذف هذه الرحلة؟"
            )
        ) {
            return;
        }

        const trips = getTrips().filter(
            (trip) => trip.id !== id
        );

        setStorage(STORAGE_KEYS.trips, trips);

        renderTripsAdmin();
    }

    /* =========================================================
       Buses
    ========================================================= */

    function renderBuses() {
        const body =
            $("busesTableBody") ||
            $("busTableBody");

        if (!body) {
            return;
        }

        const buses = getBuses();

        body.innerHTML = buses
            .map((bus, index) => {
                return `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${escapeHTML(
                            bus.name || "-"
                        )}</td>
                        <td>${escapeHTML(
                            bus.company || "-"
                        )}</td>
                        <td>${Number(
                            bus.seats || 0
                        )}</td>
                        <td>${escapeHTML(
                            bus.type || "-"
                        )}</td>
                        <td>
                            <span class="status-badge ${statusClass(
                                bus.status || "active"
                            )}">
                                ${statusText(
                                    bus.status || "active"
                                )}
                            </span>
                        </td>
                        <td>
                            <button
                                type="button"
                                class="btn btn-small"
                                data-edit-bus="${escapeHTML(
                                    bus.id
                                )}"
                            >
                                تعديل
                            </button>

                            <button
                                type="button"
                                class="btn btn-small btn-danger"
                                data-delete-bus="${escapeHTML(
                                    bus.id
                                )}"
                            >
                                حذف
                            </button>
                        </td>
                    </tr>
                `;
            })
            .join("");

        body.querySelectorAll("[data-edit-bus]").forEach((button) => {
            button.addEventListener("click", () => {
                editBus(button.dataset.editBus);
            });
        });

        body.querySelectorAll("[data-delete-bus]").forEach((button) => {
            button.addEventListener("click", () => {
                deleteBus(button.dataset.deleteBus);
            });
        });
    }

    function setupBusForm() {
        const form = $("busForm");

        if (!form) {
            renderBuses();
            return;
        }

        const fields = {
            id: $("busId"),
            name: $("busName"),
            company: $("busCompany"),
            seats: $("busSeats"),
            type: $("busType"),
            status: $("busStatus")
        };

        const message =
            $("busMessage") ||
            $("busesMessage");

        form.addEventListener("submit", function (event) {
            event.preventDefault();

            const name = fields.name
                ? fields.name.value.trim()
                : "";

            const company = fields.company
                ? fields.company.value.trim()
                : "";

            const seats = fields.seats
                ? Number(fields.seats.value)
                : 0;

            const type = fields.type
                ? fields.type.value || "عادية"
                : "عادية";

            const status = fields.status
                ? fields.status.value || "active"
                : "active";

            if (!name || !company) {
                showMessage(
                    message,
                    "يرجى إدخال اسم الحافلة والشركة.",
                    "error"
                );
                return;
            }

            if (seats <= 0) {
                showMessage(
                    message,
                    "يرجى إدخال عدد مقاعد صحيح.",
                    "error"
                );
                return;
            }

            const buses = getBuses();

            const editId = fields.id
                ? fields.id.value.trim()
                : "";

            if (editId) {
                const index = buses.findIndex(
                    (bus) => bus.id === editId
                );

                if (index !== -1) {
                    buses[index] = {
                        ...buses[index],
                        id: editId,
                        name,
                        company,
                        seats,
                        type,
                        status
                    };
                }
            } else {
                buses.push({
                    id: generateId("BUS"),
                    name,
                    company,
                    seats,
                    type,
                    status
                });
            }

            setStorage(STORAGE_KEYS.buses, buses);

            form.reset();

            if (fields.id) {
                fields.id.value = "";
            }

            showMessage(
                message,
                editId
                    ? "تم تعديل الحافلة بنجاح."
                    : "تمت إضافة الحافلة بنجاح.",
                "success"
            );

            renderBuses();
        });

        renderBuses();
    }

    function editBus(id) {
        const buses = getBuses();

        const bus = buses.find(
            (item) => item.id === id
        );

        if (!bus) {
            return;
        }

        const form = $("busForm");

        if (!form) {
            return;
        }

        const values = {
            busId: bus.id,
            busName: bus.name || "",
            busCompany: bus.company || "",
            busSeats: bus.seats || "",
            busType: bus.type || "عادية",
            busStatus: bus.status || "active"
        };

        Object.keys(values).forEach((idKey) => {
            const input = $(idKey);

            if (input) {
                input.value = values[idKey];
            }
        });

        form.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }

    function deleteBus(id) {
        if (
            !window.confirm(
                "هل أنت متأكد من حذف هذه الحافلة؟"
            )
        ) {
            return;
        }

        const buses = getBuses().filter(
            (bus) => bus.id !== id
        );

        setStorage(STORAGE_KEYS.buses, buses);

        renderBuses();
    }

    /* =========================================================
       Bookings
    ========================================================= */

    function renderBookingsAdmin() {
        const body =
            $("bookingsTableBody") ||
            $("bookingTableBody");

        if (!body) {
            return;
        }

        const bookings = getBookings();

        if (bookings.length === 0) {
            body.innerHTML = `
                <tr>
                    <td colspan="10" class="empty-state">
                        لا توجد حجوزات حالياً.
                    </td>
                </tr>
            `;
            return;
        }

        body.innerHTML = bookings
            .map((booking, index) => {
                const status =
                    booking.status || "confirmed";

                return `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${escapeHTML(
                            booking.reference ||
                            booking.id ||
                            "-"
                        )}</td>
                        <td>${escapeHTML(
                            booking.passengerName ||
                            booking.name ||
                            "-"
                        )}</td>
                        <td>${escapeHTML(
                            booking.phone ||
                            "-"
                        )}</td>
                        <td>${escapeHTML(
                            booking.email ||
                            "-"
                        )}</td>
                        <td>
                            ${escapeHTML(
                                booking.from ||
                                "-"
                            )}
                            →
                            ${escapeHTML(
                                booking.to ||
                                "-"
                            )}
                        </td>
                        <td>${formatDate(
                            booking.date
                        )}</td>
                        <td>${formatPrice(
                            booking.total ||
                            booking.price ||
                            0
                        )}</td>
                        <td>
                            <span class="status-badge ${statusClass(
                                status
                            )}">
                                ${statusText(status)}
                            </span>
                        </td>
                        <td>
                            ${
                                status !== "cancelled"
                                    ? `
                                <button
                                    type="button"
                                    class="btn btn-small btn-danger"
                                    data-cancel-booking="${escapeHTML(
                                        booking.id
                                    )}"
                                >
                                    إلغاء
                                </button>
                            `
                                    : "-"
                            }
                        </td>
                    </tr>
                `;
            })
            .join("");

        body.querySelectorAll(
            "[data-cancel-booking]"
        ).forEach((button) => {
            button.addEventListener("click", () => {
                cancelAdminBooking(
                    button.dataset.cancelBooking
                );
            });
        });
    }

    function cancelAdminBooking(id) {
        if (
            !window.confirm(
                "هل أنت متأكد من إلغاء هذا الحجز؟"
            )
        ) {
            return;
        }

        const bookings = getBookings();

        const index = bookings.findIndex(
            (booking) => booking.id === id
        );

        if (index === -1) {
            return;
        }

        const booking = bookings[index];

        if (booking.status === "cancelled") {
            return;
        }

        bookings[index].status = "cancelled";
        bookings[index].cancelledAt =
            new Date().toISOString();

        setStorage(
            STORAGE_KEYS.bookings,
            bookings
        );

        /*
         * Restore trip seats when a booking is cancelled
         * from the admin panel.
         */
        if (booking.tripId) {
            const trips = getTrips();

            const tripIndex = trips.findIndex(
                (trip) =>
                    trip.id === booking.tripId
            );

            if (tripIndex !== -1) {
                const passengerCount =
                    Number(
                        booking.passengers
                    ) ||
                    (Array.isArray(booking.seats)
                        ? booking.seats.length
                        : 1);

                const currentAvailable =
                    Number(
                        trips[tripIndex]
                            .availableSeats
                    ) || 0;

                const totalSeats =
                    Number(
                        trips[tripIndex].seats
                    ) || currentAvailable;

                trips[tripIndex].availableSeats =
                    Math.min(
                        totalSeats,
                        currentAvailable +
                            passengerCount
                    );

                setStorage(
                    STORAGE_KEYS.trips,
                    trips
                );
            }
        }

        renderBookingsAdmin();
    }

    /* =========================================================
       Users
    ========================================================= */

    function renderUsers() {
        const body =
            $("usersTableBody") ||
            $("userTableBody");

        if (!body) {
            return;
        }

        const users = getUsers();

        if (users.length === 0) {
            body.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-state">
                        لا يوجد مستخدمون حالياً.
                    </td>
                </tr>
            `;
            return;
        }

        body.innerHTML = users
            .map((user, index) => {
                const name =
                    user.name ||
                    user.username ||
                    "-";

                const status =
                    user.status ||
                    "active";

                return `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${escapeHTML(
                            name
                        )}</td>
                        <td>${escapeHTML(
                            user.username ||
                            "-"
                        )}</td>
                        <td>${escapeHTML(
                            user.email ||
                            "-"
                        )}</td>
                        <td>${escapeHTML(
                            user.phone ||
                            "-"
                        )}</td>
                        <td>${escapeHTML(
                            user.role ||
                            "user"
                        )}</td>
                        <td>
                            <span class="status-badge ${statusClass(
                                status
                            )}">
                                ${statusText(status)}
                            </span>
                        </td>
                        <td>
                            <button
                                type="button"
                                class="btn btn-small"
                                data-toggle-user="${escapeHTML(
                                    user.id ||
                                    user.username ||
                                    user.email ||
                                    index
                                )}"
                            >
                                ${
                                    status === "inactive"
                                        ? "تفعيل"
                                        : "تعطيل"
                                }
                            </button>
                        </td>
                    </tr>
                `;
            })
            .join("");

        body.querySelectorAll(
            "[data-toggle-user]"
        ).forEach((button) => {
            button.addEventListener("click", () => {
                toggleUser(
                    button.dataset.toggleUser
                );
            });
        });
    }

    function toggleUser(identifier) {
        const users = getUsers();

        const index = users.findIndex(
            (user, indexValue) =>
                String(
                    user.id ||
                    user.username ||
                    user.email ||
                    indexValue
                ) === String(identifier)
        );

        if (index === -1) {
            return;
        }

        users[index].status =
            users[index].status === "inactive"
                ? "active"
                : "inactive";

        setStorage(
            STORAGE_KEYS.users,
            users
        );

        renderUsers();
    }

    /* =========================================================
       Dashboard
    ========================================================= */

    function updateElement(id, value) {
        const element = $(id);

        if (element) {
            element.textContent = value;
        }
    }

    function renderDashboard() {
        const trips = getTrips();
        const bookings = getBookings();
        const users = getUsers();
        const buses = getBuses();

        const activeTrips = trips.filter(
            (trip) =>
                (trip.status || "active") === "active"
        );

        const activeBuses = buses.filter(
            (bus) =>
                (bus.status || "active") === "active"
        );

        const activeBookings = bookings.filter(
            (booking) =>
                booking.status !== "cancelled"
        );

        const revenue = activeBookings.reduce(
            (sum, booking) =>
                sum +
                (
                    Number(
                        booking.total ||
                        booking.price
                    ) || 0
                ),
            0
        );

        updateElement(
            "totalTrips",
            activeTrips.length
        );

        updateElement(
            "totalBookings",
            activeBookings.length
        );

        updateElement(
            "totalUsers",
            users.length
        );

        updateElement(
            "totalBuses",
            activeBuses.length
        );

        updateElement(
            "totalRevenue",
            formatPrice(revenue)
        );

        updateElement(
            "dashboardTotalTrips",
            activeTrips.length
        );

        updateElement(
            "dashboardTotalBookings",
            activeBookings.length
        );

        updateElement(
            "dashboardTotalUsers",
            users.length
        );

        updateElement(
            "dashboardTotalBuses",
            activeBuses.length
        );

        updateElement(
            "dashboardTotalRevenue",
            formatPrice(revenue)
        );

        renderRecentBookings();
    }

    function renderRecentBookings() {
        const body =
            $("recentBookingsTableBody") ||
            $("recentBookingsBody");

        if (!body) {
            return;
        }

        const bookings = getBookings()
            .slice()
            .sort((a, b) => {
                const dateA =
                    new Date(
                        a.createdAt ||
                        a.date ||
                        0
                    ).getTime();

                const dateB =
                    new Date(
                        b.createdAt ||
                        b.date ||
                        0
                    ).getTime();

                return dateB - dateA;
            })
            .slice(0, 5);

        if (bookings.length === 0) {
            body.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        لا توجد حجوزات حديثة.
                    </td>
                </tr>
            `;
            return;
        }

        body.innerHTML = bookings
            .map(
                (booking) => `
                    <tr>
                        <td>${escapeHTML(
                            booking.reference ||
                            booking.id ||
                            "-"
                        )}</td>
                        <td>${escapeHTML(
                            booking.passengerName ||
                            booking.name ||
                            "-"
                        )}</td>
                        <td>
                            ${escapeHTML(
                                booking.from ||
                                "-"
                            )}
                            →
                            ${escapeHTML(
                                booking.to ||
                                "-"
                            )}
                        </td>
                        <td>${formatDate(
                            booking.date
                        )}</td>
                        <td>${formatPrice(
                            booking.total ||
                            booking.price ||
                            0
                        )}</td>
                        <td>
                            <span class="status-badge ${statusClass(
                                booking.status ||
                                "confirmed"
                            )}">
                                ${statusText(
                                    booking.status ||
                                    "confirmed"
                                )}
                            </span>
                        </td>
                    </tr>
                `
            )
            .join("");
    }

    /* =========================================================
       Reports
    ========================================================= */

    function filterBookingsForReport() {
        const bookings = getBookings();

        const startInput = $("reportStartDate");
        const endInput = $("reportEndDate");
        const statusInput = $("reportStatus");

        const startDate = startInput
            ? startInput.value
            : "";

        const endDate = endInput
            ? endInput.value
            : "";

        const selectedStatus = statusInput
            ? statusInput.value
            : "";

        return bookings.filter((booking) => {
            const bookingDate =
                booking.date ||
                (
                    booking.createdAt
                        ? booking.createdAt.substring(
                              0,
                              10
                          )
                        : ""
                );

            if (
                startDate &&
                bookingDate &&
                bookingDate < startDate
            ) {
                return false;
            }

            if (
                endDate &&
                bookingDate &&
                bookingDate > endDate
            ) {
                return false;
            }

            if (
                selectedStatus &&
                (booking.status || "confirmed") !==
                    selectedStatus
            ) {
                return false;
            }

            return true;
        });
    }

    function generateReports() {
        const bookings =
            filterBookingsForReport();

        const trips = getTrips();

        const validBookings = bookings.filter(
            (booking) =>
                booking.status !== "cancelled"
        );

        const totalBookings =
            validBookings.length;

        const totalRevenue =
            validBookings.reduce(
                (sum, booking) =>
                    sum +
                    (
                        Number(
                            booking.total ||
                            booking.price
                        ) || 0
                    ),
                0
            );

        const ticketsSold =
            validBookings.reduce(
                (sum, booking) =>
                    sum +
                    (
                        Number(
                            booking.passengers
                        ) ||
                        (
                            Array.isArray(
                                booking.seats
                            )
                                ? booking.seats.length
                                : 1
                        )
                    ),
                0
            );

        updateElement(
            "reportTotalBookings",
            totalBookings
        );

        updateElement(
            "reportTotalTrips",
            trips.length
        );

        updateElement(
            "reportTotalRevenue",
            formatPrice(totalRevenue)
        );

        updateElement(
            "reportTicketsSold",
            ticketsSold
        );

        updateElement(
            "revenueTotal",
            formatPrice(totalRevenue)
        );

        updateElement(
            "revenueAverageBooking",
            formatPrice(
                totalBookings > 0
                    ? totalRevenue / totalBookings
                    : 0
            )
        );

        updateElement(
            "revenueTickets",
            ticketsSold
        );

        const highestRevenueTrip =
            getHighestRevenueTrip(
                validBookings
            );

        updateElement(
            "highestRevenueTrip",
            highestRevenueTrip
                ? `${highestRevenueTrip.route} — ${formatPrice(
                      highestRevenueTrip.revenue
                  )}`
                : "-"
        );

        renderTopRoutes(validBookings);
        renderTopCities(validBookings);
        renderDateStats(validBookings);
        renderTripsReport(trips, validBookings);
        renderRevenueReport(validBookings);

        const generatedDate =
            $("reportGeneratedDate");

        if (generatedDate) {
            generatedDate.textContent =
                new Date().toLocaleString(
                    "ar-SD"
                );
        }

        const summary =
            $("reportSummary");

        if (summary) {
            summary.textContent =
                `تم إنشاء التقرير بناءً على ${totalBookings} حجزاً و${ticketsSold} تذكرة، بإجمالي إيرادات ${formatPrice(
                    totalRevenue
                )}.`;
        }
    }

    function getHighestRevenueTrip(bookings) {
        const routes = {};

        bookings.forEach((booking) => {
            const route =
                `${booking.from || "-"} → ${
                    booking.to || "-"
                }`;

            routes[route] =
                (routes[route] || 0) +
                (
                    Number(
                        booking.total ||
                        booking.price
                    ) || 0
                );
        });

        let highest = null;

        Object.keys(routes).forEach((route) => {
            if (
                !highest ||
                routes[route] >
                    highest.revenue
            ) {
                highest = {
                    route,
                    revenue: routes[route]
                };
            }
        });

        return highest;
    }

    function renderTopRoutes(bookings) {
        const body =
            $("topRoutesTableBody");

        if (!body) {
            return;
        }

        const routes = {};

        bookings.forEach((booking) => {
            const route =
                `${booking.from || "-"} → ${
                    booking.to || "-"
                }`;

            if (!routes[route]) {
                routes[route] = {
                    bookings: 0,
                    tickets: 0,
                    revenue: 0
                };
            }

            routes[route].bookings++;

            routes[route].tickets +=
                Number(
                    booking.passengers
                ) ||
                (
                    Array.isArray(
                        booking.seats
                    )
                        ? booking.seats.length
                        : 1
                );

            routes[route].revenue +=
                Number(
                    booking.total ||
                    booking.price
                ) || 0;
        });

        const rows = Object.keys(routes)
            .map((route) => ({
                route,
                ...routes[route]
            }))
            .sort(
                (a, b) =>
                    b.revenue - a.revenue
            );

        body.innerHTML =
            rows.length === 0
                ? `
                    <tr>
                        <td colspan="4">
                            لا توجد بيانات.
                        </td>
                    </tr>
                `
                : rows
                      .map(
                          (row) => `
                            <tr>
                                <td>${escapeHTML(
                                    row.route
                                )}</td>
                                <td>${row.bookings}</td>
                                <td>${row.tickets}</td>
                                <td>${formatPrice(
                                    row.revenue
                                )}</td>
                            </tr>
                        `
                      )
                      .join("");
    }

    function renderTopCities(bookings) {
        const body =
            $("topCitiesTableBody");

        if (!body) {
            return;
        }

        const cities = {};

        bookings.forEach((booking) => {
            const from =
                booking.from || "-";
            const to =
                booking.to || "-";

            [from, to].forEach((city) => {
                if (!cities[city]) {
                    cities[city] = {
                        departures: 0,
                        arrivals: 0
                    };
                }
            });

            cities[from].departures++;
            cities[to].arrivals++;
        });

        const rows = Object.keys(cities)
            .map((city) => ({
                city,
                ...cities[city],
                total:
                    cities[city]
                        .departures +
                    cities[city].arrivals
            }))
            .sort(
                (a, b) =>
                    b.total - a.total
            );

        body.innerHTML =
            rows.length === 0
                ? `
                    <tr>
                        <td colspan="4">
                            لا توجد بيانات.
                        </td>
                    </tr>
                `
                : rows
                      .map(
                          (row) => `
                            <tr>
                                <td>${escapeHTML(
                                    row.city
                                )}</td>
                                <td>${row.departures}</td>
                                <td>${row.arrivals}</td>
                                <td>${row.total}</td>
                            </tr>
                        `
                      )
                      .join("");
    }

    function renderDateStats(bookings) {
        const body =
            $("bookingDateStatsBody");

        if (!body) {
            return;
        }

        const dates = {};

        bookings.forEach((booking) => {
            const date =
                booking.date ||
                (
                    booking.createdAt
                        ? booking.createdAt.substring(
                              0,
                              10
                          )
                        : "غير محدد"
                );

            if (!dates[date]) {
                dates[date] = {
                    bookings: 0,
                    tickets: 0,
                    revenue: 0
                };
            }

            dates[date].bookings++;

            dates[date].tickets +=
                Number(
                    booking.passengers
                ) ||
                (
                    Array.isArray(
                        booking.seats
                    )
                        ? booking.seats.length
                        : 1
                );

            dates[date].revenue +=
                Number(
                    booking.total ||
                    booking.price
                ) || 0;
        });

        const rows = Object.keys(dates)
            .sort()
            .map((date) => ({
                date,
                ...dates[date]
            }));

        body.innerHTML =
            rows.length === 0
                ? `
                    <tr>
                        <td colspan="4">
                            لا توجد بيانات.
                        </td>
                    </tr>
                `
                : rows
                      .map(
                          (row) => `
                            <tr>
                                <td>${formatDate(
                                    row.date
                                )}</td>
                                <td>${row.bookings}</td>
                                <td>${row.tickets}</td>
                                <td>${formatPrice(
                                    row.revenue
                                )}</td>
                            </tr>
                        `
                      )
                      .join("");
    }

    function renderTripsReport(
        trips,
        bookings
    ) {
        const body =
            $("tripsReportBody");

        if (!body) {
            return;
        }

        body.innerHTML =
            trips.length === 0
                ? `
                    <tr>
                        <td colspan="7">
                            لا توجد رحلات.
                        </td>
                    </tr>
                `
                : trips
                      .map((trip) => {
                          const tripBookings =
                              bookings.filter(
                                  (booking) =>
                                      booking.tripId ===
                                      trip.id
                              );

                          const tickets =
                              tripBookings.reduce(
                                  (
                                      sum,
                                      booking
                                  ) =>
                                      sum +
                                      (
                                          Number(
                                              booking.passengers
                                          ) ||
                                          (
                                              Array.isArray(
                                                  booking.seats
                                              )
                                                  ? booking
                                                        .seats
                                                        .length
                                                  : 1
                                          )
                                      ),
                                  0
                              );

                          const revenue =
                              tripBookings.reduce(
                                  (
                                      sum,
                                      booking
                                  ) =>
                                      sum +
                                      (
                                          Number(
                                              booking.total ||
                                              booking.price
                                          ) || 0
                                      ),
                                  0
                              );

                          return `
                            <tr>
                                <td>${escapeHTML(
                                    trip.from ||
                                    "-"
                                )} →
                                ${escapeHTML(
                                    trip.to ||
                                    "-"
                                )}</td>
                                <td>${formatDate(
                                    trip.date
                                )}</td>
                                <td>${escapeHTML(
                                    trip.departure ||
                                    "-"
                                )}</td>
                                <td>${tripBookings.length}</td>
                                <td>${tickets}</td>
                                <td>${formatPrice(
                                    revenue
                                )}</td>
                                <td>${escapeHTML(
                                    trip.company ||
                                    "-"
                                )}</td>
                            </tr>
                        `;
                      })
                      .join("");
    }

    function renderRevenueReport(bookings) {
        const body =
            $("revenueReportBody");

        if (!body) {
            return;
        }

        const companies = {};

        bookings.forEach((booking) => {
            const company =
                booking.company ||
                "غير محددة";

            if (!companies[company]) {
                companies[company] = {
                    bookings: 0,
                    tickets: 0,
                    revenue: 0
                };
            }

            companies[company].bookings++;

            companies[company].tickets +=
                Number(
                    booking.passengers
                ) ||
                (
                    Array.isArray(
                        booking.seats
                    )
                        ? booking.seats.length
                        : 1
                );

            companies[company].revenue +=
                Number(
                    booking.total ||
                    booking.price
                ) || 0;
        });

        const rows = Object.keys(companies)
            .map((company) => ({
                company,
                ...companies[company]
            }))
            .sort(
                (a, b) =>
                    b.revenue - a.revenue
            );

        body.innerHTML =
            rows.length === 0
                ? `
                    <tr>
                        <td colspan="4">
                            لا توجد بيانات.
                        </td>
                    </tr>
                `
                : rows
                      .map(
                          (row) => `
                            <tr>
                                <td>${escapeHTML(
                                    row.company
                                )}</td>
                                <td>${row.bookings}</td>
                                <td>${row.tickets}</td>
                                <td>${formatPrice(
                                    row.revenue
                                )}</td>
                            </tr>
                        `
                      )
                      .join("");
    }

    function setupReports() {
        const generateButton =
            $("generateReportBtn");

        const resetButton =
            $("resetReportBtn");

        if (generateButton) {
            generateButton.addEventListener(
                "click",
                function () {
                    generateReports();
                }
            );
        }

        if (resetButton) {
            resetButton.addEventListener(
                "click",
                function () {
                    const start =
                        $("reportStartDate");

                    const end =
                        $("reportEndDate");

                    const status =
                        $("reportStatus");

                    const type =
                        $("reportType");

                    if (start) {
                        start.value = "";
                    }

                    if (end) {
                        end.value = "";
                    }

                    if (status) {
                        status.value = "";
                    }

                    if (type) {
                        type.value = "";
                    }

                    generateReports();
                }
            );
        }

        generateReports();
    }

    /* =========================================================
       Print Reports
    ========================================================= */

    function setupReportPrint() {
        const buttons =
            document.querySelectorAll(
                "#printReport, #printReportBtn, [data-print-report]"
            );

        buttons.forEach((button) => {
            button.addEventListener(
                "click",
                function (event) {
                    event.preventDefault();

                    const report =
                        $("reportDocument");

                    if (!report) {
                        window.print();
                        return;
                    }

                    window.print();
                }
            );
        });
    }

    /* =========================================================
       Admin Initialization
    ========================================================= */

    function initializeAdmin() {
        setupAdminProtection();

        /*
         * Do not continue with protected
         * functionality if the admin is not logged in.
         */
        if (
            isAdminPage() &&
            !isLoginPage() &&
            !isAdminLoggedIn()
        ) {
            return;
        }

        setupAdminLogin();

        if (!isLoginPage()) {
            setupAdminLogout();
            setupAdminUsername();

            setupCityForm();
            setupTripForm();
            setupBusForm();

            renderBookingsAdmin();
            renderUsers();
            renderDashboard();

            setupReports();
            setupReportPrint();
        }
    }

    document.addEventListener(
        "DOMContentLoaded",
        initializeAdmin
    );

})();