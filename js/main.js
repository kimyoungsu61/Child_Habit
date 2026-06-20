import { CARD_TYPES, createCoord } from "./core-data.js";
import { renderBoard } from "./board-render.js";
import { renderAllUi } from "./ui-render.js";
import {
  addLog,
  addPlayer,
  advanceTurn,
  createInitialRoomState,
  findCardInPlayerHand,
  getCurrentPlayer,
  placePipeTile,
  playActionCard,
  startGame,
} from "./game-state.js";

let room = null;
let selectedCardId = null;
let selectedRotation = 0;

// 1. 화면 요소 찾기 (HTML에 있는 버튼과 영역을 JavaScript 변수로 연결하는 단계)
const elements = {
  createRoomButton: document.querySelector("#createRoomButton"),
  addPlayerButton: document.querySelector("#addPlayerButton"),
  startGameButton: document.querySelector("#startGameButton"),
  passTurnButton: document.querySelector("#passTurnButton"),
  rotateTileButton: document.querySelector("#rotateTileButton"),
  gameStatus: document.querySelector("#gameStatus"),
  currentTurn: document.querySelector("#currentTurn"),
  playerList: document.querySelector("#playerList"),
  boardGrid: document.querySelector("#boardGrid"),
  handCards: document.querySelector("#handCards"),
  selectedCardStatus: document.querySelector("#selectedCardStatus"),
  logList: document.querySelector("#logList"),
};

// 2. 이벤트 연결하기 (사용자 클릭을 게임 함수와 이어주는 단계)
elements.createRoomButton.addEventListener("click", handleCreateRoom);
elements.addPlayerButton.addEventListener("click", handleAddPlayer);
elements.startGameButton.addEventListener("click", handleStartGame);
elements.handCards.addEventListener("click", handleCardClick);
elements.boardGrid.addEventListener("click", handleBoardClick);
elements.rotateTileButton.addEventListener("click", handleRotateTile);
elements.passTurnButton.addEventListener("click", handlePassTurn);

// 3. 방 만들기 처리하기 (새 게임 상태를 생성하고 선택값을 초기화하는 단계)
function handleCreateRoom() {
  room = createInitialRoomState();
  selectedCardId = null;
  selectedRotation = 0;
  render();
}

// 4. 플레이어 추가 처리하기 (방이 없으면 먼저 만들고 더미 플레이어를 넣는 단계)
function handleAddPlayer() {
  if (!room) {
    room = createInitialRoomState();
  }

  const playerName = `플레이어 ${room.nextPlayerNumber}`;
  const result = addPlayer(room, playerName);

  if (!result.ok) {
    addLog(room, result.message);
  }

  render();
}

// 5. 게임 시작 처리하기 (역할 배정, 덱 생성, 손패 지급을 실행하는 단계)
function handleStartGame() {
  if (!room) {
    room = createInitialRoomState();
  }

  const result = startGame(room);

  if (!result.ok) {
    addLog(room, result.message);
  }

  selectedCardId = null;
  selectedRotation = 0;
  render();
}

// 6. 카드 선택 처리하기 (손패 버튼에서 카드 id를 읽어 선택 상태로 저장하는 단계)
function handleCardClick(event) {
  const cardButton = event.target.closest(".card-button");

  if (!cardButton || !room) {
    return;
  }

  selectedCardId = cardButton.dataset.cardId;
  selectedRotation = 0;
  render();
}

// 7. 보드 클릭 처리하기 (선택한 카드가 배관이면 해당 좌표에 배치하는 단계)
function handleBoardClick(event) {
  const cell = event.target.closest(".board-cell");
  const currentPlayer = getCurrentPlayer(room);

  if (!cell || !room || !currentPlayer || !selectedCardId) {
    return;
  }

  const selectedCard = findCardInPlayerHand(room, currentPlayer.id, selectedCardId);

  if (!selectedCard) {
    selectedCardId = null;
    selectedRotation = 0;
    render();
    return;
  }

  if (selectedCard.type === CARD_TYPES.ACTION) {
    const result = playActionCard(room, currentPlayer.id, selectedCard.instanceId, null);
    addLog(room, result.message);
    render();
    return;
  }

  const targetCoord = createCoord(cell.dataset.x, cell.dataset.y);
  const result = placePipeTile(
    room,
    currentPlayer.id,
    selectedCard.instanceId,
    targetCoord,
    selectedRotation,
  );

  if (!result.ok) {
    addLog(room, result.message);
  }

  if (result.ok) {
    selectedCardId = null;
    selectedRotation = 0;
  }

  render();
}

// 8. 타일 회전 처리하기 (선택된 배관 타일의 회전값을 90도씩 바꾸는 단계)
function handleRotateTile() {
  const selectedCard = getSelectedCard();

  if (!selectedCard || selectedCard.type !== CARD_TYPES.PIPE_TILE) {
    return;
  }

  selectedRotation = (selectedRotation + 1) % 4;
  render();
}

// 9. 턴 넘기기 처리하기 (현재 플레이어를 다음 순서로 넘기는 단계)
function handlePassTurn() {
  if (!room || room.players.length === 0) {
    return;
  }

  selectedCardId = null;
  selectedRotation = 0;
  advanceTurn(room);
  render();
}

// 10. 선택 카드 찾기 (현재 플레이어 손패에서 선택 카드가 아직 있는지 확인하는 단계)
function getSelectedCard() {
  const currentPlayer = getCurrentPlayer(room);

  if (!room || !currentPlayer || !selectedCardId) {
    return null;
  }

  const selectedCard = findCardInPlayerHand(room, currentPlayer.id, selectedCardId);

  if (!selectedCard) {
    selectedCardId = null;
    selectedRotation = 0;
    return null;
  }

  return selectedCard;
}

// 11. 조작 버튼 상태 갱신하기 (현재 상태에 맞춰 회전과 턴 버튼을 켜고 끄는 단계)
function updateControlStates() {
  const selectedCard = getSelectedCard();

  elements.rotateTileButton.disabled = !selectedCard || selectedCard.type !== CARD_TYPES.PIPE_TILE;
  elements.passTurnButton.disabled = !room || room.players.length === 0;
}

// 12. 화면 다시 그리기 (상태와 선택값을 렌더링 모듈에 전달하는 단계)
function render() {
  const selectedCard = getSelectedCard();

  renderAllUi(elements, room, {
    selectedCardId,
    selectedRotation,
  });
  renderBoard(elements.boardGrid, room?.board, selectedCard, selectedRotation);
  updateControlStates();
}

// 13. 첫 화면 그리기 (파일을 열자마자 빈 상태 화면을 표시하는 단계)
render();
