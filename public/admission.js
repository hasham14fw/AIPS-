
  document.getElementById('applicationForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const fname = document.getElementById('fname').value;
    const contact = document.getElementById('contact').value;
    const school = document.getElementById('school').value;
    const classApplied = document.getElementById('class').value;
    const address = document.getElementById('address').value;
    const message = document.getElementById('message');

    try {
      const res = await fetch('http://localhost:3000/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, fname, contact, school, classApplied, address })
      });

      const result = await res.json();
      message.style.color = res.ok ? 'green' : 'red';
      message.textContent = result.message || result.error;

      if (res.ok) {
         alert("✅ Thank you! Your application has been submitted successfully.\n📞 We shall contact you soon.");
        document.getElementById('applicationForm').reset();
      }
    } catch (err) {
      message.style.color = 'red';
      message.textContent = 'Server error. Please try again later.';
      console.error(err);
    }
  });

