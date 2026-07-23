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

updateTaskCounts();

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

document.querySelectorAll('.task-card').forEach(card => {
    attachDragEvents(card);
    attachCardActions(card);
});

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

        const taskCard = document.createElement('div');
        taskCard.classList.add('task-card');
        taskCard.setAttribute('draggable', 'true');
        taskCard.dataset.priority = priorityVal;

        taskCard.innerHTML = `
            <h5>${titleValue}</h5>
            <p>${descValue || 'Açıqlama yoxdur'}</p>
            <div class="task-card-footer">
                <span class="priority-badge ${priorityClass}">${priorityVal}</span>
                <div class="task-actions">
                    <button class="task-action-btn edit-btn"><i class="fa-solid fa-pen"></i> Düzəliş</button>
                    <button class="task-action-btn delete-btn"><i class="fa-solid fa-trash"></i> Sil</button>
                </div>
            </div>
        `;

        attachDragEvents(taskCard);
        attachCardActions(taskCard);
        firstBoard.insertBefore(taskCard, taskPart);
    }

    updateTaskCounts();
    filterAndSearchTasks();

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