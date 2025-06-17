// API의 기본 URL을 상수로 선언 (할 일 목록을 불러오거나 조작할 때 사용)
const API_BASE = 'http://localhost:8000/todo';

// 현재 선택된 카테고리(예: 전체, 등록됨, 완료 등)
let currentCategory = "전체";
// 현재 페이지 번호 (페이지네이션용)
let currentPage = 1;
// 한 페이지에 보여줄 할 일 개수
const pageSize = 7;
// 전체 할 일 목록을 저장할 배열
let allTodos = [];

// -------------------- 초기화 및 이벤트 바인딩 --------------------
document.addEventListener('DOMContentLoaded', () => {
    // 카테고리 버튼(전체, 등록됨, 완료 등)에 클릭 이벤트 등록
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // 모든 카테고리 버튼에서 'active' 클래스 제거
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            // 클릭한 버튼에만 'active' 클래스 추가
            this.classList.add('active');
            // 현재 카테고리 상태를 버튼의 data-status 값으로 변경
            currentCategory = this.dataset.status;
            // 페이지를 1로 초기화
            currentPage = 1;
            // 새로운 카테고리에 맞는 할 일 목록 불러오기
            fetchTodos();
        });
    });

    // 할 일 등록 폼 제출 이벤트 처리
    document.getElementById('todo-form').addEventListener('submit', async function(e) {
        e.preventDefault(); // 폼의 기본 제출 동작(새로고침) 방지
        // 입력값 가져오기
        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const due_date = document.getElementById('due_date').value;

        // 할 일 등록 요청(POST)
        const response = await fetch(`${API_BASE}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, description, due_date, status: "등록됨" })
        });

        const resultDiv = document.getElementById('result');
        if (response.ok) {
            // 등록 성공 시 결과 표시 및 폼 초기화, 목록 갱신
            const data = await response.json();
            resultDiv.innerHTML = `<p>등록 완료! ID: ${data.id}</p>`;
            document.getElementById('todo-form').reset();
            fetchTodos(); // 등록 후 목록 갱신
        } else {
            // 등록 실패 시 메시지 표시
            resultDiv.innerHTML = `<p>등록 실패</p>`;
        }
    });

    // 페이지 최초 진입 시 할 일 목록 불러오기
    fetchTodos();
});

// -------------------- 할 일 목록 불러오기 --------------------
async function fetchTodos() {
    // 서버에서 할 일 목록 전체 불러오기
    const response = await fetch(`${API_BASE}/`);
    let todos = await response.json();
    todos = todos.reverse(); // 최신 등록순으로 정렬

    // 현재 카테고리에 따라 목록 필터링
    if (currentCategory === "완료") {
        todos = todos.filter(todo => todo.status === "완료");
    } else if (currentCategory !== "전체") {
        // '전체'가 아니고 '완료'도 아닌 경우, 해당 상태만 필터링
        todos = todos.filter(todo => todo.status === currentCategory && todo.status !== "완료");
    } else {
        // '전체'인 경우, 완료된 항목은 제외
        todos = todos.filter(todo => todo.status !== "완료");
    }

    allTodos = todos; // 필터링된 목록 저장
    renderTodos(); // 목록 화면에 표시
    renderPagination(); // 페이지네이션 표시
}

// -------------------- 할 일 목록 렌더링 --------------------
function renderTodos() {
    const list = document.getElementById('todo-list');
    list.innerHTML = ''; // 기존 목록 초기화
    const total = allTodos.length;
    // 현재 페이지에 해당하는 할 일 인덱스 계산
    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, total);

    // 현재 페이지에 표시할 할 일만 반복 처리
    for (let idx = startIdx; idx < endIdx; idx++) {
        const todo = allTodos[idx];
        const li = document.createElement('li');
        // 완료된 할 일은 스타일 다르게 표시
        if (todo.status === "완료") li.classList.add('completed-todo');

        // 할 일 정보 영역 생성
        const infoDiv = document.createElement('div');
        infoDiv.className = 'todo-info';
        let mainText = `${todo.title} - ${todo.description}`;
        let reg = todo.created_at ? `<br><span class="todo-date">등록일: ${todo.created_at}</span>` : '';
        let due = todo.due_date ? `<br><span class="todo-date" style="display:block;font-weight:bold;margin-top:2px;">기한: ${todo.due_date}</span>` : '';
        infoDiv.innerHTML = `${mainText}${reg}${due}`;

        // 목록 번호 표시 (최신이 1번)
        const indexSpan = document.createElement('span');
        indexSpan.className = 'todo-index';
        indexSpan.textContent = `${total - idx}`;

        // 상태 변경 select 박스 생성
        const statusSelect = document.createElement('select');
        statusSelect.className = 'status-select';
        ["등록됨", "시작", "진행중"].forEach(opt => {
            const option = document.createElement('option');
            option.value = opt;
            option.text = opt;
            if (todo.status === opt) option.selected = true;
            statusSelect.appendChild(option);
        });
        // 완료된 항목은 상태 변경 불가
        if (todo.status === "완료") statusSelect.disabled = true;

        // 상태 변경 시 서버에 반영
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

        // "완료" 버튼 생성 및 이벤트
        const completeBtn = document.createElement('button');
        completeBtn.textContent = '완료';
        completeBtn.className = 'edit-btn';
        completeBtn.style.background = '#4caf50';
        completeBtn.style.marginLeft = '10px';
        // 이미 완료된 항목은 "완료" 버튼 숨김
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

        // "수정" 버튼 생성 및 이벤트
        const editBtn = document.createElement('button');
        editBtn.textContent = '수정';
        editBtn.className = 'edit-btn';
        // 완료된 항목은 수정 불가
        if (todo.status === "완료") editBtn.style.display = "none";
        editBtn.onclick = function() {
            // 이미 수정 입력창이 열려있으면 무시
            if (li.querySelector('.edit-fields')) return;

            // 수정 입력창 생성
            const editDiv = document.createElement('span');
            editDiv.className = 'edit-fields';
            editDiv.innerHTML = `
                <input type="text" value="${todo.title}" class="edit-title" style="width:150px;">
                <input type="text" value="${todo.description}" class="edit-desc" style="width:400px;">
                <input type="date" value="${todo.due_date}" class="edit-date" style="width:130px;">
            `;
            // 저장 버튼 생성
            const saveBtn = document.createElement('button');
            saveBtn.textContent = '저장';
            saveBtn.className = 'edit-btn';
            saveBtn.style.background = '#4f8cff';
            saveBtn.style.marginLeft = '8px';

            // 저장 버튼 클릭 시 수정 내용 서버에 반영
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
            // 기존 li 내용 지우고 수정 입력창만 표시
            li.innerHTML = '';
            li.appendChild(indexSpan);
            li.appendChild(editDiv);
        };

        // "삭제" 버튼 생성 및 이벤트
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

        // 할 일 항목에 각 요소 추가
        li.appendChild(indexSpan);
        li.appendChild(infoDiv);
        li.appendChild(statusSelect);
        li.appendChild(completeBtn); // 완료 버튼 추가
        li.appendChild(editBtn);
        li.appendChild(deleteBtn);
        list.appendChild(li);
    }
}

// -------------------- 페이지네이션 렌더링 --------------------
function renderPagination() {
    const total = allTodos.length;
    const pageCount = Math.ceil(total / pageSize); // 전체 페이지 수 계산
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    // 페이지가 1개 이하라면 페이지네이션 표시 안 함
    if (pageCount <= 1) return;

    // 각 페이지 버튼 생성 및 이벤트 등록
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
