
const backendURL = 'https://aips-cizk.onrender.com';

window.onload = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const regNumber = urlParams.get('reg');
  if (!regNumber) return; // No reg param, skip result logic

  const nameEl = document.getElementById('name');
  if (!nameEl) return; // Not a result page

  try {
    const response = await fetch(`${backendURL}/result?reg=${regNumber}`);
    const data = await response.json();

    if (data.error) {
      alert(data.error);
      return;
    }

    // Set basic student info
    document.getElementById('name').textContent = data.name || 'N/A';
    document.getElementById('fname').textContent = data.fname || data.fatherName || 'N/A';
    document.getElementById('reg').textContent = data.reg || 'N/A';
    document.getElementById('examType').textContent = data.examType || 'N/A';
    document.getElementById('examDate').textContent = data.examDate
      ? new Date(data.examDate).toLocaleDateString()
      : 'N/A';
    document.getElementById('class').textContent = data.class || 'N/A';

    // Load marks table
    const tableBody = document.getElementById('marksTableBody');
    tableBody.innerHTML = '';

    const marks = data.marks || {};
    const totalMarks = data.totalMarksPerSubject || {};

    if (Object.keys(marks).length === 0) {
      tableBody.innerHTML = `<tr><td colspan="3">No marks data available</td></tr>`;
    } else {
      for (const subject in marks) {
        const obtained = marks[subject] ?? 'N/A';
        const total = totalMarks[subject] ?? 'N/A';

        const row = `
          <tr>
            <td>${subject}</td>
            <td>${obtained}</td>
            <td>${total}</td>
          </tr>`;
        tableBody.innerHTML += row;
      }
    }

    // Set summary stats
    document.getElementById('totalObt').textContent = data.totalObtainedSum ?? '0';
    document.getElementById('totalMax').textContent = data.totalMaxSum ?? '0';
    document.getElementById('percentage').textContent = data.percentage != null ? data.percentage + '%' : 'N/A';

  } catch (error) {
    console.error('Error loading result:', error);
    alert('Failed to fetch result.');
  }
};

 // Set summary sta
window.addEventListener('DOMContentLoaded', () => {
  fetch(`${backendURL}/latest-news`)
    .then(res => res.json())
    .then(data => {
      document.getElementById('news-paragraph').textContent = data.content;
    })
    .catch(() => {
      document.getElementById('news-paragraph').textContent = "Failed to load news.";
    });
});


