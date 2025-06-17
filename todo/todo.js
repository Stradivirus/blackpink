const API_BASE = 'http://localhost:8000/todo';

let currentCategory = "전체";
let currentPage = 1;
const pageSize = 7;
let allTodos = [];

// 카테고리 버튼 이벤트
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentCategory = this.dataset.status;
            currentPage = 1;
            fetchTodos();
        });
    });

    // 폼 제출 이벤트
    document.getElementById('todo-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const due_date = document.getElementById('due_date').value;

        const response = await fetch(`${API_BASE}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, description, due_date, status: "등록됨" })
        });

        const resultDiv = document.getElementById('result');
        if (response.ok) {
            const data = await response.json();
            resultDiv.innerHTML = `<p>등록 완료! ID: ${data.id}</p>`;
            document.getElementById('todo-form').reset();
            fetchTodos(); // 등록 후 목록 갱신
        } else {
            resultDiv.innerHTML = `<p>등록 실패</p>`;
        }
    });

    fetchTodos();
});

// 할 일 목록 불러오기 함수
async function fetchTodos() {
    const response = await fetch(`${API_BASE}/`);
    let todos = await response.json();
    todos = todos.reverse();

    if (currentCategory === "완료") {
        todos = todos.filter(todo => todo.status === "완료");
    } else if (currentCategory !== "전체") {
        todos = todos.filter(todo => todo.status === currentCategory && todo.status !== "완료");
    } else {
        todos = todos.filter(todo => todo.status !== "완료");
    }

    allTodos = todos;
    renderTodos();
    renderPagination();
}

function renderTodos() {
    const list = document.getElementById('todo-list');
    list.innerHTML = '';
    const total = allTodos.length;
    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, total);
    for (let idx = startIdx; idx < endIdx; idx++) {
        const todo = allTodos[idx];
        const li = document.createElement('li');
        if (todo.status === "완료") li.classList.add('completed-todo');

        const infoDiv = document.createElement('div');
        infoDiv.className = 'todo-info';
        let mainText = `${todo.title} - ${todo.description}`;
        let reg = todo.created_at ? `<br><span class="todo-date">등록일: ${todo.created_at}</span>` : '';
        let due = todo.due_date ? `<br><span class="todo-date" style="display:block;font-weight:bold;margin-top:2px;">기한: ${todo.due_date}</span>` : '';
        infoDiv.innerHTML = `${mainText}${reg}${due}`;

        const indexSpan = document.createElement('span');
        indexSpan.className = 'todo-index';
        indexSpan.textContent = `${total - idx}`;

        const statusSelect = document.createElement('select');
        statusSelect.className = 'status-select';
        ["등록됨", "시작", "진행중"].forEach(opt => {
            const option = document.createElement('option');
            option.value = opt;
            option.text = opt;
            if (todo.status === opt) option.selected = true;
            statusSelect.appendChild(option);
        });
        if (todo.status === "완료") statusSelect.disabled = true;

        statusSelect.addEventListener('change', async function() {
            await fetch(`${API_BASE}/${todo.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: todo.title,
                    description: todo.description,
                    completed: todo.completed,
                    due_date: todo.due_date,
                    status: this.value,
                    created_at: todo.created_at
                })
            });
            fetchTodos();
        });

        // "완료" 버튼 추가
        const completeBtn = document.createElement('button');
        completeBtn.textContent = '완료';
        completeBtn.className = 'edit-btn';
        completeBtn.style.background = '#4caf50';
        completeBtn.style.marginLeft = '10px';
        if (todo.status === "완료") completeBtn.style.display = "none";
        completeBtn.onclick = async function() {
            await fetch(`${API_BASE}/${todo.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: todo.title,
                    description: todo.description,
                    completed: todo.completed,
                    due_date: todo.due_date,
                    status: "완료"
                })
            });
            fetchTodos();
        };

        const editBtn = document.createElement('button');
        editBtn.textContent = '수정';
        editBtn.className = 'edit-btn';
        if (todo.status === "완료") editBtn.style.display = "none";
        editBtn.onclick = function() {
            if (li.querySelector('.edit-fields')) return;

            const editDiv = document.createElement('span');
            editDiv.className = 'edit-fields';
            editDiv.innerHTML = `
                <input type="text" value="${todo.title}" class="edit-title" style="width:150px;">
                <input type="text" value="${todo.description}" class="edit-desc" style="width:400px;">
                <input type="date" value="${todo.due_date}" class="edit-date" style="width:130px;">
            `;
            const saveBtn = document.createElement('button');
            saveBtn.textContent = '저장';
            saveBtn.className = 'edit-btn';
            saveBtn.style.background = '#4f8cff';
            saveBtn.style.marginLeft = '8px';

            saveBtn.onclick = async function() {
                const newTitle = editDiv.querySelector('.edit-title').value;
                const newDesc = editDiv.querySelector('.edit-desc').value;
                const newDate = editDiv.querySelector('.edit-date').value;
                await fetch(`${API_BASE}/${todo.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: newTitle,
                        description: newDesc,
                        completed: todo.completed,
                        due_date: newDate,
                        status: statusSelect.value
                    })
                });
                fetchTodos();
            };

            editDiv.appendChild(saveBtn);
            li.innerHTML = '';
            li.appendChild(indexSpan);
            li.appendChild(editDiv);
        };

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '삭제';
        deleteBtn.className = 'delete-btn';
        deleteBtn.onclick = async function() {
            if (confirm('정말 삭제하시겠습니까?')) {
                await fetch(`${API_BASE}/${todo.id}`, {
                    method: 'DELETE'
                });
                fetchTodos();
            }
        };

        li.appendChild(indexSpan);
        li.appendChild(infoDiv);
        li.appendChild(statusSelect);
        li.appendChild(completeBtn); // 완료 버튼 추가
        li.appendChild(editBtn);
        li.appendChild(deleteBtn);
        list.appendChild(li);
    }
}

function renderPagination() {
    const total = allTodos.length;
    const pageCount = Math.ceil(total / pageSize);
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    if (pageCount <= 1) return;

    for (let i = 1; i <= pageCount; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.style.margin = "0 2px";
        btn.className = (i === currentPage) ? "category-btn active" : "category-btn";
        btn.onclick = function() {
            currentPage = i;
            renderTodos();
            renderPagination();
        };
        pagination.appendChild(btn);
    }
}