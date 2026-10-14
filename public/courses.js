document.addEventListener('DOMContentLoaded', () => {
    const courseForm = document.getElementById('courseForm');
    const courseTableBody = document.getElementById('courseTableBody');
    const refreshBtn = document.getElementById('refreshBtn');
    const statusMessage = document.getElementById('statusMessage');

    const courseIdSearch = document.getElementById('courseIdSearch');

    const API_URL = '/api/courses';

    // Fetch data from the API and populate the table
    async function loadCourses() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Could not pull course data from database.');
            
            const result = await response.json();
            if (result.success && Array.isArray(result.data)) {
                populateTable(result.data);
            } else {
                throw new Error(result.error || 'Server structure mismatch.');
            }
        } catch (error) {
            displayStatus(error.message, 'danger');
        }
    }


    // Populate the table with course data
    function populateTable(courses) {
        courseTableBody.innerHTML = '';

        if (courses.length === 0) {
            courseTableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted py-4">No course records found inside the database.</td>
                </tr>`;
            return;
        }

        courses.forEach(course => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="fw-bold">${sanitize(course.courseNo)}</td>
                <td>${sanitize(course.courseDesc)}</td>
                <td>${sanitize(course.lastSemTaught)}</td>
                <td class="text-end fw-bold">${parseInt(course.maxStudents, 10)}</td>
            `;
            courseTableBody.appendChild(tr);
        });
    }

    //seaches for a course by ID and populates the table with the result
    courseSearchForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const courseId = courseIdSearch.value.trim();
        if (!/^[1-9]\d*$/.test(courseId)) {
            populateTableMessage('Enter a valid course ID.');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/${encodeURIComponent(courseId)}`);
            const result = await response.json();

            if (response.status === 404) {
                populateTableMessage(`No course found with ID ${courseId}.`);
                return;
            }
            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Could not search for this course.');
            }

            populateTable([result.data]);
        } catch (error) {
            displayStatus(error.message, 'danger');
        }
    });

    // uses event listener to handle form submission and send data to the API
    courseForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const payload = {
            courseNo: document.getElementById('courseNo').value.trim(),
            courseDesc: document.getElementById('courseDesc').value.trim(),
            lastSemTaught: document.getElementById('lastSemTaught').value.trim(),
            maxStudents: parseInt(document.getElementById('maxStudents').value, 10)
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Failed to submit course data to API.');
            }

            displayStatus('Course registered successfully!', 'success');
            courseForm.reset();
            loadCourses(); //refresh the table to show the new course
        } catch (error) {
            displayStatus(error.message, 'danger');
        }
    });

    // Notifications
    function displayStatus(msg, alertType) {
        statusMessage.textContent = msg;
        statusMessage.className = `p-3 mb-3 fw-bold text-center rounded`;
        
        if (alertType === 'success') {
            statusMessage.style.backgroundColor = '#d1e7dd';
            statusMessage.style.color = '#0f5132';
        } else {
            statusMessage.style.backgroundColor = '#f8d7da';
            statusMessage.style.color = '#842029';
        }
        
        statusMessage.classList.remove('d-none');
        setTimeout(() => statusMessage.classList.add('d-none'), 4000);
    }

    function sanitize(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    refreshBtn.addEventListener('click', loadCourses);
    loadCourses();
});