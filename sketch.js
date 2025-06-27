// Variáveis do jogo
let player;
let wateringCan;
let seedPacket;
let scissors;
let transportBox;
let truck;

let boxes = [];
let sprouts = [];

// Constantes
const BOX_SIZE = 40;
const GRID_COLS = 8;
const GRID_ROWS = 6;
const CENTRAL_AREA_SIZE = 150;

const MAX_PLANTS_IN_TRANSPORT_BOX = 5;
const TOTAL_PLANTS_FOR_TRUCK = 10;

let totalPlantsDelivered = 0;

let currentScreen = 'start'; // start, plantation, minigame, shop, gameOver

// Variáveis para o minigame
let truckMiniGame;
let distanceTraveled = 0;
const TARGET_DISTANCE = 1000;
let lives = 3;

// Variáveis para a fase de loja
let money = 0;
const MONEY_TARGET = 20;
let tomatoes = []; // Array para tomates na loja
let shelves = [];
let trashBin;
let customerArea; // Renomeado para área do cliente
let currentCustomerOrder = 0;
let customerWaiting = false;
let customerTimer = 0;
const CUSTOMER_PATIENCE = 400; // Aumentei a paciência para dar mais tempo ao jogador

let draggedTomato = null; // Para arrastar e soltar na loja

// --- CLASSES ---

class Player {
    constructor() {
        this.x = width / 2;
        this.y = height / 2;
        this.size = 30;
        this.speed = 3;
        this.heldItem = null;
    }

    move() {
        if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) { // A
            this.x -= this.speed;
        }
        if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) { // D
            this.x += this.speed;
        }
        if (keyIsDown(UP_ARROW) || keyIsDown(87)) { // W
            this.y -= this.speed;
        }
        if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) { // S
            this.y += this.speed;
        }

        this.x = constrain(this.x, 0, width);
        this.y = constrain(this.y, 0, height);

        if (this.heldItem) {
            this.heldItem.x = this.x;
            this.heldItem.y = this.y - this.size / 2 - this.heldItem.size / 2;
        }
    }

    display() {
        fill(255, 165, 0); // Cor de pele
        ellipse(this.x, this.y, this.size, this.size);
    }

    pickupItem(item) {
        this.heldItem = item;
        item.isPickedUp = true;
    }

    dropItem(item) {
        if (this.heldItem === item) {
            this.heldItem = null;
            item.isPickedUp = false;
        }
    }

    hasItem(item) {
        return this.heldItem === item;
    }

    dist(other) {
        return Math.sqrt(Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2));
    }
}

class Item {
    constructor(x, y, size, type) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.type = type;
        this.isPickedUp = false;
        this.currentPlants = 0; // Para transportBox
    }

    display() {
        push();
        translate(this.x, this.y);
        rectMode(CENTER);

        if (this.isPickedUp) {
            pop();
            return;
        }

        switch (this.type) {
            case 'wateringCan':
                fill(0, 100, 200);
                rect(0, 0, this.size, this.size);
                fill(0, 50, 100);
                rect(this.size / 4, -this.size / 2, this.size / 2, this.size); // Bico
                break;
            case 'seedPacket':
                fill(100, 50, 0);
                rect(0, 0, this.size, this.size);
                fill(255);
                textSize(this.size * 0.6);
                textAlign(CENTER, CENTER);
                text("S", 0, 0);
                break;
            case 'scissors':
                fill(150);
                rect(0, 0, this.size, this.size);
                fill(0);
                rect(-this.size / 4, 0, this.size / 2, 2);
                rect(this.size / 4, 0, this.size / 2, 2);
                break;
            case 'transportBox':
                fill(139, 69, 19);
                rect(0, 0, this.size, this.size);
                fill(0);
                textSize(this.size * 0.4);
                textAlign(CENTER, CENTER);
                text(`${this.currentPlants}/${MAX_PLANTS_IN_TRANSPORT_BOX}`, 0, 0);
                break;
        }
        pop();
    }

    activate() {
        // Ação do item
    }

    addPlant() {
        if (this.type === 'transportBox' && this.currentPlants < MAX_PLANTS_IN_TRANSPORT_BOX) {
            this.currentPlants++;
        }
    }

    resetPlants() {
        if (this.type === 'transportBox') {
            this.currentPlants = 0;
        }
    }
}

class Box {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = BOX_SIZE;
        this.hasSprout = false;
    }

    display() {
        fill(100, 70, 40);
        rectMode(CENTER);
        rect(this.x, this.y, this.size, this.size, 5);
    }
}

class Sprout {
    constructor(x, y, parentBox) {
        this.x = x;
        this.y = y;
        this.size = 10;
        this.state = 'seed'; // seed, thirsty, growing, mature, dead
        this.waterLevel = 0;
        this.growthProgress = 0;
        this.maxWater = 50;
        this.maxGrowth = 150;
        this.parentBox = parentBox;
        this.thirstyTimer = 0;
        this.deathTimer = 0;
    }

    update() {
        if (this.state === 'seed') {
            this.state = 'thirsty';
        } else if (this.state === 'thirsty') {
            this.thirstyTimer++;
            if (this.thirstyTimer > 800) { // Tempo para morrer de sede
                this.state = 'dead';
            }
        } else if (this.state === 'growing') {
            this.growthProgress++;
            this.size = map(this.growthProgress, 0, this.maxGrowth, 10, 30);
            if (this.growthProgress >= this.maxGrowth) {
                this.state = 'mature';
            }
            this.waterLevel--; // Consome água enquanto cresce
            if (this.waterLevel <= 0) {
                this.state = 'thirsty';
                this.thirstyTimer = 0;
            }
        } else if (this.state === 'mature') {
            this.deathTimer++;
            if (this.deathTimer > 2000) { // Tempo para morrer depois de madura (ajustado para ser consistente)
                this.state = 'dead';
            }
        }
    }

    water() {
        if (this.state === 'thirsty') {
            this.waterLevel = this.maxWater;
            this.state = 'growing';
            this.thirstyTimer = 0;
        }
    }

    display() {
        push();
        translate(this.x, this.y);

        if (this.state === 'seed') {
            fill(100, 50, 0);
            ellipse(0, 0, this.size, this.size);
        } else if (this.state === 'thirsty') {
            fill(150, 200, 0); // Verde claro para sede
            ellipse(0, 0, this.size, this.size);
            fill(0, 0, 0, 100); // Ícone de gota de água
            ellipse(this.size / 4, -this.size / 4, this.size / 3, this.size / 2);
        } else if (this.state === 'growing') {
            fill(50, 150, 50); // Verde normal
            ellipse(0, 0, this.size, this.size);
            rect(0, 0, 2, -this.size / 2);
        } else if (this.state === 'mature') {
            fill(200, 0, 0); // Vermelho para madura (tomate)
            ellipse(0, 0, this.size, this.size);
            fill(0, 100, 0);
            ellipse(0, -this.size / 2 + 5, 5, 5); // Talo
        } else if (this.state === 'dead') {
            fill(80, 80, 80); // Cinza para morta
            ellipse(0, 0, this.size, this.size / 2);
        }
        pop();
    }
}

class Truck {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 100;
        this.height = 60;
        this.isDriving = false;
        this.targetX = width / 2;
        this.arrivalX = width - 100; // Posição para parar e coletar
        this.leaving = false;
    }

    update() {
        if (this.isDriving) {
            if (this.leaving) {
                this.x += 5;
                if (this.x > width + 100) {
                    this.isDriving = false;
                    this.leaving = false;
                    this.x = -150; // Resetar para fora da tela
                }
            } else {
                this.x = lerp(this.x, this.arrivalX, 0.05);
                if (abs(this.x - this.arrivalX) < 1) {
                    this.x = this.arrivalX;
                }
            }
        }
    }

    display() {
        fill(0, 0, 150);
        rect(this.x, this.y, this.width, this.height);
        fill(50);
        ellipse(this.x - this.width / 3, this.y + this.height / 2, 20, 20);
        ellipse(this.x + this.width / 3, this.y + this.height / 2, 20, 20);
    }

    callForPickup() {
        if (!this.isDriving) {
            this.isDriving = true;
            this.leaving = false;
            this.x = -150;
        }
    }

    depart() {
        this.leaving = true;
    }
}

class Obstacle {
    constructor(laneX, speed, type) { // laneX direto, não index
        this.x = laneX;
        this.y = -50;
        this.speed = speed;
        this.type = type;
        this.width = 40;
        this.height = 80;

        if (type === 'rock') {
            this.width = 30;
            this.height = 30;
        } else if (type === 'tree') {
            this.width = 50;
            this.height = 100;
        } else if (type === 'cone') {
            this.width = 30;
            this.height = 50;
        } else if (type === 'barrel') {
            this.width = 40;
            this.height = 60;
        } else if (type === 'sign') {
            this.width = 20;
            this.height = 60;
        }
    }

    update(truckSpeed) {
        this.y += this.speed + truckSpeed * 0.2;
    }

    display() {
        push();
        translate(this.x, this.y);
        rectMode(CENTER);

        switch (this.type) {
            case 'car':
                fill(random(0, 255), random(0, 255), random(0, 255));
                rect(0, 0, this.width, this.height);
                fill(0);
                rect(-this.width / 4, this.height / 3, this.width / 6, this.width / 6);
                rect(this.width / 4, this.height / 3, this.width / 6, this.width / 6);
                break;
            case 'rock':
                fill(100);
                ellipse(0, 0, this.width, this.height);
                break;
            case 'tree':
                fill(139, 69, 19);
                rect(0, this.height / 4, this.width / 4, this.height / 2);
                fill(34, 139, 34);
                ellipse(0, -this.height / 4, this.width, this.width);
                break;
            case 'cone':
                fill(255, 140, 0);
                triangle(-this.width / 2, this.height / 2, this.width / 2, this.height / 2, 0, -this.height / 2);
                break;
            case 'barrel':
                fill(180, 100, 0);
                ellipse(0, 0, this.width, this.height);
                fill(100, 50, 0);
                rect(0, -this.height / 2, this.width, 5);
                rect(0, this.height / 2, this.width, 5);
                break;
            case 'sign':
                fill(150, 150, 150);
                rect(0, this.height / 4, 10, this.height / 2);
                fill(255, 0, 0);
                rect(0, -this.height / 4, this.width, this.height / 2);
                fill(255);
                textSize(10);
                text("STOP", 0, -this.height / 4);
                break;
        }
        pop();
    }
}

class TruckMiniGame {
    constructor() {
        this.x = width / 2;
        this.y = height - 100;
        this.width = 60;
        this.height = 100;
        this.speed = 0;
        this.maxSpeed = 8;
        this.acceleration = 0.15;
        this.deceleration = 0.1;
        this.laneSwitchSpeed = 0.2;

        this.roadWidth = 300;
        // CORREÇÃO: Posicionamento das pistas dentro da largura da estrada
        this.laneXPositions = [
            width / 2 - this.roadWidth / 3,
            width / 2,
            width / 2 + this.roadWidth / 3
        ];
        this.currentLaneIndex = 1;
        this.targetX = this.laneXPositions[this.currentLaneIndex];

        this.linesOffset = 0;

        this.obstacles = [];
        this.obstacleSpawnTimer = 0;
        this.obstacleSpawnInterval = 60;
        this.minObstacleSpeed = 4;
        this.maxObstacleSpeed = 6;
        this.collisionBuffer = 10;

        this.powerUps = [];
        this.powerUpSpawnTimer = 0;
        this.powerUpSpawnInterval = 300;
        this.powerUpTypes = ['speedBoost', 'extraLife', 'invincibility'];

        this.invincible = false;
        this.invincibleTimer = 0;
        this.invincibleDuration = 180;

        loop();
    }

    update() {
        if (keyIsDown(UP_ARROW)) {
            this.speed = min(this.speed + this.acceleration, this.maxSpeed);
        } else if (keyIsDown(DOWN_ARROW)) {
            this.speed = max(this.speed - this.deceleration, 0);
        } else {
            this.speed = max(this.speed - this.deceleration * 0.3, 0);
        }

        this.x = lerp(this.x, this.targetX, this.laneSwitchSpeed);
        distanceTraveled += this.speed * 0.1;
        this.linesOffset = (this.linesOffset + this.speed * 2) % 80;

        this.obstacleSpawnTimer++;
        let adjustedSpawnInterval = max(30, this.obstacleSpawnInterval - (this.speed));
        if (this.obstacleSpawnTimer >= adjustedSpawnInterval) {
            if (random() > 0.7) {
                this.spawnObstacle();
            }
            this.obstacleSpawnTimer = 0;
        }

        this.powerUpSpawnTimer++;
        if (this.powerUpSpawnTimer >= this.powerUpSpawnInterval && random() > 0.8) {
            this.spawnPowerUp();
            this.powerUpSpawnTimer = 0;
        }

        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            let powerUp = this.powerUps[i];
            powerUp.y += this.speed * 0.8;

            if (dist(this.x, this.y, powerUp.x, powerUp.y) < 40) {
                this.applyPowerUp(powerUp.type);
                this.powerUps.splice(i, 1);
            } else if (powerUp.y > height + 50) {
                this.powerUps.splice(i, 1);
            }
        }

        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            let obs = this.obstacles[i];
            obs.update(this.speed);

            let truckLeft = this.x - this.width / 2 + this.collisionBuffer;
            let truckRight = this.x + this.width / 2 - this.collisionBuffer;
            let truckTop = this.y - this.height / 2 + this.collisionBuffer;
            let truckBottom = this.y + this.height / 2 - this.collisionBuffer;

            let obsLeft = obs.x - obs.width / 2;
            let obsRight = obs.x + obs.width / 2;
            let obsTop = obs.y - obs.height / 2;
            let obsBottom = obs.y + obs.height / 2;

            if (truckRight > obsLeft && truckLeft < obsRight &&
                truckBottom > obsTop && truckTop < obsBottom && !this.invincible) {
                lives--;
                this.obstacles.splice(i, 1);
                this.obstacleSpawnTimer = -30;
                if (lives <= 0) {
                    currentScreen = 'gameOver';
                    noLoop();
                }
            } else if (obs.y > height + 100) {
                this.obstacles.splice(i, 1);
            }
        }

        if (this.invincible) {
            this.invincibleTimer--;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }
    }

    applyPowerUp(type) {
        if (type === 'speedBoost') {
            this.maxSpeed += 2;
            setTimeout(() => { this.maxSpeed -= 2; }, 5000);
        } else if (type === 'extraLife') {
            lives = min(lives + 1, 5);
        } else if (type === 'invincibility') {
            this.invincible = true;
            this.invincibleTimer = this.invincibleDuration;
        }
    }

    spawnPowerUp() {
        let lane = floor(random(3));
        let type = random(this.powerUpTypes);
        this.powerUps.push({
            x: this.laneXPositions[lane], // Usando a posição X da pista
            y: -50,
            type: type,
            size: 30
        });
    }

    display() {
        // Estrada (cinza)
        fill(100);
        rectMode(CORNER);
        rect(width / 2 - this.roadWidth / 2, 0, this.roadWidth, height);

        // Linhas da estrada (amarelas)
        stroke(255, 200, 0);
        strokeWeight(5);
        for (let i = -10; i < height / 80 + 10; i++) {
            line(width / 2 - this.roadWidth / 6, i * 80 + this.linesOffset, width / 2 - this.roadWidth / 6, i * 80 + this.linesOffset + 40);
            line(width / 2 + this.roadWidth / 6, i * 80 + this.linesOffset, width / 2 + this.roadWidth / 6, i * 80 + this.linesOffset + 40);
        }
        noStroke();

        // Grama
        fill(139, 195, 74);
        rect(0, 0, width / 2 - this.roadWidth / 2, height);
        rect(width / 2 + this.roadWidth / 2, 0, width / 2 - this.roadWidth / 2, height);

        for (let obs of this.obstacles) {
            obs.display();
        }

        for (let powerUp of this.powerUps) {
            push();
            translate(powerUp.x, powerUp.y);

            if (powerUp.type === 'speedBoost') {
                fill(0, 0, 255);
                rect(-10, -15, 20, 30);
                fill(255);
                triangle(0, -10, 0, 10, 15, 0);
            } else if (powerUp.type === 'extraLife') {
                fill(255, 0, 0);
                beginShape();
                vertex(0, -15);
                vertex(10, 0);
                vertex(0, 15);
                vertex(-10, 0);
                endShape(CLOSE);
                fill(255);
                textSize(12);
                textAlign(CENTER, CENTER);
                text("+1", 0, 0);
            } else if (powerUp.type === 'invincibility') {
                fill(255, 255, 0);
                ellipse(0, 0, 25, 25);
                fill(0);
                textSize(12);
                textAlign(CENTER, CENTER);
                text("INV", 0, 0);
            }

            pop();
        }

        push();
        translate(this.x, this.y);

        if (this.invincible && frameCount % 10 < 5) {
            fill(255, 255, 0, 150);
        } else {
            fill(150, 0, 0);
        }

        rectMode(CENTER);
        rect(0, 0, this.width, this.height);
        rect(0, -this.height / 2 + 10, this.width * 0.8, 20); // Cabine

        fill(50); // Rodas
        ellipse(-this.width / 2 + 10, -this.height * 0.2, 15, 25);
        ellipse(-this.width / 2 + 10, this.height * 0.2, 15, 25);
        ellipse(this.width / 2 - 10, -this.height * 0.2, 15, 25);
        ellipse(this.width / 2 - 10, this.height * 0.2, 15, 25);

        rectMode(CORNER);
        pop();
    }

    keyPressed() {
        if (keyCode === LEFT_ARROW) {
            this.currentLaneIndex = max(0, this.currentLaneIndex - 1);
            this.targetX = this.laneXPositions[this.currentLaneIndex];
        } else if (keyCode === RIGHT_ARROW) {
            this.currentLaneIndex = min(2, this.currentLaneIndex + 1);
            this.targetX = this.laneXPositions[this.currentLaneIndex];
        }
    }

    spawnObstacle() {
        let lane = floor(random(3));
        let type = random(['car', 'rock', 'tree', 'cone', 'barrel', 'sign']);
        let speed = constrain(this.speed * 0.8 + random(-1, 1), this.minObstacleSpeed, this.maxObstacleSpeed);
        // Passa a posição X da pista diretamente para o Obstacle
        let obstacle = new Obstacle(this.laneXPositions[lane], speed, type);

        this.obstacles.push(obstacle);
    }
}

// --- FUNÇÕES GLOBAIS ---

function setup() {
    createCanvas(800, 600);
    pixelDensity(1); // Para garantir consistência entre telas de alta resolução

    player = new Player();

    wateringCan = new Item(width / 2 - 50, height / 2 + 50, 20, 'wateringCan');
    seedPacket = new Item(width / 2 + 50, height / 2 + 50, 20, 'seedPacket');
    scissors = new Item(width / 2, height / 2 + 100, 20, 'scissors');
    transportBox = new Item(width / 2, height / 2 - 100, 60, 'transportBox');

    truck = new Truck(-150, height - 70);

    generateBoxesGrid();

    // Setup para a fase de loja
    trashBin = { x: width / 4, y: height - 100, size: 100, color: color(0, 150, 0) }; // Lixeira verde
    customerArea = { x: width * 3 / 4, y: height - 100, size: 100, color: color(139, 69, 19) }; // Caixa de madeira do cliente
    
    // Prateleiras para a loja
    shelves.push({ x: width / 2 - 200, y: 150, size: 120 });
    shelves.push({ x: width / 2, y: 150, size: 120 });
    shelves.push({ x: width / 2 + 200, y: 150, size: 120 });
}

function draw() {
    background(139, 195, 74); // Fundo de grama

    if (currentScreen === 'start') {
        drawStartScreen();
    } else if (currentScreen === 'plantation') {
        drawPlantationPhase();
    } else if (currentScreen === 'minigame') {
        drawMinigamePhase();
    } else if (currentScreen === 'shop') {
        drawShopPhase();
    } else if (currentScreen === 'gameOver') {
        drawGameOverScreen();
    }
}

function drawStartScreen() {
    background(0);
    fill(255);
    textSize(50);
    textAlign(CENTER, CENTER);
    text("O Jogo do Tomate!", width / 2, height / 2 - 100);
    textSize(25);
    text("Clique para Iniciar", width / 2, height / 2);
}

function drawPlantationPhase() {
    for (let box of boxes) {
        box.display();
    }

    for (let i = sprouts.length - 1; i >= 0; i--) {
        let sprout = sprouts[i];
        sprout.update();
        sprout.display();
    }

    player.move();
    player.display();

    wateringCan.display();
    seedPacket.display();
    scissors.display();
    transportBox.display();

    truck.update();
    truck.display();

    if (transportBox.currentPlants >= MAX_PLANTS_IN_TRANSPORT_BOX && !truck.isDriving && !transportBox.isPickedUp) {
        truck.callForPickup();
    }

    fill(255);
    textSize(20);
    textAlign(LEFT, TOP);
    text(`Plantas Entregues: ${totalPlantsDelivered} / ${TOTAL_PLANTS_FOR_TRUCK}`, 20, 20);

    // Feedback visual do item segurado / próximo
    fill(255);
    textSize(18);
    textAlign(RIGHT, TOP);
    if (player.heldItem) {
        let itemName = getItemName(player.heldItem.type);
        text(`Segurando: ${itemName}`, width - 20, 20);
        text("'E' para soltar, 'ESPAÇO' para usar.", width - 20, 45);
    } else {
        const allItems = [wateringCan, seedPacket, scissors, transportBox];
        let hoveredItem = null;
        for(let item of allItems) {
            if (player.dist(item) < player.size / 2 + item.size / 2 + 10 && !item.isPickedUp) {
                hoveredItem = item;
                break;
            }
        }
        if (hoveredItem) {
            let itemName = getItemName(hoveredItem.type);
            text(`Pressione 'E' para pegar o ${itemName}`, width - 20, 20);
        }
    }


    if (totalPlantsDelivered >= TOTAL_PLANTS_FOR_TRUCK && currentScreen === 'plantation') {
        currentScreen = 'minigame';
        truckMiniGame = new TruckMiniGame();
    }
}

function drawMinigamePhase() {
    truckMiniGame.update();
    truckMiniGame.display();

    fill(255);
    textSize(24);
    textAlign(CENTER, TOP);
    text(`Distância: ${floor(distanceTraveled)}m / ${TARGET_DISTANCE}m`, width / 2, 20);
    text(`Vidas: ${lives}`, width / 2, 50);

    if (distanceTraveled >= TARGET_DISTANCE && currentScreen === 'minigame') {
        currentScreen = 'shop';
        setupShopPhase();
    } else if (lives <= 0 && currentScreen === 'minigame') {
        currentScreen = 'gameOver';
        noLoop(); // Para o loop do draw
    }
}

function setupShopPhase() {
  // Resetar estado da loja
  money = 0;
  tomatoes = [];
  currentCustomerOrder = 0;
  customerWaiting = false;
  customerTimer = 0;
  draggedTomato = null; // Garante que nenhum tomate está sendo arrastado

  // Gerar tomates iniciais nas prateleiras
  for (let shelf of shelves) {
    let tomatoTypes = ['good', 'old'];
    let numTomatoes = floor(random(5, 15));
    for (let i = 0; i < numTomatoes; i++) {
      let type = random(tomatoTypes);
      let tomato = {
        x: shelf.x + random(-shelf.size / 4, shelf.size / 4),
        y: shelf.y + random(-shelf.size / 4, shelf.size / 4),
        size: 40,
        type: type,
        color: type === 'good' ? color(200, 0, 0)
             : type === 'old' ? color(150, 50, 0)
             : color(50, 50, 50)
      };
      tomatoes.push(tomato);
    }
  }

  loop(); // Garante que o draw continue rodando
}

function drawShopPhase() {
    background(210, 180, 140); // Cor de madeira para o chão da loja

    // Desenhar paredes
    fill(240, 230, 220); // Cor clara para as paredes
    rectMode(CORNER);
    rect(0, 0, width, 80); // Parede superior

    // Desenhar prateleiras
    for (let shelf of shelves) {
        fill(139, 69, 19); // Marrom escuro para a prateleira
        rectMode(CENTER);
        rect(shelf.x, shelf.y, shelf.size, shelf.size / 2);
        fill(160, 82, 45); // Marrom mais claro para a superfície
        rect(shelf.x, shelf.y - shelf.size / 4, shelf.size, 5); // Borda superior
    }

    // Desenhar lixeira
    fill(trashBin.color);
    rectMode(CENTER);
    rect(trashBin.x, trashBin.y, trashBin.size, trashBin.size);
    fill(0);
    textSize(20);
    textAlign(CENTER, CENTER);
    text("LIXEIRA", trashBin.x, trashBin.y);

    // Desenhar área do cliente / banca
    fill(customerArea.color);
    rectMode(CENTER);
    rect(customerArea.x, customerArea.y, customerArea.size, customerArea.size);
    fill(0);
    textSize(20);
    textAlign(CENTER, CENTER);
    text("CLIENTE", customerArea.x, customerArea.y - customerArea.size / 4);
    text("Banca", customerArea.x, customerArea.y + customerArea.size / 4);


    // Desenhar tomates (somente os que NÃO estão sendo arrastados)
    for (let tomato of tomatoes) {
        if (tomato !== draggedTomato) {
            fill(tomato.color);
            ellipse(tomato.x, tomato.y, tomato.size, tomato.size);
        }
    }

    // Lógica do cliente
    if (!customerWaiting && random() < 0.002) { // Frequência do cliente
        customerWaiting = true;
        currentCustomerOrder = floor(random(1, 6)); // Pedido de 1-5 tomates
        customerTimer = CUSTOMER_PATIENCE;
    }

    if (customerWaiting) {
        customerTimer--;
        fill(0);
        textSize(25);
        textAlign(CENTER, CENTER);
        text(`Cliente quer ${currentCustomerOrder} tomates!`, width / 2, 30);

        // Barra de paciência
        let patienceWidth = map(customerTimer, 0, CUSTOMER_PATIENCE, 0, 200);
        fill(200, 0, 0); // Vermelho para a barra
        rectMode(CORNER);
        rect(width / 2 - 100, 60, patienceWidth, 10);

        if (customerTimer <= 0) {
            customerWaiting = false;
            money -= 5; // Multa por deixar o cliente esperando
            if (money < 0) money = 0;
            console.log("Cliente impaciente! Dinheiro: " + money);
        }
    }

    // Mostrar dinheiro
    fill(0);
    textSize(30);
    textAlign(RIGHT, TOP);
    text(`Dinheiro: $${money} / $${MONEY_TARGET}`, width - 20, 20);

    // Desenhar o tomate arrastado por último para ficar em cima
    if (draggedTomato) {
        fill(draggedTomato.color);
        ellipse(draggedTomato.x, draggedTomato.y, draggedTomato.size, draggedTomato.size);
    }

    // Verificar vitória
    if (money >= MONEY_TARGET && currentScreen === 'shop') {
        fill(0, 200, 0);
        textSize(50);
        textAlign(CENTER, CENTER);
        text("VITÓRIA! Loja bem sucedida!", width / 2, height / 2);
        noLoop();
    }
}

function drawGameOverScreen() {
    background(50);
    fill(255, 0, 0);
    textSize(60);
    textAlign(CENTER, CENTER);
    text("FIM DE JOGO!", width / 2, height / 2 - 50);
    textSize(30);
    text("Pressione 'R' para Reiniciar", width / 2, height / 2 + 50);
}


function mousePressed() {
    if (currentScreen === 'start') {
        currentScreen = 'plantation';
        loop(); // Inicia o loop do draw
        return;
    }

    if (currentScreen === 'shop') {
        // Tentar pegar um tomate
        for (let i = tomatoes.length - 1; i >= 0; i--) {
            let tomato = tomatoes[i];
            if (dist(mouseX, mouseY, tomato.x, tomato.y) < tomato.size / 2) {
                draggedTomato = tomato;
                break;
            }
        }
    }
}

function mouseDragged() {
    if (currentScreen === 'shop' && draggedTomato) {
        draggedTomato.x = mouseX;
        draggedTomato.y = mouseY;
    }
}

function mouseReleased() {
    if (currentScreen === 'shop' && draggedTomato) {
        // Soltou na lixeira?
        if (dist(draggedTomato.x, draggedTomato.y, trashBin.x, trashBin.y) < trashBin.size / 2) {
            if (draggedTomato.type === 'bad' || draggedTomato.type === 'old') {
                money += 2; // Bônus por descartar corretamente
                console.log("Tomate ruim descartado! Dinheiro: " + money);
            } else {
                money -= 1; // Penalidade por descartar tomate bom
                if (money < 0) money = 0;
                console.log("Tomate bom descartado acidentalmente! Dinheiro: " + money);
            }
            // Remove o tomate do array
            tomatoes.splice(tomatoes.indexOf(draggedTomato), 1);
        }
        // Soltou na área do cliente?
        else if (dist(draggedTomato.x, draggedTomato.y, customerArea.x, customerArea.y) < customerArea.size / 2) {
            if (customerWaiting) {
                if (draggedTomato.type === 'good') {
                    money += 10;
                    currentCustomerOrder--;
                    console.log("Tomate bom vendido! Dinheiro: " + money);
                    if (currentCustomerOrder <= 0) {
                        customerWaiting = false;
                        money += 5; // Bônus por atender rápido
                        console.log("Pedido completo! Bônus! Dinheiro: " + money);
                    }
                } else {
                    money -= 10; // Multa por vender tomate ruim
                    if (money < 0) money = 0;
                    console.log("Tomate ruim vendido! Multa! Dinheiro: " + money);
                    // Cliente ainda espera pelo resto do pedido
                }
                tomatoes.splice(tomatoes.indexOf(draggedTomato), 1);
            } else {
                // Cliente não está esperando, tomate bom solto na área do cliente é "perdido"
                // Opcional: Adicionar uma pequena penalidade ou simplesmente remover o tomate
                console.log("Tomate solto na área do cliente sem pedido!");
                tomatoes.splice(tomatoes.indexOf(draggedTomato), 1);
            }
        }
        // Soltou em outro lugar, volta para o lugar original ou "perde"
        else {
            // O tomate fica onde foi solto (pode ser uma boa ideia para "perder" se soltar longe)
            // Ou você pode recolocar ele na prateleira de onde veio, se quiser.
            // Por simplicidade, ele fica onde foi solto.
        }
        draggedTomato = null; // Para de arrastar
    }
}


function keyPressed() {
    if (currentScreen === 'gameOver') {
        if (key === 'r' || key === 'R') {
            resetGame();
        }
        return;
    }

    if (currentScreen === 'minigame') {
        truckMiniGame.keyPressed();
        return;
    }

    if (currentScreen === 'plantation') {
        if (key === 'e' || key === 'E') {
            const allItems = [wateringCan, seedPacket, scissors, transportBox];
            for (let item of allItems) {
                if (player.hasItem(item)) {
                    player.dropItem(item);
                    break;
                } else if (player.dist(item) < player.size / 2 + item.size / 2 + 10 && !player.heldItem) {
                    player.pickupItem(item);
                    break;
                }
            }
        }

        if (key === ' ') {
            if (player.hasItem(wateringCan)) {
                wateringCan.activate();
                for (let sprout of sprouts) {
                    if (player.dist(sprout) < player.size / 2 + sprout.size / 2 + 20 && sprout.state === 'thirsty') {
                        sprout.water();
                        break;
                    }
                }
            } else if (player.hasItem(seedPacket)) {
                seedPacket.activate();
                for (let box of boxes) {
                    if (!box.hasSprout && player.dist(box) < player.size / 2 + BOX_SIZE / 2 + 10) {
                        let newSprout = new Sprout(box.x, box.y, box);
                        sprouts.push(newSprout);
                        box.hasSprout = true;
                        break;
                    }
                }
            } else if (player.hasItem(scissors)) {
                scissors.activate();
                for (let i = sprouts.length - 1; i >= 0; i--) {
                    let sprout = sprouts[i];
                    if (sprout.state === 'dead' && player.dist(sprout) < player.size / 2 + sprout.size / 2 + 20) {
                        sprout.parentBox.hasSprout = false;
                        sprouts.splice(i, 1);
                        break;
                    }
                }
            } else if (player.hasItem(transportBox)) {
                // Entregar plantas ao caminhão
                if (transportBox.currentPlants >= MAX_PLANTS_IN_TRANSPORT_BOX && truck.isDriving && !truck.leaving && player.dist(truck) < player.size / 2 + truck.width / 2 + 30) {
                    totalPlantsDelivered += transportBox.currentPlants;
                    transportBox.resetPlants();
                    truck.depart();
                }
                // Colher plantas maduras para a caixa de transporte
                else if (transportBox.currentPlants < MAX_PLANTS_IN_TRANSPORT_BOX) {
                    let closestMatureSprout = null;
                    let minDist = Infinity;
                    for (let sprout of sprouts) {
                        if (sprout.state === 'mature') {
                            let d = player.dist(sprout);
                            if (d < minDist && d < player.size / 2 + sprout.size / 2 + 20) {
                                closestMatureSprout = sprout;
                                minDist = d;
                            }
                        }
                    }

                    if (closestMatureSprout) {
                        transportBox.addPlant();
                        closestMatureSprout.parentBox.hasSprout = false;
                        const index = sprouts.indexOf(closestMatureSprout);
                        if (index > -1) {
                            sprouts.splice(index, 1);
                        }
                    }
                }
            }
        }
    }
}

function generateBoxesGrid() {
    let startX = (width - (GRID_COLS * BOX_SIZE + (GRID_COLS - 1) * 10)) / 2;
    let startY = (height - (GRID_ROWS * BOX_SIZE + (GRID_ROWS - 1) * 10)) / 2;

    for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
            let x = startX + col * (BOX_SIZE + 10) + BOX_SIZE / 2;
            let y = startY + row * (BOX_SIZE + 10) + BOX_SIZE / 2;

            if (dist(x, y, width / 2, height / 2) > CENTRAL_AREA_SIZE / 2 + 50) {
                boxes.push(new Box(x, y));
            }
        }
    }
}

function generateTomates(shelf) {
    // Tomates para esta prateleira
    const tomatoesOnShelf = [];

    for (let i = 0; i < 9; i++) {
        let type;
        let r = random();
        if (r < 0.7) { // 70% de chance de ser bom
            type = 'good';
        } else if (r < 0.9) { // 20% de chance de ser velho (70-90)
            type = 'old';
        } else { // 10% de chance de ser podre (90-100)
            type = 'bad';
        }

        let col = i % 3;
        let row = floor(i / 3);

        let tomato = {
            x: shelf.x - shelf.size / 2 + 15 + col * 30, // Ajuste para melhor espaçamento
            y: shelf.y - shelf.size / 4 + 10 + row * 30, // Ajuste para ficar na prateleira
            size: 25, // Tamanho ligeiramente maior
            type: type,
            isDragged: false
        };

        if (type === 'good') {
            tomato.color = color(200, 0, 0);
        } else if (type === 'old') {
            tomato.color = color(150, 50, 0);
        } else { // 'bad'
            tomato.color = color(50, 50, 50);
        }

        tomatoesOnShelf.push(tomato);
    }
    // Adiciona os novos tomates ao array global de tomates
    tomatoes.push(...tomatoesOnShelf);
}

function getItemName(type) {
    switch (type) {
        case 'wateringCan': return "Regador";
        case 'seedPacket': return "Pacote de Sementes";
        case 'scissors': return "Tesoura";
        case 'transportBox': return "Caixa de Transporte";
        default: return "Desconhecido";
    }
}

function resetGame() {
    // Resetar variáveis do jogo principal
    player = new Player();
    wateringCan = new Item(width / 2 - 50, height / 2 + 50, 20, 'wateringCan');
    seedPacket = new Item(width / 2 + 50, height / 2 + 50, 20, 'seedPacket');
    scissors = new Item(width / 2, height / 2 + 100, 20, 'scissors');
    transportBox = new Item(width / 2, height / 2 - 100, 60, 'transportBox');
    truck = new Truck(-150, height - 70);
    boxes = [];
    sprouts = [];
    generateBoxesGrid();
    totalPlantsDelivered = 0;

    // Resetar variáveis do minigame
    truckMiniGame = null;
    distanceTraveled = 0;
    lives = 3;

    // Resetar variáveis da fase de loja
    money = 0;
    tomatoes = [];
    currentCustomerOrder = 0;
    customerWaiting = false;
    customerTimer = 0;
    draggedTomato = null;
    shelves = [];
    shelves.push({ x: width / 2 - 200, y: 150, size: 120 });
    shelves.push({ x: width / 2, y: 150, size: 120 });
    shelves.push({ x: width / 2 + 200, y: 150, size: 120 });

    currentScreen = 'start'; // Volta para a tela de início
    loop(); // Reinicia o loop do draw
}