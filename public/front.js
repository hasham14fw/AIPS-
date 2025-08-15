// ============================= Config =============================
const backendURL = 'https://aips-cizk.onrender.com';

// ============================= Loader Functions =============================
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
  }, 600);
}

// ============================= Student Login =============================
const studentLoginForm = document.getElementById('loginForm');
if (studentLoginForm) {
  studentLoginForm.addEventListener('submit', async e => {
    e.preventDefault();
    showLoading();

    const reg = document.getElementById('reg').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorMessage = document.getElementById('error-message');

    try {
      const res = await fetch(`${backendURL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reg, password })
      });

      const data = await res.json();
      hideLoading();

      if (res.ok && data.token) {
        localStorage.setItem('token', data.token);
        window.location.href = 'stu_das.html';
      } else {
        errorMessage.textContent = data.error || 'Login failed. Try again.';
      }
    } catch (err) {
      hideLoading();
      console.error('Login error:', err);
      errorMessage.textContent = 'Server error. Please try again later.';
    }
  });
}

// ============================= Teacher Login =============================
const teacherLoginForm = document.getElementById('teacherLoginForm');
if (teacherLoginForm) {
  teacherLoginForm.addEventListener('submit', async e => {
    e.preventDefault();
    showLoading();

    const reg = document.getElementById('teacherReg').value.trim();
    const password = document.getElementById('teacherPass').value.trim();
    const errorMessage = document.getElementById('teacherError');

    try {
      const res = await fetch(`${backendURL}/teacher-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reg, password })
      });

      const data = await res.json();
      hideLoading();

      if (res.ok && data.token) {
        localStorage.setItem('teacherToken', data.token);
        window.location.href = 'teacher_dash.html';
      } else {
        errorMessage.textContent = data.error || 'Login failed. Try again.';
      }
    } catch (err) {
      hideLoading();
      console.error('Teacher login error:', err);
      errorMessage.textContent = 'Server error. Please try again later.';
    }
  });
}

// ============================= Teacher Dashboard =============================
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
      const res = await fetch(`${backendURL}/teacher`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        hideLoading();
        localStorage.removeItem('teacherToken');
        return window.location.href = 'teacher.html';
      }

      const teacher = await res.json();
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

// ============================= Student Dashboard =============================
function logout() {
  localStorage.removeItem('token');
  window.location.href = 'student.html';
}

if (document.getElementById('name')) {
  document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) return showAlertWithLoading('Session expired. Please log in again.');

    try {
      showLoading();
      const res = await fetch(`${backendURL}/student`, {
        headers: { Authorization: `Bearer ${token}` }
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

// ============================= Student Attendance =============================
if (document.querySelector('#attendanceTable tbody')) {
  document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) return showAlertWithLoading('Session expired. Please log in again.');

    try {
      showLoading();
      const res = await fetch(`${backendURL}/api/student-attendance`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to fetch attendance');

      const attendance = await res.json();
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

// ============================= Student Result Portal =============================
if (document.getElementById('marksTableBody')) {
  document.addEventListener('DOMContentLoaded', async () => {
    const regNumber = new URLSearchParams(window.location.search).get('reg');
    if (!regNumber) return;

    try {
      const res = await fetch(`${backendURL}/result?reg=${regNumber}`);
      const data = await res.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      document.getElementById('name').textContent = data.name || 'N/A';
      document.getElementById('fname').textContent = data.fname || data.fatherName || 'N/A';
      document.getElementById('reg').textContent = data.reg || 'N/A';
      document.getElementById('examType').textContent = data.examType || 'N/A';
      document.getElementById('examDate').textContent = data.examDate
        ? new Date(data.examDate).toLocaleDateString()
        : 'N/A';
      document.getElementById('class').textContent = data.class || 'N/A';

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
          tableBody.innerHTML += `
            <tr>
              <td>${subject}</td>
              <td>${obtained}</td>
              <td>${total}</td>
            </tr>`;
        }
      }

      document.getElementById('totalObt').textContent = data.totalObtainedSum ?? '0';
      document.getElementById('totalMax').textContent = data.totalMaxSum ?? '0';
      document.getElementById('percentage').textContent =
        data.percentage != null ? data.percentage + '%' : 'N/A';
    } catch (err) {
      console.error('Error loading result:', err);
      alert('Failed to fetch result.');
    }
  });
}

// ============================= Latest News =============================
if (document.getElementById('news-paragraph')) {
  window.addEventListener('DOMContentLoaded', () => {
    fetch(`${backendURL}/latest-news`)
      .then(res => res.json())
      .then(data => {
        document.getElementById('news-paragraph').textContent = data.content || 'No news available.';
      })
      .catch(() => {
        document.getElementById('news-paragraph').textContent = 'Failed to load news.';
      });
  });
}
