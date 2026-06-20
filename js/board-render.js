import {
  CARD_TYPES,
  DIRECTION_ORDER,
  DIRECTION_LABELS,
  coordKey,
  getBoardEntityAt,
  getPipeTileDefinition,
  isPipePlacementAllowed,
  parseCoordKey,
} from "./core-data.js";

// 1. 보드 렌더링하기 (상태 객체를 HTML 격자로 바꾸는 단계)
export function renderBoard(boardElement, board, selectedCard, selectedRotation) {
  boardElement.innerHTML = "";

  if (!board) {
    boardElement.className = "board-empty-message";
    boardElement.textContent = "대기 중";
    return;
  }

  const bounds = getBoardBounds(board);
  boardElement.className = "board-grid";
  boardElement.style.gridTemplateColumns = `repeat(${bounds.width}, 74px)`;

  for (let y = bounds.minY; y <= bounds.maxY; y += 1) {
    for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
      boardElement.appendChild(createBoardCell(board, { x, y }, selectedCard, selectedRotation));
    }
  }
}

// 2. 보드 범위 계산하기 (시작점, 목적지, 놓인 배관이 모두 보이도록 잡는 단계)
function getBoardBounds(board) {
  const coords = [
    { x: board.start.x, y: board.start.y },
    ...board.destinations.map((target) => ({ x: target.x, y: target.y })),
    ...Object.keys(board.tiles).map(parseCoordKey),
  ];
  const xValues = coords.map((coord) => coord.x);
  const yValues = coords.map((coord) => coord.y);
  const minX = Math.min(...xValues) - 1;
  const maxX = Math.max(...xValues) + 1;
  const minY = Math.min(...yValues) - 1;
  const maxY = Math.max(...yValues) + 1;

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX + 1,
  };
}

// 3. 보드 칸 만들기 (좌표 하나를 버튼 형태의 셀로 만드는 단계)
function createBoardCell(board, coord, selectedCard, selectedRotation) {
  const cell = document.createElement("button");
  const entity = getBoardEntityAt(board, coord);

  cell.type = "button";
  cell.className = "board-cell";
  cell.dataset.x = String(coord.x);
  cell.dataset.y = String(coord.y);
  cell.dataset.coordKey = coordKey(coord);
  cell.setAttribute("aria-label", `보드 칸 ${coord.x}, ${coord.y}`);

  cell.appendChild(createCoordLabel(coord));

  if (!entity) {
    renderEmptyCell(cell, board, coord, selectedCard, selectedRotation);
    return cell;
  }

  if (entity.kind === "start") {
    renderStartCell(cell, entity.data);
    return cell;
  }

  if (entity.kind === "destination") {
    renderDestinationCell(cell, entity.data);
    return cell;
  }

  renderPipeCell(cell, entity.data);
  return cell;
}

// 4. 좌표 표시 만들기 (각 칸 왼쪽 위에 작은 좌표를 붙이는 단계)
function createCoordLabel(coord) {
  const label = document.createElement("span");
  label.className = "coord-label";
  label.textContent = `${coord.x},${coord.y}`;
  return label;
}

// 5. 빈 칸 표시하기 (선택한 배관이 놓일 수 있는 칸을 강조하는 단계)
function renderEmptyCell(cell, board, coord, selectedCard, selectedRotation) {
  cell.classList.add("is-empty");

  if (!selectedCard || selectedCard.type !== CARD_TYPES.PIPE_TILE) {
    return;
  }

  const tileDefinition = getPipeTileDefinition(selectedCard.tileId);

  if (!tileDefinition) {
    return;
  }

  const placement = isPipePlacementAllowed(board, coord, tileDefinition, selectedRotation);

  if (placement.ok) {
    cell.classList.add("is-clickable");
    cell.title = "배치 가능";
  }
}

// 6. 산소 공급기 표시하기 (출발지를 아이콘과 이름으로 구분하는 단계)
function renderStartCell(cell, start) {
  cell.classList.add("is-start");
  cell.appendChild(createIconContent("./assets/icons/oxygen-supply.svg", start.label));
}

// 7. 목적지 표시하기 (정체를 숨긴 상태로 미확인 목적지만 보여주는 단계)
function renderDestinationCell(cell, destination) {
  cell.classList.add("is-destination");
  cell.appendChild(createIconContent("./assets/icons/unknown-sector.svg", destination.label));
}

// 8. 일반 배관 표시하기 (연결 방향에 맞춰 배관 팔을 그리는 단계)
function renderPipeCell(cell, tile) {
  cell.classList.add("is-pipe");

  const content = document.createElement("span");
  content.className = "cell-content";
  content.appendChild(createPipeGraphic(tile.connections));

  const label = document.createElement("span");
  label.className = "cell-label";
  label.textContent = tile.label;
  content.appendChild(label);

  cell.appendChild(content);
}

// 9. 아이콘 콘텐츠 만들기 (출발지와 목적지 셀에 공통으로 쓰는 단계)
function createIconContent(src, labelText) {
  const content = document.createElement("span");
  const icon = document.createElement("img");
  const label = document.createElement("span");

  content.className = "cell-content";
  icon.src = src;
  icon.alt = "";
  label.className = "cell-label";
  label.textContent = labelText;

  content.appendChild(icon);
  content.appendChild(label);
  return content;
}

// 10. 배관 그래픽 만들기 (상하좌우 연결을 작은 도형으로 표현하는 단계)
function createPipeGraphic(connections) {
  const graphic = document.createElement("span");
  const center = document.createElement("span");

  graphic.className = "pipe-graphic";
  center.className = "pipe-center";
  graphic.appendChild(center);

  DIRECTION_ORDER.forEach((direction) => {
    if (!connections.includes(direction)) {
      return;
    }

    const arm = document.createElement("span");
    arm.className = `pipe-arm ${direction}`;
    arm.title = DIRECTION_LABELS[direction];
    graphic.appendChild(arm);
  });

  return graphic;
}
