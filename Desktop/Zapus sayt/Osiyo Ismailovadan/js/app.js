const registrationModal = document.getElementById("registrationModal");
const modalOverlay = document.getElementById("modalOverlay");
const openModalBtn = document.getElementById("openModalBtn");
const openModalBtnMd = document.getElementById("openModalBtnMd");
const closeModalBtn = document.getElementById("closeModalBtn");
const registrationForm = document.getElementById("registrationForm");
const nameInput = document.getElementById("name");
const phoneInput = document.getElementById("phone");
const nameError = document.getElementById("nameError");
const phoneError = document.getElementById("phoneError");
const submitBtn = document.getElementById("submitBtn");
const submitBtnText = document.getElementById("submitBtnText");
const homePage = document.getElementById("homePage");
const subscribePage = document.getElementById("subscribePage");

let isSubmitting = false;

function openModal() {
  if (registrationModal) {
    registrationModal.style.display = "flex";
  }
}

function closeModal() {
  if (registrationModal) {
    registrationModal.style.display = "none";
  }
}

function formatPhoneNumber(value) {
  const digits = value.replace(/[^\d+]/g, "");

  if (digits.startsWith("+998")) {
    const numberPart = digits.slice(4);
    if (numberPart.length <= 2) {
      return `+998 ${numberPart}`;
    } else if (numberPart.length <= 5) {
      return `+998 ${numberPart.slice(0, 2)}-${numberPart.slice(2)}`;
    } else if (numberPart.length <= 7) {
      return `+998 ${numberPart.slice(0, 2)}-${numberPart.slice(
        2,
        5
      )}-${numberPart.slice(5)}`;
    } else {
      return `+998 ${numberPart.slice(0, 2)}-${numberPart.slice(
        2,
        5
      )}-${numberPart.slice(5, 7)}-${numberPart.slice(7, 9)}`;
    }
  }
  return digits;
}

function validatePhoneNumber(value) {
  const phoneRegex = /^\+998 \d{2}-\d{3}-\d{2}-\d{2}$/;
  return phoneRegex.test(value);
}

function handleSubmit(e) {
  e.preventDefault();

  if (isSubmitting) {
    return;
  }

  // Validate name
  if (!nameInput.value.trim()) {
    nameError.style.display = "block";
    phoneError.style.display = "none";
    return;
  }

  nameError.style.display = "none";

  // Validate phone number
  if (!validatePhoneNumber(phoneInput.value)) {
    phoneError.style.display = "block";
    return;
  }

  phoneError.style.display = "none";
  isSubmitting = true;

  submitBtn.disabled = true;

  // Prepare form data
  const now = new Date();
  const formattedDate = now.toLocaleDateString("uz-UZ");
  const formattedTime = now.toLocaleTimeString("uz-UZ");

  // Store form data in localStorage
  const formData = {
    name: nameInput.value,
    phone: phoneInput.value,
    dateTime: `${formattedDate} - ${formattedTime}`
  };
  localStorage.setItem('registrationData', JSON.stringify(formData));

  // Redirect to subscribe.html
  window.location.href = "/subscribe.html";
}

function showSubscribePage() {
  if (homePage && subscribePage) {
    homePage.style.display = "none";
    subscribePage.style.display = "block";
  }
}

// New function to send data from subscribe.html
function sendStoredData() {
  const storedData = localStorage.getItem('registrationData');
  if (storedData) {
    const { name, phone, dateTime } = JSON.parse(storedData);
    
    const formData = new FormData();
    formData.append("Ism", name);
    formData.append("Telefon raqam", phone);
    formData.append("Sana, Soat", dateTime);

    fetch(
      "https://script.google.com/macros/s/AKfycbw7wuS1w4VEI3N4PCTeLG8I7iu5orLYpNN2YlFO4HpRPbk27oJmQPEvz2DSC76kydRPag/exec",
      {
        method: "POST",
        body: formData,
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Success:", data);
        // Clear form inputs and localStorage
        if (nameInput && phoneInput) {
          nameInput.value = "";
          phoneInput.value = "+998";
        }
        localStorage.removeItem('registrationData');
      })
      .catch((error) => {
        console.error("Error submitting form:", error);
      })
      .finally(() => {
        isSubmitting = false;
        if (submitBtnText && submitBtn) {
          submitBtnText.innerText = "Royhatdan o'tish";
          submitBtn.disabled = false;
        }
      });
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const preconnectLink = document.createElement("link");
  preconnectLink.rel = "preconnect";
  preconnectLink.href = "https://fonts.gstatic.com";
  document.head.appendChild(preconnectLink);

  if (openModalBtn) {
    openModalBtn.addEventListener("click", openModal);
  }

  if (openModalBtnMd) {
    openModalBtnMd.addEventListener("click", openModal);
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeModal);
  }

  if (modalOverlay) {
    modalOverlay.addEventListener("click", closeModal);
  }

  if (phoneInput) {
    phoneInput.addEventListener("input", function (e) {
      const formatted = formatPhoneNumber(e.target.value);
      phoneInput.value = formatted;
      phoneError.style.display = "none";
    });
  }

  if (nameInput) {
    nameInput.addEventListener("input", function () {
      nameError.style.display = "none";
    });
  }

  if (registrationForm) {
    registrationForm.addEventListener("submit", handleSubmit);
  }

  // Check if we're on subscribe.html and send stored data
  if (window.location.pathname.includes('subscribe.html')) {
    sendStoredData();
  }
});

if (openModalBtn) openModalBtn.onclick = openModal;
if (openModalBtnMd) openModalBtnMd.onclick = openModal;