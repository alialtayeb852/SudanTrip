/* =========================================================
   SudanTrip
   Main Application JavaScript
   Front-End Version
   Storage: localStorage
   ========================================================= */

"use strict";

/* =========================================================
   1. STORAGE KEYS
   ========================================================= */

const STORAGE_KEYS = {
    cities: "sudantrip_cities",
    trips: "sudantrip_trips",
    bookings: "sudantrip_bookings",
    users: "sudantrip_users",
    currentBooking: "sudantrip_current_booking",

    search: "sudantrip_search",
    selectedTrip: "sudantrip_selected_trip",
    seatSelection: "sudantrip_seat_selection"
};


/* =========================================================
   2. DEFAULT CITIES
   ========================================================= */

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


/* =========================================================
   3. SAFE STORAGE HELPERS
   ========================================================= */

function saveToStorage(key, value) {

    try {

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

        return true;

    } catch (error) {

        console.error(
            "خطأ أثناء حفظ البيانات:",
            error
        );

        return false;
    }
}


function getFromStorage(key, fallback = null) {

    try {

        const value =
            localStorage.getItem(key);

        if (value === null) {
            return fallback;
        }

        return JSON.parse(value);

    } catch (error) {

        console.error(
            "خطأ أثناء قراءة البيانات:",
            error
        );

        return fallback;
    }
}


function removeFromStorage(key) {

    try {

        localStorage.removeItem(key);

        return true;

    } catch (error) {

        console.error(
            "خطأ أثناء حذف البيانات:",
            error
        );

        return false;
    }
}


/* =========================================================
   4. INITIALIZE CITIES
   ========================================================= */

function initializeCities() {

    const savedCities =
        localStorage.getItem(
            STORAGE_KEYS.cities
        );

    if (!savedCities) {

        saveToStorage(
            STORAGE_KEYS.cities,
            DEFAULT_CITIES
        );
    }
}


/* =========================================================
   5. GET CITIES
   ========================================================= */

function getCities() {

    const savedCities =
        localStorage.getItem(
            STORAGE_KEYS.cities
        );

    if (!savedCities) {

        return [...DEFAULT_CITIES];
    }

    try {

        const cities =
            JSON.parse(savedCities);

        if (
            Array.isArray(cities) &&
            cities.length > 0
        ) {

            return cities;
        }

    } catch (error) {

        console.error(
            "حدث خطأ أثناء قراءة المدن:",
            error
        );
    }

    return [...DEFAULT_CITIES];
}


/* =========================================================
   6. POPULATE CITY SELECTS
   ========================================================= */

function populateCitySelects() {

    const fromCity =
        document.getElementById("fromCity");

    const toCity =
        document.getElementById("toCity");

    if (!fromCity && !toCity) {
        return;
    }

    const cities = getCities();


    function fillSelect(
        selectElement,
        placeholder
    ) {

        if (!selectElement) {
            return;
        }

        const currentValue =
            selectElement.value;

        selectElement.innerHTML = "";


        const defaultOption =
            document.createElement("option");

        defaultOption.value = "";

        defaultOption.textContent =
            placeholder;

        selectElement.appendChild(
            defaultOption
        );


        cities.forEach(function(city) {

            const option =
                document.createElement("option");

            option.value = city;

            option.textContent = city;

            selectElement.appendChild(
                option
            );
        });


        if (
            currentValue &&
            cities.includes(currentValue)
        ) {

            selectElement.value =
                currentValue;
        }
    }


    fillSelect(
        fromCity,
        "اختر مدينة المغادرة"
    );

    fillSelect(
        toCity,
        "اختر وجهتك"
    );
}


/* =========================================================
   7. PREVENT SAME CITIES
   ========================================================= */

function preventSameCities() {

    const fromCity =
        document.getElementById("fromCity");

    const toCity =
        document.getElementById("toCity");

    if (!fromCity || !toCity) {
        return;
    }


    fromCity.addEventListener(
        "change",
        function() {

            if (
                fromCity.value &&
                toCity.value &&
                fromCity.value === toCity.value
            ) {

                alert(
                    "مدينة المغادرة ومدينة الوصول يجب أن تكونا مختلفتين."
                );

                fromCity.value = "";
            }
        }
    );


    toCity.addEventListener(
        "change",
        function() {

            if (
                fromCity.value &&
                toCity.value &&
                fromCity.value === toCity.value
            ) {

                alert(
                    "مدينة المغادرة ومدينة الوصول يجب أن تكونا مختلفتين."
                );

                toCity.value = "";
            }
        }
    );
}


/* =========================================================
   8. MINIMUM TRAVEL DATE
   ========================================================= */

function setMinimumTravelDate() {

    const travelDate =
        document.getElementById("travelDate");

    if (!travelDate) {
        return;
    }

    const now = new Date();

    const year =
        now.getFullYear();

    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            now.getDate()
        ).padStart(2, "0");

    const today =
        `${year}-${month}-${day}`;

    travelDate.min = today;
}


/* =========================================================
   9. SEARCH FORM
   ========================================================= */

function setupSearchForm() {

    const searchForm =
        document.getElementById(
            "searchForm"
        );

    if (!searchForm) {
        return;
    }


    searchForm.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            const fromElement =
                document.getElementById(
                    "fromCity"
                );

            const toElement =
                document.getElementById(
                    "toCity"
                );

            const dateElement =
                document.getElementById(
                    "travelDate"
                );

            const passengersElement =
                document.getElementById(
                    "passengers"
                );


            const fromCity =
                fromElement
                    ? fromElement.value.trim()
                    : "";

            const toCity =
                toElement
                    ? toElement.value.trim()
                    : "";

            const travelDate =
                dateElement
                    ? dateElement.value
                    : "";

            const passengers =
                passengersElement
                    ? Number(
                        passengersElement.value
                    )
                    : 1;


            if (!fromCity) {

                alert(
                    "الرجاء اختيار مدينة المغادرة."
                );

                return;
            }


            if (!toCity) {

                alert(
                    "الرجاء اختيار وجهتك."
                );

                return;
            }


            if (
                fromCity === toCity
            ) {

                alert(
                    "مدينة المغادرة ومدينة الوصول يجب أن تكونا مختلفتين."
                );

                return;
            }


            if (!travelDate) {

                alert(
                    "الرجاء اختيار تاريخ السفر."
                );

                return;
            }


            if (
                !Number.isInteger(passengers) ||
                passengers < 1 ||
                passengers > 5
            ) {

                alert(
                    "عدد المسافرين يجب أن يكون بين 1 و5."
                );

                return;
            }


            const searchData = {

                from: fromCity,

                to: toCity,

                date: travelDate,

                passengers: passengers
            };


            saveToStorage(
                STORAGE_KEYS.search,
                searchData
            );


            /*
             * Clear old selection data
             * before starting a new search.
             */

            removeFromStorage(
                STORAGE_KEYS.selectedTrip
            );

            removeFromStorage(
                STORAGE_KEYS.seatSelection
            );


            window.location.href =
                "trips.html";
        }
    );
}


/* =========================================================
   10. MOBILE MENU
   ========================================================= */

function setupMobileMenu() {

    const menuToggle =
        document.querySelector(
            ".menu-toggle"
        );

    const mainNav =
        document.querySelector(
            ".main-nav"
        );

    if (!menuToggle || !mainNav) {
        return;
    }


    menuToggle.addEventListener(
        "click",
        function() {

            mainNav.classList.toggle(
                "open"
            );

            const isOpen =
                mainNav.classList.contains(
                    "open"
                );

            menuToggle.setAttribute(
                "aria-expanded",
                isOpen ? "true" : "false"
            );
        }
    );


    const navLinks =
        mainNav.querySelectorAll("a");


    navLinks.forEach(
        function(link) {

            link.addEventListener(
                "click",
                function() {

                    mainNav.classList.remove(
                        "open"
                    );

                    menuToggle.setAttribute(
                        "aria-expanded",
                        "false"
                    );
                }
            );
        }
    );
}


/* =========================================================
   11. ACTIVE NAVIGATION
   ========================================================= */

function setupActiveNavigation() {

    const currentPage =
        window.location.pathname
            .split("/")
            .pop();


    if (!currentPage) {
        return;
    }


    const links =
        document.querySelectorAll(
            ".main-nav a"
        );


    links.forEach(
        function(link) {

            const href =
                link.getAttribute("href");

            if (!href) {
                return;
            }


            const cleanHref =
                href.split("#")[0];


            if (
                cleanHref === currentPage
            ) {

                link.classList.add(
                    "active"
                );
            }
        }
    );
}


/* =========================================================
   12. GLOBAL INITIALIZATION
   ========================================================= */

function initializeSudanTrip() {

    initializeCities();

    populateCitySelects();

    preventSameCities();

    setMinimumTravelDate();

    setupSearchForm();

    setupMobileMenu();

    setupActiveNavigation();
}


/* =========================================================
   13. START APPLICATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeSudanTrip
);