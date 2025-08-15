const backendURL = 'aips-hsp.com';

//============================= Loader Functions =============================
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
      window.location.href = 'student.html';
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
