const openBtn = document.querySelector('.new-task-btn');
const closeBtn = document.querySelector('#closeModalBtn');
const saveBtn = document.querySelector('#saveModalBtn');
const modal = document.querySelector('#taskModal');

const titleInput = document.querySelector('.modal-box input[type="text"]');
const descInput = document.querySelector('.modal-box textarea');
const prioritySelect = document.querySelector('.modal-box select');
const modalTitle = document.querySelector('.modal-box h3');

const searchInput = document.querySelector('#search');
const filterSelect = document.querySelector('#filter');

let editingCard = null;

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

function saveToLocalStorage() {
    const boards = document.querySelectorAll('.kanban-boards');
    const data = [];
    
    boards.forEach((board, index) => {
        const tasks = [];
        board.querySelectorAll('.task-card').forEach(card => {
            tasks.push({
                title: card.querySelector('h5').textContent,
                desc: card.querySelector('p').textContent,
                priority: card.dataset.priority
            });
        });
        data.push({ boardIndex: index, tasks: tasks });
    });
    
    localStorage.setItem('kanbanTasks', JSON.stringify(data));
}

function loadFromLocalStorage() {
    const savedData = JSON.parse(localStorage.getItem('kanbanTasks'));
    if (!savedData) return;

    const boards = document.querySelectorAll('.kanban-boards');
    savedData.forEach(boardData => {
        const board = boards[boardData.boardIndex];
        if (!board) return;
        
        const taskPart = board.querySelector('.task-part');
        boardData.tasks.forEach(task => {
            const taskCard = buildCard(task.title, task.desc, task.priority);
            board.insertBefore(taskCard, taskPart);
        });
    });
}

function updateTaskCounts() {
    const boards = document.querySelectorAll('.kanban-boards');

    boards.forEach(board => {
        const countP = board.querySelector('.count-p');
        const taskPart = board.querySelector('.task-part');
        const allCards = board.querySelectorAll('.task-card');

        if (countP) countP.textContent = allCards.length;

        if (taskPart) {
            if (allCards.length > 0) {
                taskPart.style.setProperty('display', 'none', 'important');
            } else {
                taskPart.style.setProperty('display', 'flex', 'important');
            }
        }
    });
}

openBtn.addEventListener('click', () => {
    editingCard = null;
    modalTitle.textContent = "Yeni Tapşırıq";
    titleInput.value = '';
    descInput.value = '';
    prioritySelect.selectedIndex = 0; 
    modal.style.display = 'flex';
});

closeBtn.addEventListener('click', () => modal.style.display = 'none');
window.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
});

function attachDragEvents(card) {
    card.addEventListener('dragstart', () => card.classList.add('dragging'));
    card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        updateTaskCounts();
        saveToLocalStorage(); 
    });
}

function attachCardActions(card) {
    const editBtn = card.querySelector('.edit-btn');
    const deleteBtn = card.querySelector('.delete-btn');

    deleteBtn.addEventListener('click', () => {
        if (confirm('Bu tapşırığı silmək istədiyinizə əminsiniz?')) {
            card.remove();
            updateTaskCounts();
            filterAndSearchTasks();
            saveToLocalStorage(); 
        }
    });

    editBtn.addEventListener('click', () => {
        editingCard = card;
        modalTitle.textContent = "Tapşırığa Düzəliş Et";
        titleInput.value = card.querySelector('h5').textContent;
        descInput.value = card.querySelector('p').textContent;
        
        const currentPriority = card.dataset.priority;
        for (let option of prioritySelect.options) {
            if (option.value === currentPriority || option.text.includes(currentPriority)) {
                prioritySelect.value = option.value;
                break;
            }
        }
        
        modal.style.display = 'flex';
    });
}

function buildCard(titleValue, descValue, priorityVal) {
    const taskCard = document.createElement('div');
    taskCard.classList.add('task-card');
    taskCard.setAttribute('draggable', 'true');
    taskCard.dataset.priority = priorityVal;

    let priorityClass = 'priority-low';
    if (priorityVal === 'Orta' || priorityVal.toLowerCase().includes('orta')) {
        priorityClass = 'priority-medium';
    } else if (priorityVal === 'Yüksək' || priorityVal.toLowerCase().includes('yüksək')) {
        priorityClass = 'priority-high';
    }

    taskCard.innerHTML = `
        <h5>${escapeHTML(titleValue)}</h5>
        <p>${escapeHTML(descValue || 'Açıqlama yoxdur')}</p>
        <div class="task-card-footer">
            <span class="priority-badge ${priorityClass}">${escapeHTML(priorityVal)}</span>
            <div class="task-actions">
                <button class="task-action-btn edit-btn"><i class="fa-solid fa-pen"></i> Düzəliş</button>
                <button class="task-action-btn delete-btn"><i class="fa-solid fa-trash"></i> Sil</button>
            </div>
        </div>
    `;

    attachDragEvents(taskCard);
    attachCardActions(taskCard);
    
    return taskCard;
}

const boards = document.querySelectorAll('.kanban-boards');
boards.forEach(board => {
    board.addEventListener('dragover', (e) => {
        e.preventDefault();
        board.classList.add('drag-over');
    });
    board.addEventListener('dragleave', () => board.classList.remove('drag-over'));
    board.addEventListener('drop', (e) => {
        e.preventDefault();
        board.classList.remove('drag-over');
        const draggingCard = document.querySelector('.dragging');
        const taskPart = board.querySelector('.task-part');
        if (draggingCard) {
            board.insertBefore(draggingCard, taskPart);
            updateTaskCounts();
            saveToLocalStorage(); 
        }
    });
});

saveBtn.addEventListener('click', () => {
    const titleValue = titleInput.value.trim();
    const descValue = descInput.value.trim();
    const selectedPriority = prioritySelect.value; 

    if (titleValue === '') {
        alert('Zəhmət olmasa başlığı daxil edin!');
        return;
    }

    if (!editingCard) {
        const existingTasks = Array.from(document.querySelectorAll('.task-card h5'));
        const isDuplicate = existingTasks.some(h5 => h5.textContent.trim().toLowerCase() === titleValue.toLowerCase());
        
        if (isDuplicate) {
            alert('Bu adda tapşırıq artıq mövcuddur! Fərqli ad daxil edin.');
            return;
        }
    }

    let priorityVal = selectedPriority;
    let priorityClass = 'priority-low';

    if (selectedPriority === 'Orta' || selectedPriority.toLowerCase().includes('orta')) {
        priorityVal = 'Orta';
        priorityClass = 'priority-medium';
    } else if (selectedPriority === 'Yüksək' || selectedPriority.toLowerCase().includes('yüksək')) {
        priorityVal = 'Yüksək';
        priorityClass = 'priority-high';
    }

    if (editingCard) {
        editingCard.querySelector('h5').textContent = titleValue;
        editingCard.querySelector('p').textContent = descValue || 'Açıqlama yoxdur';
        
        const badge = editingCard.querySelector('.priority-badge');
        badge.className = `priority-badge ${priorityClass}`;
        badge.textContent = priorityVal;
        editingCard.dataset.priority = priorityVal;
    } else {
        const firstBoard = document.querySelectorAll('.kanban-boards')[0];
        const taskPart = firstBoard.querySelector('.task-part');
        const taskCard = buildCard(titleValue, descValue, priorityVal);
        firstBoard.insertBefore(taskCard, taskPart);
    }

    updateTaskCounts();
    filterAndSearchTasks();
    saveToLocalStorage(); 

    titleInput.value = '';
    descInput.value = '';
    modal.style.display = 'none';
});

function filterAndSearchTasks() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const filterValue = filterSelect.value;

    const cards = document.querySelectorAll('.task-card');

    cards.forEach(card => {
        const title = card.querySelector('h5').textContent.toLowerCase();
        const description = card.querySelector('p').textContent.toLowerCase();
        const cardPriority = card.dataset.priority;

        const matchesSearch = title.includes(searchTerm) || description.includes(searchTerm);
        
        let matchesFilter = true;
        if (filterValue !== 'all') {
            matchesFilter = cardPriority === filterValue;
        }

        if (matchesSearch && matchesFilter) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

searchInput.addEventListener('input', filterAndSearchTasks);
filterSelect.addEventListener('change', filterAndSearchTasks);

document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    updateTaskCounts();
});


let autoScrollAnimation;
let scrollDirection = 0;
const scrollSpeed = 12; 
const edgeThreshold = 80; 

function autoScroll() {
    if (scrollDirection !== 0) {
        window.scrollBy(0, scrollDirection);
        autoScrollAnimation = requestAnimationFrame(autoScroll);
    }
}

document.addEventListener('dragover', (e) => {
    e.preventDefault();    
    const mouseY = e.clientY; 
    const windowHeight = window.innerHeight; 

    if (windowHeight - mouseY < edgeThreshold) {
        if (scrollDirection === 0) {
            scrollDirection = scrollSpeed;
            autoScrollAnimation = requestAnimationFrame(autoScroll);
        }
    } 
    else if (mouseY < edgeThreshold) {
        if (scrollDirection === 0) {
            scrollDirection = -scrollSpeed;
            autoScrollAnimation = requestAnimationFrame(autoScroll);
        }
    } 
    else {
        scrollDirection = 0;
        cancelAnimationFrame(autoScrollAnimation);
    }
});

document.addEventListener('dragend', () => {
    scrollDirection = 0;
    cancelAnimationFrame(autoScrollAnimation);
});