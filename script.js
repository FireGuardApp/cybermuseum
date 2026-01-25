const game = {
    rows: 10, cols: 10, mines: 15,
    board: [], gameOver: false,
    minesRemaining: 15, seconds: 0,
    timerInterval: null, firstClick: true,
    touchMode: 'scan',

    init() {
        this.gameOver = false;
        this.seconds = 0;
        this.firstClick = true;
        clearInterval(this.timerInterval);
        
        const diff = document.getElementById('difficulty').value;
        if(diff === 'easy') { this.rows = 10; this.cols = 10; this.mines = 15; }
        if(diff === 'medium') { this.rows = 15; this.cols = 15; this.mines = 35; }
        if(diff === 'hard') { this.rows = 20; this.cols = 20; this.mines = 80; }

        this.minesRemaining = this.mines;
        document.getElementById('timer').innerText = "000";
        document.getElementById('mine-count').innerText = this.minesRemaining.toString().padStart(3, '0');
        document.getElementById('modal-screen').classList.remove('active');
        
        this.createBoard();
        this.updateBestScore();
    },

    createBoard() {
        const grid = document.getElementById('grid');
        grid.style.gridTemplateColumns = `repeat(${this.cols}, 1fr)`;
        grid.innerHTML = '';
        this.board = [];

        for (let r = 0; r < this.rows; r++) {
            let row = [];
            for (let c = 0; c < this.cols; c++) {
                const el = document.createElement('div');
                el.classList.add('cell');
                el.addEventListener('click', () => this.handleCellClick(r, c));
                el.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.toggleFlag(r, c);
                });
                grid.appendChild(el);
                row.push({ isMine: false, revealed: false, flagged: false, count: 0, el });
            }
            this.board.push(row);
        }
    },

    handleCellClick(r, c) {
        if (this.gameOver || this.board[r][c].flagged) return;
        if (this.touchMode === 'flag') return this.toggleFlag(r, c);

        if (this.firstClick) {
            this.firstClick = false;
            this.placeMines(r, c);
            this.startTimer();
        }

        const cell = this.board[r][c];
        if (cell.isMine) return this.endGame(false);

        this.reveal(r, c);
        this.checkWin();
    },

    placeMines(exR, exC) {
        let placed = 0;
        while (placed < this.mines) {
            let r = Math.floor(Math.random() * this.rows);
            let c = Math.floor(Math.random() * this.cols);
            if (!this.board[r][c].isMine && (r !== exR || c !== exC)) {
                this.board[r][c].isMine = true;
                placed++;
            }
        }
        this.calculateNumbers();
    },

    calculateNumbers() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.board[r][c].isMine) continue;
                let count = 0;
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        if (this.board[r+i]?.[c+j]?.isMine) count++;
                    }
                }
                this.board[r][c].count = count;
            }
        }
    },

    reveal(r, c) {
        const cell = this.board[r]?.[c];
        if (!cell || cell.revealed || cell.flagged) return;

        cell.revealed = true;
        cell.el.classList.add('revealed');
        if (cell.count > 0) {
            cell.el.innerText = cell.count;
            cell.el.style.color = `var(--neon-${['cyan','green','red'][cell.count%3]})`;
        } else {
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) this.reveal(r+i, c+j);
            }
        }
    },

    toggleFlag(r, c) {
        const cell = this.board[r][c];
        if (cell.revealed || this.gameOver) return;
        cell.flagged = !cell.flagged;
        cell.el.classList.toggle('flagged');
        this.minesRemaining += cell.flagged ? -1 : 1;
        document.getElementById('mine-count').innerText = this.minesRemaining.toString().padStart(3, '0');
    },

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.seconds++;
            document.getElementById('timer').innerText = this.seconds.toString().padStart(3, '0');
        }, 1000);
    },

    endGame(win) {
        this.gameOver = true;
        clearInterval(this.timerInterval);
        this.board.flat().forEach(c => { if(c.isMine) c.el.classList.add('mine'); });
        
        const modal = document.getElementById('modal-screen');
        document.getElementById('modal-title').innerText = win ? "ACCESS GRANTED" : "SYSTEM FAILURE";
        document.getElementById('modal-title').className = win ? "win-text" : "lose-text";
        modal.classList.add('active');
        if(win) this.saveScore();
    },

    checkWin() {
        const won = this.board.flat().every(c => c.isMine || c.revealed);
        if (won) this.endGame(true);
    },

    saveScore() {
        const diff = document.getElementById('difficulty').value;
        const best = localStorage.getItem('best_' + diff);
        if(!best || this.seconds < best) localStorage.setItem('best_' + diff, this.seconds);
    },

    updateBestScore() {
        const diff = document.getElementById('difficulty').value;
        document.getElementById('best-score').innerText = localStorage.getItem('best_' + diff) || "--";
    }
};

// Event listeners
document.getElementById('reset-btn').addEventListener('click', () => game.init());
document.getElementById('modal-retry').addEventListener('click', () => game.init());
document.getElementById('difficulty').addEventListener('change', () => game.init());
document.getElementById('mode-scan').addEventListener('click', () => {
    game.touchMode = 'scan';
    document.getElementById('mode-scan').classList.add('active');
    document.getElementById('mode-flag').classList.remove('active');
});
document.getElementById('mode-flag').addEventListener('click', () => {
    game.touchMode = 'flag';
    document.getElementById('mode-flag').classList.add('active');
    document.getElementById('mode-scan').classList.remove('active');
});

window.onload = () => game.init();