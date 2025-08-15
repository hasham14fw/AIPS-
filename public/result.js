
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


function showLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.style.display = 'flex';
}

function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.style.display = 'none';
}

function showAlertWithLoading(message) {
  showLoading();
  setTimeout(() => {
    hideLoading();
    alert(message);
  }, 600); // small delay so spinner is visible
}

//=============================  Student Login =============================
const studentLoginForm = document.getElementById('loginForm');
if (studentLoginForm) {
  studentLoginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    showLoading();

    const reg = document.getElementById('reg').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorMessage = document.getElementById('error-message');

    try { 
      const response = await fetch(`${backendURL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reg, password })
      });

      const result = await response.json();
      hideLoading();

      if (response.ok && result.token) {
        localStorage.setItem('token', result.token);
        window.location.href = 'stu_das.html';
      } else {
        errorMessage.textContent = result.error || 'Login failed. Try again.';
      }
    } catch (err) {
      hideLoading();
      console.error('Login error:', err);
      errorMessage.textContent = 'Server error. Please try again later.';
    }
  });
}

//=============================  Teacher Login =============================
const teacherLoginForm = document.getElementById('teacherLoginForm');
if (teacherLoginForm) {
  teacherLoginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    showLoading();

    const reg = document.getElementById('teacherReg').value.trim();
    const password = document.getElementById('teacherPass').value.trim();
    const errorMessage = document.getElementById('teacherError');

    try {
      const response = await fetch(`${backendURL}/teacher-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reg, password })
      });

      const result = await response.json();
      hideLoading();

      if (response.ok && result.token) {
        localStorage.setItem('teacherToken', result.token);
        window.location.href = 'teacher_dash.html';
      } else {
        errorMessage.textContent = result.error || 'Login failed. Try again.';
      }
    } catch (err) {
      hideLoading();
      console.error('Server Error', err);
      errorMessage.textContent = 'Server error. Please try again later.';
    }
  });
}

//=============================  Teacher Dashboard =============================
function teacherLogout() {
  localStorage.removeItem('teacherToken');
  window.location.href = 'TeacherPortal.html';
}

if (document.getElementById('teacher_name')) {
  window.addEventListener('load', async () => {
    const token = localStorage.getItem('teacherToken');
    if (!token) return window.location.href = 'TeacherPortal.html';

    try {
      showLoading();
      const response = await fetch(`${backendURL}/teacher`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        hideLoading();
        localStorage.removeItem('teacherToken');
        return window.location.href = 'teacher.html';
      }

      const teacher = await response.json();
      hideLoading();
      document.getElementById('teacher_name').textContent = teacher.name || 'N/A';
      document.getElementById('teacher_reg').textContent = teacher.reg || 'N/A';
      document.getElementById('teacher_fname').textContent = teacher.fname || 'N/A';
      document.getElementById('teacher_class').textContent = teacher.class || 'N/A';

    } catch (err) {
      hideLoading();
      console.error('Error loading teacher:', err);
      localStorage.removeItem('teacherToken');
      window.location.href = 'TeacherPortal.html';
    }
  });
}

//=============================  Student Dashboard =============================
if (document.getElementById('name')) {
  document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      return showAlertWithLoading('Session expired. Please log in again.');
    }

    try {
      showLoading();
      const res = await fetch(`${backendURL}/student`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to fetch student info');

      const student = await res.json();
      hideLoading();
      document.getElementById('name').textContent = student.name || '';
      document.getElementById('reg').textContent = student.reg || '';
      document.getElementById('fname').textContent = student.fname || '';
      document.getElementById('class').textContent = student.classes || '';
      document.getElementById('dob').textContent = student.dob || '';

    } catch (err) {
      hideLoading();
      console.error('Error fetching student info:', err);
      showAlertWithLoading('Error loading student info. Please log in again.');
      localStorage.removeItem('token');
      window.location.href = 'Student.html';
    }
  });
}

function logout() {
  localStorage.removeItem('token');
  window.location.href = 'student.html';
}

//=============================  Student Attendance =============================
if (document.querySelector('#attendanceTable tbody')) {
  document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) return showAlertWithLoading('Session expired. Please log in again.');

    try {
      showLoading();
      const resAttendance = await fetch(`${backendURL}/api/student-attendance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!resAttendance.ok) throw new Error('Failed to fetch attendance');

      const attendance = await resAttendance.json();
      const tbody = document.querySelector('#attendanceTable tbody');
      tbody.innerHTML = '';

      attendance.forEach(record => {
        const statusText = record.status ? 'Present' : 'Absent';
        const statusColor = record.status ? 'green' : 'red';
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${record.date}</td>
          <td style="color:${statusColor}; font-weight:bold;">${statusText}</td>
        `;
        tbody.appendChild(tr);
      });
      hideLoading();

    } catch (err) {
      hideLoading();
      console.error('Error fetching attendance:', err);
      showAlertWithLoading('Error loading attendance.');
    }
  });
}




