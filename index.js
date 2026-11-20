// ==========================================
// ⚙️ ตั้งค่าข้อมูลบูธ และจุดเชื่อมต่อ Server (AWS EC2)
// ==========================================
const BOOTH_ID = "G13";
const CHALLENGE_TITLE = "Memory Card Game";

// เมื่อ "บู" ทำ Server AWS EC2 เสร็จ ให้ใส่ URL ที่นี่ (เช่น "http://54.123.45.67:3000/api/portfolio")
// หากยังไม่มีให้เว้นว่าง "" ไว้ ระบบจะบันทึกลงเครื่อง (localStorage) ให้อัตโนมัติ
const SERVER_API_URL = ""; 

// ==========================================
// 🎮 ส่วนที่ 1: ระบบเกม Memory Card (โค้ดเดิมของเพื่อน)
// ==========================================
const gridContainer = document.querySelector(".grid-container");
let cards = [];
let firstCard, secondCard;
let lockBoard = false;
let score = 0;
let timeLeft = 35;
let timerInterval = null;
let gameStarted = false;
let gameOver = false;
let matchedPairs = 0;

document.querySelector(".score").textContent = score;

fetch("./data/cards.json")
    .then(res => res.json())
    .then(data => {
        cards = [...data, ...data];
        shuffleCards();
        generateCards();
    });

function shuffleCards() {
    let currentIndex = cards.length, randomIndex, temporaryValue;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = cards[currentIndex];
        cards[currentIndex] = cards[randomIndex];
        cards[randomIndex] = temporaryValue;
    }
}

function generateCards() {
    for (let card of cards) {
        const cardElement = document.createElement('div');
        cardElement.classList.add('card');
        cardElement.setAttribute('data-name', card.name);
        cardElement.innerHTML = `
            <div class="front">
                <img class="front-image" src="${card.image}" alt="${card.name}">
            </div>
            <div class="back"></div>
        `;
        gridContainer.appendChild(cardElement);
        cardElement.addEventListener('click', flipCard);
    }
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        document.querySelector(".timer").textContent = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            gameOver = true;
            lockBoard = true;
            alert("Time's up! Game Over!");
            showChallengeExportJSON("Time's Up");
        }
    }, 1000);
}

function flipCard() {
    if (lockBoard || gameOver) return;
    if (this === firstCard) return;

    if (!gameStarted) {
        gameStarted = true;
        startTimer();
    }

    this.classList.add('flipped');

    if (!firstCard) {
        firstCard = this;
        return;
    }

    secondCard = this;
    lockBoard = true;
    checkForMatch();
}

function checkForMatch() {
    let isMatch = firstCard.dataset.name === secondCard.dataset.name;
    if (isMatch) {
        score++;
        document.querySelector(".score").textContent = score;
        disableCards();
    } else {
        unflipCards();
    }
}

function disableCards() {
    firstCard.removeEventListener('click', flipCard);
    secondCard.removeEventListener('click', flipCard);
    matchedPairs++;

    if (matchedPairs === cards.length / 2) {
        clearInterval(timerInterval);
        gameOver = true;
        alert("Congratulations! You Win!");
        showChallengeExportJSON("Completed (Win)");
    }

    resetBoard();
}

function unflipCards() {
    setTimeout(() => {
        firstCard.classList.remove('flipped');
        secondCard.classList.remove('flipped');
        resetBoard();
    }, 1000);
}

function resetBoard() {
    [firstCard, secondCard] = [null, null];
    lockBoard = false;
}

function restart() {
    clearInterval(timerInterval);
    resetBoard();
    shuffleCards();

    score = 0;
    timeLeft = 35;
    gameStarted = false;
    gameOver = false;
    matchedPairs = 0;

    document.querySelector(".score").textContent = score;
    document.querySelector(".timer").textContent = timeLeft;
    document.getElementById("challenge-export-box").classList.add("hidden");

    gridContainer.innerHTML = '';
    generateCards();
}

// ==========================================
// 📤 ส่วนที่ 2: สร้างและส่งออก Portfolio Item JSON หลังเล่นจบ
// ==========================================
function showChallengeExportJSON(statusText) {
    const portfolioItem = {
        id: `item-${Date.now()}`,
        booth: BOOTH_ID,
        title: CHALLENGE_TITLE,
        result: `Status: ${statusText} | Score: ${score}/${cards.length / 2} | Time Left: ${timeLeft}s`,
        reflection: "",
        evidence: "",
        completedAt: new Date().toISOString()
    };

    const jsonString = JSON.stringify(portfolioItem, null, 2);
    document.getElementById("generated-json-output").value = jsonString;
    const exportBox = document.getElementById("challenge-export-box");
    exportBox.classList.remove("hidden");
    exportBox.scrollIntoView({ behavior: "smooth" });
}

function copyChallengeJSON() {
    const text = document.getElementById("generated-json-output").value;
    navigator.clipboard.writeText(text).then(() => {
        alert("คัดลอก Portfolio Item JSON เรียบร้อยแล้ว!");
    });
}

function downloadChallengeJSON() {
    const text = document.getElementById("generated-json-output").value;
    downloadJSONFile(text, `portfolio-item-${BOOTH_ID}.json`);
}

// ==========================================
// 📁 ส่วนที่ 3: ระบบจัดการ My Portfolio (Import / Edit / Export / Server)
// ==========================================
let myPortfolioItems = [];

// สลับหน้า Tab
function switchTab(tabName) {
    document.getElementById("section-challenge").classList.toggle("hidden", tabName !== "challenge");
    document.getElementById("section-portfolio").classList.toggle("hidden", tabName !== "portfolio");
    document.getElementById("tab-challenge").classList.toggle("active", tabName === "challenge");
    document.getElementById("tab-portfolio").classList.toggle("active", tabName === "portfolio");

    if (tabName === "portfolio") {
        loadPortfolioData();
    }
}

// โหลดข้อมูลจาก Server (ถ้ามี) หรือจาก LocalStorage
async function loadPortfolioData() {
    if (SERVER_API_URL) {
        try {
            const res = await fetch(SERVER_API_URL);
            if (res.ok) {
                myPortfolioItems = await res.json();
                renderPortfolioList();
                return;
            }
        } catch (err) {
            console.warn("เชื่อมต่อ Server ไม่สำเร็จ ใช้ข้อมูลสำรองในเครื่องแทน:", err);
        }
    }

    const saved = localStorage.getItem("cs100_my_portfolio");
    myPortfolioItems = saved ? JSON.parse(saved) : [];
    renderPortfolioList();
}

// บันทึกข้อมูลลง Server (ถ้ามี) และ LocalStorage
async function savePortfolioData() {
    localStorage.setItem("cs100_my_portfolio", JSON.stringify(myPortfolioItems));

    if (SERVER_API_URL) {
        try {
            await fetch(SERVER_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(myPortfolioItems)
            });
        } catch (err) {
            console.error("บันทึกข้อมูลลง Server ไม่สำเร็จ:", err);
        }
    }
}

// อัปโหลดไฟล์ .json จากเครื่อง
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById("import-json-input").value = e.target.result;
    };
    reader.readAsText(file);
}

// นำเข้า JSON เข้าสู่ Portfolio (รองรับโครงสร้างหลากหลายจากเพื่อนกลุ่มอื่น)
async function importPortfolioItem() {
    const rawText = document.getElementById("import-json-input").value.trim();
    if (!rawText) {
        alert("กรุณาวางโค้ด JSON หรือเลือกไฟล์ก่อนกด Import");
        return;
    }

    try {
        const parsed = JSON.parse(rawText);
        // รองรับทั้งกรณีที่เป็น Object เดียว หรือ Array ของหลาย Object
        const itemsToAdd = Array.isArray(parsed) ? parsed : [parsed];

        itemsToAdd.forEach(item => {
            const normalizedItem = {
                id: item.id || `item-${Date.now()}-${Math.floor(Math.random()*1000)}`,
                booth: item.booth || item.group || item.boothId || "Unknown Booth",
                title: item.title || item.challenge || item.name || "Untitled Challenge",
                result: item.result || item.score || item.outcome || JSON.stringify(item),
                reflection: item.reflection || "",
                evidence: item.evidence || "",
                importedAt: new Date().toISOString()
            };
            myPortfolioItems.push(normalizedItem);
        });

        await savePortfolioData();
        renderPortfolioList();
        document.getElementById("import-json-input").value = "";
        document.getElementById("import-file-input").value = "";
        alert("Import ข้อมูลเข้า Portfolio สำเร็จ!");
    } catch (error) {
        alert("รูปแบบ JSON ไม่ถูกต้อง กรุณาตรวจสอบวงเล็บหรือเครื่องหมายคำพูดอีกครั้ง");
    }
}

// แสดงรายการในหน้า Portfolio
function renderPortfolioList() {
    const listContainer = document.getElementById("portfolio-list");
    document.getElementById("portfolio-count").textContent = myPortfolioItems.length;

    if (myPortfolioItems.length === 0) {
        listContainer.innerHTML = `<p style="color:#888; font-size:16px; font-weight:normal;">ยังไม่มีรายการใน Portfolio ลองไปเล่นบูธเพื่อนแล้วเอา JSON มา Import ดูสิ!</p>`;
        return;
    }

    listContainer.innerHTML = myPortfolioItems.map((item, index) => `
        <div class="portfolio-item">
            <div class="item-top">
                <div>
                    <span class="item-badge">${item.booth}</span>
                    <strong style="font-size: 18px; margin-left: 8px; color: #191633;">${item.title}</strong>
                    <div style="font-size: 14px; color: #555; margin-top: 4px;">ผลลัพธ์: ${item.result}</div>
                </div>
                <button class="btn-danger" onclick="deletePortfolioItem(${index})">ลบรายการ</button>
            </div>

            <div class="item-field">
                <label>📝 Reflection (สิ่งที่ได้เรียนรู้จากกิจกรรมนี้):</label>
                <textarea rows="2" placeholder="พิมพ์สิ่งที่ได้เรียนรู้..." onchange="updateItemField(${index}, 'reflection', this.value)">${item.reflection || ""}</textarea>
            </div>

            <div class="item-field">
                <label>🔗 Evidence (หลักฐาน / ลิงก์รูปภาพ / บันทึกเพิ่มเติม):</label>
                <input type="text" placeholder="ใส่ลิงก์รูปภาพหรือรายละเอียดหลักฐาน..." value="${item.evidence || ""}" onchange="updateItemField(${index}, 'evidence', this.value)">
            </div>
        </div>
    `).join("");
}

// อัปเดต Reflection หรือ Evidence อัตโนมัติเมื่อพิมพ์เสร็จ
async function updateItemField(index, field, value) {
    myPortfolioItems[index][field] = value;
    await savePortfolioData();
}

// ลบรายการ
async function deletePortfolioItem(index) {
    if (confirm("ต้องการลบรายการนี้ออกจาก Portfolio ใช่ไหม?")) {
        myPortfolioItems.splice(index, 1);
        await savePortfolioData();
        renderPortfolioList();
    }
}

// ส่งออกไฟล์ my-portfolio.json ทั้งหมดเพื่อส่งอาจารย์
function exportFullPortfolio() {
    if (myPortfolioItems.length === 0) {
        alert("ยังไม่มีข้อมูลใน Portfolio กรุณา Import อย่างน้อย 1 รายการก่อน Export");
        return;
    }

    const fullPortfolioData = {
        exportedAt: new Date().toISOString(),
        totalItems: myPortfolioItems.length,
        items: myPortfolioItems
    };

    const jsonString = JSON.stringify(fullPortfolioData, null, 2);
    downloadJSONFile(jsonString, "my-portfolio.json");
}

// ฟังก์ชันช่วยดาวน์โหลดไฟล์ JSON
function downloadJSONFile(content, filename) {
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
