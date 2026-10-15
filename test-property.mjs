const form = new FormData();

const fields = {
  title: "Coral Guest Policy Test",
  description: "Temporary test property to verify guest policy fields.",
  propertyType: "apartment",
  city: "Pune",
  locality: "Test Locality",
  address: "Test Address, Pune",
  rent: "15000",
  rentPeriod: "month",
  minGuests: "2",
  maxGuests: "5",
  guests: "5",

  extraGuestPolicy: JSON.stringify({
    enabled: true,
    maxExtraGuests: 2,
    pricePerPerson: 500,
    chargePeriod: "perNight"
  }),

  sleepingArrangements: JSON.stringify([
    {
      type: "extra-bed",
      label: "Extra Bed",
      quantity: 1,
      isPaid: true,
      price: 300,
      chargePeriod: "perStay"
    }
  ]),

  petPolicy: JSON.stringify({
    allowed: true,
    maxPets: 2,
    types: [
      {
        type: "dog",
        label: "Dog",
        charge: 500,
        chargePeriod: "perStay"
      }
    ]
  }),

  amenities: JSON.stringify(["WiFi"]),
  rules: JSON.stringify(["No smoking"])
};

for (const [key, value] of Object.entries(fields)) {
  form.append(key, value);
}

async function main() {
  const token = process.env.CORAL_ADMIN_TOKEN;

  if (!token) {
    throw new Error("CORAL_ADMIN_TOKEN is missing. Set it using $env:CORAL_ADMIN_TOKEN = $token");
  }

  const response = await fetch("http://localhost:5000/api/properties", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form
  });

  const text = await response.text();
  console.log("HTTP Status:", response.status);

  try {
    const data = JSON.parse(text);
    console.log(JSON.stringify(data, null, 2));
  } catch {
    console.log(text);
  }
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});

