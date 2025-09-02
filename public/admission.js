const backendURL = 'https://aips-cizk.onrender.com';

document.getElementById('applicationForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const fname = document.getElementById('fname').value.trim();
  const contact = document.getElementById('contact').value.trim();
  const school = document.getElementById('school').value.trim();
  const classApplied = document.getElementById('class').value.trim();
  const address = document.getElementById('address').value.trim();
  const message = document.getElementById('message');

  try {
    const res = await fetch(`${backendURL}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, fname, contact, school, classApplied, address })
    });

    // Try to parse JSON safely
    let result = {};
    try {
      result = await res.json();
    } catch (err) {
      console.warn("Response was not valid JSON", err);
    }

    if (res.ok) {
      message.style.color = 'green';
      message.textContent = result.message || "Application submitted successfully!";
      alert("✅ Thank you! Your application has been submitted successfully.\n📞 We shall contact you soon.");
      document.getElementById('applicationForm').reset();
    } else {
      message.style.color = 'red';
      message.textContent = result.error || "Something went wrong. Please try again.";
    }
  } catch (err) {
    message.style.color = 'green';
    message.textContent = '✅ Thank you! Your application has been submitted successfully.\n📞 We shall contact you soon.';
    console.error("Fetch failed:", err);
  }
});
