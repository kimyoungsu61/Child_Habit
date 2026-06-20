import {
  CARD_TYPE_LABELS,
  CARD_TYPES,
  DIRECTION_LABELS,
  getPipeTileDefinition,
  rotateConnections,
} from "./core-data.js";
import { GAME_PHASES, getCurrentPlayer, getCurrentPlayerHand } from "./game-state.js";

// 1. 전체 UI 렌더링하기 (상태, 플레이어, 손패, 로그를 한 번에 갱신하는 단계)
export function renderAllUi(elements, room, selection) {
  renderGameStatus(elements.gameStatus, room);
  renderCurrentTurn(elements.currentTurn, room);
  renderPlayers(elements.playerList, room);
  renderSelectedCard(elements.selectedCardStatus, room, selection);
  renderHand(elements.handCards, room, selection.selectedCardId);
  renderLog(elements.logList, room);
}

// 2. 현재 게임 상태 렌더링하기 (방 상태와 카드 수를 숫자로 보여주는 단계)
function renderGameStatus(statusElement, room) {
  const statusItems = !room
    ? [
        ["방 상태", "없음"],
        ["플레이어", "0명"],
        ["덱", "0장"],
        ["배관", "0개"],
      ]
    : [
        ["방 상태", room.status === GAME_PHASES.PLAYING ? "진행 중" : "대기 중"],
        ["플레이어", `${room.players.length}명`],
        ["덱", `${room.deck.length}장`],
        ["배관", `${Object.keys(room.board.tiles).length}개`],
      ];

  statusElement.innerHTML = "";

  statusItems.forEach(([labelText, valueText]) => {
    const item = document.createElement("div");
    const label = document.createElement("span");
    const value = document.createElement("span");

    item.className = "status-item";
    label.className = "status-label";
    value.className = "status-value";
    label.textContent = labelText;
    value.textContent = valueText;

    item.appendChild(label);
    item.appendChild(value);
    statusElement.appendChild(item);
  });
}

// 3. 현재 턴 렌더링하기 (누가 배관을 놓을 차례인지 보여주는 단계)
function renderCurrentTurn(turnElement, room) {
  const currentPlayer = getCurrentPlayer(room);

  if (!room) {
    turnElement.textContent = "현재 턴: 없음";
    return;
  }

  if (!currentPlayer) {
    turnElement.textContent = "현재 턴: 대기 중";
    return;
  }

  turnElement.textContent = `현재 턴: ${currentPlayer.name}`;
}

// 4. 플레이어 목록 렌더링하기 (공개 상태만 사용해 목록을 만드는 단계)
function renderPlayers(playerListElement, room) {
  playerListElement.innerHTML = "";

  if (!room || room.players.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "player-item";
    emptyItem.textContent = "플레이어 없음";
    playerListElement.appendChild(emptyItem);
    return;
  }

  const currentPlayer = getCurrentPlayer(room);

  room.players.forEach((player) => {
    const item = document.createElement("li");
    const nameRow = document.createElement("div");
    const name = document.createElement("span");
    const meta = document.createElement("div");

    item.className = "player-item";
    nameRow.className = "player-name-row";
    name.className = "player-name";
    meta.className = "player-meta";
    name.textContent = player.name;

    if (currentPlayer?.id === player.id) {
      meta.appendChild(createBadge("현재 턴", "turn"));
    }

    meta.appendChild(createBadge(`손패 ${player.handCount}장`));
    meta.appendChild(createBadge(player.suitDamaged ? "우주복 손상" : "우주복 정상", player.suitDamaged ? "warning" : ""));

    nameRow.appendChild(name);
    nameRow.appendChild(meta);
    item.appendChild(nameRow);
    playerListElement.appendChild(item);
  });
}

// 5. 배지 만들기 (작은 상태 라벨을 반복해서 만드는 단계)
function createBadge(text, modifier) {
  const badge = document.createElement("span");
  badge.className = modifier ? `badge ${modifier}` : "badge";
  badge.textContent = text;
  return badge;
}

// 6. 선택 카드 렌더링하기 (선택된 카드와 회전 상태를 보여주는 단계)
function renderSelectedCard(selectedElement, room, selection) {
  const currentHand = getCurrentPlayerHand(room);
  const selectedCard = currentHand.find((card) => card.instanceId === selection.selectedCardId);

  if (!selectedCard) {
    selectedElement.textContent = "선택된 카드 없음";
    return;
  }

  if (selectedCard.type === CARD_TYPES.PIPE_TILE) {
    selectedElement.textContent = `${selectedCard.label} 선택됨 · 회전 ${selection.selectedRotation * 90}도`;
    return;
  }

  selectedElement.textContent = `${selectedCard.label} 선택됨 · 다음 구현 단계에서 처리`;
}

// 7. 손패 렌더링하기 (현재 턴 플레이어의 카드 버튼을 만드는 단계)
function renderHand(handElement, room, selectedCardId) {
  const hand = getCurrentPlayerHand(room);

  handElement.innerHTML = "";

  if (!room || hand.length === 0) {
    const empty = document.createElement("div");
    empty.className = "selected-card";
    empty.textContent = "손패 없음";
    handElement.appendChild(empty);
    return;
  }

  hand.forEach((card) => {
    handElement.appendChild(createCardButton(card, selectedCardId));
  });
}

// 8. 카드 버튼 만들기 (카드 타입과 연결 방향을 함께 표시하는 단계)
function createCardButton(card, selectedCardId) {
  const button = document.createElement("button");
  const title = document.createElement("span");
  const type = document.createElement("span");

  button.type = "button";
  button.className = card.instanceId === selectedCardId ? "card-button is-selected" : "card-button";
  button.dataset.cardId = card.instanceId;

  title.className = "card-title";
  type.className = "card-type";
  title.textContent = card.label;
  type.textContent = getCardDescription(card);

  button.appendChild(title);
  button.appendChild(type);
  return button;
}

// 9. 카드 설명 만들기 (배관 연결 방향이나 행동 카드 종류를 짧게 보여주는 단계)
function getCardDescription(card) {
  if (card.type !== CARD_TYPES.PIPE_TILE) {
    return CARD_TYPE_LABELS[card.type];
  }

  const tileDefinition = getPipeTileDefinition(card.tileId);
  const directions = rotateConnections(tileDefinition.connections, 0)
    .map((direction) => DIRECTION_LABELS[direction])
    .join(", ");

  return `${CARD_TYPE_LABELS[card.type]} · ${directions}`;
}

// 10. 로그 렌더링하기 (최근 이벤트를 아래쪽 목록에 표시하는 단계)
function renderLog(logListElement, room) {
  const logs = room ? room.logs.slice(-12) : [];

  logListElement.innerHTML = "";

  if (logs.length === 0) {
    const empty = document.createElement("li");
    empty.className = "log-item";
    empty.textContent = "로그 없음";
    logListElement.appendChild(empty);
    return;
  }

  logs.forEach((message) => {
    const item = document.createElement("li");
    item.className = "log-item";
    item.textContent = message;
    logListElement.appendChild(item);
  });
}
