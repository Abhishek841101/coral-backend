import nodemailer from "nodemailer";

const EMAIL_HOST = process.env.EMAIL_HOST || "smtp.gmail.com";
const EMAIL_PORT = Number(process.env.EMAIL_PORT || 465);
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;

const transporter =
EMAIL_USER && EMAIL_PASS
? nodemailer.createTransport({
host: EMAIL_HOST,
port: EMAIL_PORT,
secure: EMAIL_PORT === 465,
auth: {
user: EMAIL_USER,
pass: EMAIL_PASS,
},
})
: null;

const safeText = (value, fallback = "—") => {
if (value === undefined || value === null || value === "") {
return fallback;
}

return String(value);
};

const formatDate = (value) => {
if (!value) return "—";

const date = new Date(value);

if (Number.isNaN(date.getTime())) {
return safeText(value);
}

return date.toLocaleDateString("en-IN", {
day: "2-digit",
month: "short",
year: "numeric",
});
};

const formatCurrency = (value) => {
const amount = Number(value) || 0;

return new Intl.NumberFormat("en-IN", {
style: "currency",
currency: "INR",
maximumFractionDigits: 0,
}).format(amount);
};

const getPropertyName = (booking) => {
if (
booking?.property &&
typeof booking.property === "object"
) {
return (
booking.property.title ||
booking.property.name ||
"Coral Property"
);
}

return "Coral Property";
};

const getPropertyLocation = (booking) => {
if (
!booking?.property ||
typeof booking.property !== "object"
) {
return "—";
}

return [
booking.property.locality,
booking.property.city,
booking.property.state,
]
.filter(Boolean)
.join(", ") || "—";
};

const getBookingData = (booking) => {
return {
bookingId: safeText(
booking?._id || booking?.id
),
propertyName: getPropertyName(booking),
propertyLocation: getPropertyLocation(booking),
guestName: safeText(booking?.guestName),
guestPhone: safeText(booking?.guestPhone),
guestEmail: safeText(booking?.guestEmail),
checkIn: formatDate(booking?.checkIn),
checkOut: formatDate(booking?.checkOut),
guests: Number(booking?.guests) || 1,
nights: Number(booking?.nights) || 0,
pricePerNight: formatCurrency(
booking?.pricePerNight
),
totalAmount: formatCurrency(
booking?.totalAmount
),
specialRequest: safeText(
booking?.specialRequest,
"No special request"
),
};
};

const sendEmail = async ({
to,
subject,
html,
text,
}) => {
if (!to) {
console.warn(
"Email notification skipped: recipient email missing."
);

return {
  success: false,
  skipped: true,
  reason: "Recipient email missing",
};

}

if (!transporter) {
console.warn(
"Email notification skipped: EMAIL_USER or EMAIL_PASS is missing."
);

return {
  success: false,
  skipped: true,
  reason: "Email configuration missing",
};

}

try {
const info = await transporter.sendMail({
from: EMAIL_FROM,
to,
subject,
text,
html,
});

console.log(
  `Email notification sent successfully: ${info.messageId}`
);

return {
  success: true,
  messageId: info.messageId,
};

} catch (error) {
console.error(
"Email notification failed:",
error.message
);

return {
  success: false,
  error: error.message,
};

}
};

export const sendBookingCreatedEmail = async (
booking
) => {
const data = getBookingData(booking);

const subject = Coral Booking Request Received - ${data.bookingId};

const text = `
Hello ${data.guestName},

Your booking request has been successfully submitted on Coral.

Booking Reference:
${data.bookingId}

Property:
${data.propertyName}

Location:
${data.propertyLocation}

Check-in:
${data.checkIn}

Check-out:
${data.checkOut}

Guests:
${data.guests}

Nights:
${data.nights}

Booking Amount:
${data.totalAmount}

Status:
Pending Admin Confirmation

Your booking is not confirmed yet. The Coral admin will review your request and confirm it after verification.

Thank you,
Coral
`.trim();

const html = `
<div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;color:#1f2937;">
<div style="background:#073F32;padding:24px;text-align:center;">
<h1 style="color:#18C66A;margin:0;">Coral</h1>
</div>

  <div style="padding:30px;background:#ffffff;">
    <h2 style="color:#10254A;">
      Booking Request Received
    </h2>

    <p>
      Hello <strong>${data.guestName}</strong>,
    </p>

    <p>
      Your booking request has been successfully submitted.
    </p>

    <div style="background:#F8F9F7;padding:20px;border-radius:12px;margin:20px 0;">
      <p><strong>Booking Reference:</strong> ${data.bookingId}</p>
      <p><strong>Property:</strong> ${data.propertyName}</p>
      <p><strong>Location:</strong> ${data.propertyLocation}</p>
      <p><strong>Check-in:</strong> ${data.checkIn}</p>
      <p><strong>Check-out:</strong> ${data.checkOut}</p>
      <p><strong>Guests:</strong> ${data.guests}</p>
      <p><strong>Nights:</strong> ${data.nights}</p>
      <p><strong>Total Amount:</strong> ${data.totalAmount}</p>
    </div>

    <div style="background:#FFF7E6;padding:16px;border-radius:10px;">
      <strong>Status: Pending Admin Confirmation</strong>
      <p style="margin-bottom:0;">
        Your booking is not confirmed yet. The Coral admin will review your request and confirm it after verification.
      </p>
    </div>

    <p style="margin-top:25px;">
      Thank you,<br />
      <strong>Coral</strong>
    </p>
  </div>
</div>

`;

return sendEmail({
to: data.guestEmail,
subject,
text,
html,
});
};

export const sendBookingConfirmedEmail = async (
booking
) => {
const data = getBookingData(booking);

const subject = Coral Booking Confirmed - ${data.bookingId};

const text = `
Hello ${data.guestName},

Your Coral booking has been confirmed.

Booking Reference:
${data.bookingId}

Property:
${data.propertyName}

Location:
${data.propertyLocation}

Check-in:
${data.checkIn}

Check-out:
${data.checkOut}

Guests:
${data.guests}

Nights:
${data.nights}

Total Amount:
${data.totalAmount}

Status:
Confirmed

Please keep your booking reference for future communication.

Thank you,
Coral
`.trim();

const html = `
<div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;color:#1f2937;">
<div style="background:#073F32;padding:24px;text-align:center;">
<h1 style="color:#18C66A;margin:0;">Coral</h1>
</div>

  <div style="padding:30px;background:#ffffff;">
    <h2 style="color:#10254A;">
      Booking Confirmed
    </h2>

    <p>
      Hello <strong>${data.guestName}</strong>,
    </p>

    <p>
      Your Coral booking has been confirmed.
    </p>

    <div style="background:#E9F8F0;padding:20px;border-radius:12px;margin:20px 0;">
      <p><strong>Booking Reference:</strong> ${data.bookingId}</p>
      <p><strong>Property:</strong> ${data.propertyName}</p>
      <p><strong>Location:</strong> ${data.propertyLocation}</p>
      <p><strong>Check-in:</strong> ${data.checkIn}</p>
      <p><strong>Check-out:</strong> ${data.checkOut}</p>
      <p><strong>Guests:</strong> ${data.guests}</p>
      <p><strong>Nights:</strong> ${data.nights}</p>
      <p><strong>Total Amount:</strong> ${data.totalAmount}</p>
    </div>

    <p>
      <strong>Status: Confirmed</strong>
    </p>

    <p>
      Please keep your booking reference for future communication.
    </p>

    <p>
      Thank you,<br />
      <strong>Coral</strong>
    </p>
  </div>
</div>

`;

return sendEmail({
to: data.guestEmail,
subject,
text,
html,
});
};

export const sendBookingRejectedEmail = async (
booking
) => {
const data = getBookingData(booking);

const reason =
safeText(
booking?.rejectionReason,
"The property is not available for the selected dates."
);

const subject = Coral Booking Request Update - ${data.bookingId};

const text = `
Hello ${data.guestName},

There is an update regarding your Coral booking request.

Booking Reference:
${data.bookingId}

Property:
${data.propertyName}

Check-in:
${data.checkIn}

Check-out:
${data.checkOut}

Status:
Rejected

Reason:
${reason}

Please choose another property or different dates.

Thank you,
Coral
`.trim();

const html = `
<div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;color:#1f2937;">
<div style="background:#073F32;padding:24px;text-align:center;">
<h1 style="color:#18C66A;margin:0;">Coral</h1>
</div>

  <div style="padding:30px;background:#ffffff;">
    <h2 style="color:#10254A;">
      Booking Request Update
    </h2>

    <p>
      Hello <strong>${data.guestName}</strong>,
    </p>

    <p>
      There is an update regarding your Coral booking request.
    </p>

    <div style="background:#FFF1F2;padding:20px;border-radius:12px;margin:20px 0;">
      <p><strong>Booking Reference:</strong> ${data.bookingId}</p>
      <p><strong>Property:</strong> ${data.propertyName}</p>
      <p><strong>Check-in:</strong> ${data.checkIn}</p>
      <p><strong>Check-out:</strong> ${data.checkOut}</p>
      <p><strong>Status:</strong> Rejected</p>
      <p><strong>Reason:</strong> ${reason}</p>
    </div>

    <p>
      Please choose another property or different dates.
    </p>

    <p>
      Thank you,<br />
      <strong>Coral</strong>
    </p>
  </div>
</div>

`;

return sendEmail({
to: data.guestEmail,
subject,
text,
html,
});
};

const WHATSAPP_API_URL =
"https://graph.facebook.com/v23.0";

const getWhatsAppConfig = () => {
return {
token: process.env.WHATSAPP_ACCESS_TOKEN,
phoneNumberId:
process.env.WHATSAPP_PHONE_NUMBER_ID,
};
};

const sendWhatsAppMessage = async ({
phone,
message,
}) => {
const {
token,
phoneNumberId,
} = getWhatsAppConfig();

if (!phone) {
console.warn(
"WhatsApp notification skipped: recipient phone missing."
);

return {
  success: false,
  skipped: true,
  reason: "Recipient phone missing",
};

}

if (!token || !phoneNumberId) {
console.warn(
"WhatsApp notification skipped: WhatsApp configuration missing."
);

return {
  success: false,
  skipped: true,
  reason: "WhatsApp configuration missing",
};

}

const cleanPhone = String(phone).replace(
/[^\d]/g,
""
);

if (!cleanPhone) {
return {
success: false,
skipped: true,
reason: "Invalid phone number",
};
}

try {
const response = await fetch(
${WHATSAPP_API_URL}/${phoneNumberId}/messages,
{
method: "POST",
headers: {
Authorization: Bearer ${token},
"Content-Type": "application/json",
},
body: JSON.stringify({
messaging_product: "whatsapp",
recipient_type: "individual",
to: cleanPhone,
type: "text",
text: {
preview_url: false,
body: message,
},
}),
}
);

const data = await response.json();

if (!response.ok) {
  console.error(
    "WhatsApp API error:",
    data
  );

  return {
    success: false,
    error:
      data?.error?.message ||
      "WhatsApp API request failed",
  };
}

console.log(
  "WhatsApp notification sent successfully."
);

return {
  success: true,
  data,
};

} catch (error) {
console.error(
"WhatsApp notification failed:",
error.message
);

return {
  success: false,
  error: error.message,
};

}
};

export const sendBookingCreatedWhatsApp = async (
booking
) => {
const data = getBookingData(booking);

const message = `
Hello ${data.guestName},

Your Coral booking request has been received.

Booking Reference: ${data.bookingId}

Property: ${data.propertyName}
Location: ${data.propertyLocation}

Check-in: ${data.checkIn}
Check-out: ${data.checkOut}

Guests: ${data.guests}
Nights: ${data.nights}

Total Amount: ${data.totalAmount}

Status: Pending Admin Confirmation

Your booking is not confirmed yet. The Coral admin will review your request and confirm it after verification.

Thank you,
Coral
`.trim();

return sendWhatsAppMessage({
phone: data.guestPhone,
message,
});
};

export const sendBookingConfirmedWhatsApp =
async (booking) => {
const data = getBookingData(booking);

const message = `

Hello ${data.guestName},

Your Coral booking has been confirmed.

Booking Reference: ${data.bookingId}

Property: ${data.propertyName}
Location: ${data.propertyLocation}

Check-in: ${data.checkIn}
Check-out: ${data.checkOut}

Guests: ${data.guests}
Nights: ${data.nights}

Total Amount: ${data.totalAmount}

Status: Confirmed

Please keep your booking reference for future communication.

Thank you,
Coral
`.trim();

return sendWhatsAppMessage({
  phone: data.guestPhone,
  message,
});

};

export const sendBookingRejectedWhatsApp =
async (booking) => {
const data = getBookingData(booking);

const reason =
  safeText(
    booking?.rejectionReason,
    "The property is not available for the selected dates."
  );

const message = `

Hello ${data.guestName},

There is an update regarding your Coral booking request.

Booking Reference: ${data.bookingId}

Property: ${data.propertyName}

Check-in: ${data.checkIn}
Check-out: ${data.checkOut}

Status: Rejected

Reason: ${reason}

Please choose another property or different dates.

Thank you,
Coral
`.trim();

return sendWhatsAppMessage({
  phone: data.guestPhone,
  message,
});

};

export const sendBookingCreatedNotifications =
async (booking) => {
const [emailResult, whatsappResult] =
await Promise.allSettled([
sendBookingCreatedEmail(booking),
sendBookingCreatedWhatsApp(booking),
]);

return {
  email:
    emailResult.status === "fulfilled"
      ? emailResult.value
      : {
          success: false,
          error: emailResult.reason?.message,
        },

  whatsapp:
    whatsappResult.status === "fulfilled"
      ? whatsappResult.value
      : {
          success: false,
          error: whatsappResult.reason?.message,
        },
};

};

export const sendBookingConfirmedNotifications =
async (booking) => {
const [emailResult, whatsappResult] =
await Promise.allSettled([
sendBookingConfirmedEmail(booking),
sendBookingConfirmedWhatsApp(booking),
]);

return {
  email:
    emailResult.status === "fulfilled"
      ? emailResult.value
      : {
          success: false,
          error: emailResult.reason?.message,
        },

  whatsapp:
    whatsappResult.status === "fulfilled"
      ? whatsappResult.value
      : {
          success: false,
          error: whatsappResult.reason?.message,
        },
};

};

export const sendBookingRejectedNotifications =
async (booking) => {
const [emailResult, whatsappResult] =
await Promise.allSettled([
sendBookingRejectedEmail(booking),
sendBookingRejectedWhatsApp(booking),
]);

return {
  email:
    emailResult.status === "fulfilled"
      ? emailResult.value
      : {
          success: false,
          error: emailResult.reason?.message,
        },

  whatsapp:
    whatsappResult.status === "fulfilled"
      ? whatsappResult.value
      : {
          success: false,
          error: whatsappResult.reason?.message,
        },
};

};

export default {
sendBookingCreatedEmail,
sendBookingCreatedWhatsApp,
sendBookingConfirmedEmail,
sendBookingConfirmedWhatsApp,
sendBookingRejectedEmail,
sendBookingRejectedWhatsApp,
sendBookingCreatedNotifications,
sendBookingConfirmedNotifications,
sendBookingRejectedNotifications,
};