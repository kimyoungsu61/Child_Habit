import {
  CARD_DEFINITIONS,
  CARD_TYPES,
  DESTINATION_TYPES,
  DIRECTIONS,
  ROLES,
  coordKey,
  createCoord,
  getPipeTileDefinition,
  isPipePlacementAllowed,
  normalizeRotation,
  rotateConnections,
} from "./core-data.js";

const HAND_SIZE = 5;

export const GAME_PHASES = Object.freeze({
  WAITING: "waiting",
  PLAYING: "playing",
});

// 1. 초기 보드 만들기 (산소 공급기와 숨겨진 목적지를 준비하는 단계)
function createInitialBoard() {
  const destinationTypes = shuffleArray([
    DESTINATION_TYPES.EMPTY_SECTOR,
    DESTINATION_TYPES.GENERATOR_CORE,
    DESTINATION_TYPES.EMPTY_SECTOR,
  ]);

  return {
    start: {
      type: "oxygen-supply",
      label: "산소 공급기",
      x: 0,
      y: 0,
      connections: [DIRECTIONS.RIGHT],
    },
    destinations: [-2, 0, 2].map((y, index) => ({
      id: `destination-${index + 1}`,
      type: "hidden-destination",
      label: "미확인 목적지",
      actualType: destinationTypes[index],
      x: 8,
      y,
      connections: [DIRECTIONS.LEFT],
      revealed: false,
    })),
    tiles: {},
  };
}

// 2. 초기 방 상태 생성하기 (게임 전체 상태의 기본 모양을 만드는 단계)
export function createInitialRoomState() {
  const room = {
    id: `space-pipe-${Date.now()}`,
    status: GAME_PHASES.WAITING,
    players: [],
    secretPlayers: {},
    hands: {},
    deck: [],
    discardPile: [],
    board: createInitialBoard(),
    currentPlayerIndex: 0,
    nextPlayerNumber: 1,
    logs: [],
  };

  addLog(room, "새 방이 생성되었습니다.");
  return room;
}

// 3. 공개 플레이어 상태 생성하기 (화면에 보여도 되는 플레이어 정보를 만드는 단계)
export function createPublicPlayerState(playerId, name, order) {
  return {
    id: playerId,
    name,
    order,
    suitDamaged: false,
    handCount: 0,
    connected: true,
  };
}

// 4. 비밀 플레이어 상태 생성하기 (역할처럼 감춰야 하는 정보를 따로 만드는 단계)
export function createSecretPlayerState(playerId, role) {
  return {
    playerId,
    role,
    scannedDestinations: {},
  };
}

// 5. 플레이어 추가하기 (대기 중인 방에 더미 플레이어를 넣는 단계)
export function addPlayer(room, requestedName) {
  if (!room) {
    return {
      ok: false,
      message: "방이 아직 없습니다.",
    };
  }

  if (room.status === GAME_PHASES.PLAYING) {
    return {
      ok: false,
      message: "게임 시작 후에는 플레이어를 추가할 수 없습니다.",
    };
  }

  const playerNumber = room.nextPlayerNumber;
  const playerId = `player-${playerNumber}`;
  const playerName = requestedName || `플레이어 ${playerNumber}`;

  room.players.push(createPublicPlayerState(playerId, playerName, playerNumber));
  room.hands[playerId] = [];
  room.nextPlayerNumber += 1;

  addLog(room, `${playerName} 추가됨.`);

  return {
    ok: true,
    playerId,
    message: `${playerName} 추가됨.`,
  };
}

// 6. 역할 수 계산하기 (플레이어 수에 맞춰 에일리언 수를 정하는 단계)
function getAlienCount(playerCount) {
  if (playerCount <= 1) {
    return 0;
  }

  if (playerCount <= 4) {
    return 1;
  }

  return 2;
}

// 7. 역할 배정하기 (비밀 상태에만 역할을 저장하는 단계)
export function assignRoles(room) {
  const alienCount = getAlienCount(room.players.length);
  const roles = [
    ...Array(alienCount).fill(ROLES.ALIEN),
    ...Array(room.players.length - alienCount).fill(ROLES.ASTRONAUT),
  ];
  const shuffledRoles = shuffleArray(roles);

  room.secretPlayers = {};

  room.players.forEach((player, index) => {
    room.secretPlayers[player.id] = createSecretPlayerState(player.id, shuffledRoles[index]);
  });

  addLog(room, "역할이 비밀 상태에 배정되었습니다.");
}

// 8. 덱 생성하기 (카드 정의를 실제 카드 인스턴스로 복사하는 단계)
export function createDeck() {
  const deck = [];
  let cardSerial = 1;

  CARD_DEFINITIONS.forEach((definition) => {
    for (let index = 0; index < definition.count; index += 1) {
      deck.push({
        instanceId: `card-${cardSerial}`,
        definitionId: definition.id,
        label: definition.label,
        type: definition.type,
        tileId: definition.tileId ?? null,
        actionType: definition.actionType ?? null,
      });
      cardSerial += 1;
    }
  });

  return deck;
}

// 9. 덱 셔플하기 (피셔-예이츠 방식으로 카드 순서를 섞는 단계)
export function shuffleDeck(deck) {
  return shuffleArray(deck);
}

// 10. 배열 섞기 (원본을 건드리지 않고 새 배열을 섞는 단계)
function shuffleArray(items) {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const temporary = result[index];
    result[index] = result[randomIndex];
    result[randomIndex] = temporary;
  }

  return result;
}

// 11. 손패 지급하기 (각 플레이어에게 시작 카드를 나눠주는 단계)
export function dealHands(room, handSize = HAND_SIZE) {
  room.players.forEach((player) => {
    room.hands[player.id] = [];
  });

  for (let cardIndex = 0; cardIndex < handSize; cardIndex += 1) {
    room.players.forEach((player) => {
      drawCardForPlayer(room, player.id);
    });
  }

  room.players.forEach((player) => {
    ensurePipeCardInHand(room, player.id);
  });

  updateHandCounts(room);
  addLog(room, "각 플레이어에게 손패가 지급되었습니다.");
}

// 12. 배관 카드 보장하기 (첫 테스트에서 배관을 놓아볼 수 있게 만드는 단계)
function ensurePipeCardInHand(room, playerId) {
  const hand = getPlayerHand(room, playerId);
  const hasPipeCard = hand.some((card) => card.type === CARD_TYPES.PIPE_TILE);

  if (hasPipeCard || hand.length === 0) {
    return;
  }

  const pipeCardIndex = room.deck.findIndex((card) => card.type === CARD_TYPES.PIPE_TILE);

  if (pipeCardIndex === -1) {
    return;
  }

  const [pipeCard] = room.deck.splice(pipeCardIndex, 1);
  const returnedCard = hand.splice(0, 1, pipeCard)[0];
  room.deck.push(returnedCard);
}

// 13. 카드 한 장 뽑기 (덱 맨 위 카드를 플레이어 손패에 넣는 단계)
export function drawCardForPlayer(room, playerId) {
  const card = room.deck.shift();

  if (!card) {
    updateHandCounts(room);
    return null;
  }

  room.hands[playerId].push(card);
  updateHandCounts(room);
  return card;
}

// 14. 현재 턴 설정하기 (플레이어 순서에서 누가 행동할지 정하는 단계)
export function setCurrentTurn(room, playerIdOrIndex) {
  if (typeof playerIdOrIndex === "number") {
    room.currentPlayerIndex = playerIdOrIndex;
    return;
  }

  const nextIndex = room.players.findIndex((player) => player.id === playerIdOrIndex);

  if (nextIndex >= 0) {
    room.currentPlayerIndex = nextIndex;
  }
}

// 15. 게임 시작하기 (역할, 덱, 손패, 첫 턴을 한 번에 준비하는 단계)
export function startGame(room) {
  if (!room) {
    return {
      ok: false,
      message: "방이 아직 없습니다.",
    };
  }

  if (room.players.length === 0) {
    addLog(room, "플레이어가 필요합니다.");
    return {
      ok: false,
      message: "플레이어가 필요합니다.",
    };
  }

  room.status = GAME_PHASES.PLAYING;
  room.board = createInitialBoard();
  room.deck = shuffleDeck(createDeck());
  room.discardPile = [];

  assignRoles(room);
  dealHands(room);
  setCurrentTurn(room, 0);
  addLog(room, "게임이 시작되었습니다.");

  return {
    ok: true,
    message: "게임이 시작되었습니다.",
  };
}

// 16. 현재 플레이어 가져오기 (턴 인덱스로 플레이어 객체를 찾는 단계)
export function getCurrentPlayer(room) {
  if (!room || room.players.length === 0) {
    return null;
  }

  return room.players[room.currentPlayerIndex] ?? null;
}

// 17. 특정 플레이어 손패 가져오기 (손패 저장소에서 배열을 안전하게 꺼내는 단계)
export function getPlayerHand(room, playerId) {
  if (!room || !room.hands[playerId]) {
    return [];
  }

  return room.hands[playerId];
}

// 18. 현재 플레이어 손패 가져오기 (렌더링에서 바로 쓰기 쉽게 묶는 단계)
export function getCurrentPlayerHand(room) {
  const currentPlayer = getCurrentPlayer(room);

  if (!currentPlayer) {
    return [];
  }

  return getPlayerHand(room, currentPlayer.id);
}

// 19. 손패 안 카드 찾기 (선택한 카드가 실제로 현재 플레이어에게 있는지 확인하는 단계)
export function findCardInPlayerHand(room, playerId, cardInstanceId) {
  return getPlayerHand(room, playerId).find((card) => card.instanceId === cardInstanceId) ?? null;
}

// 20. 손패 수 갱신하기 (공개 플레이어 상태에는 카드 장수만 저장하는 단계)
function updateHandCounts(room) {
  room.players.forEach((player) => {
    player.handCount = getPlayerHand(room, player.id).length;
  });
}

// 21. 손패에서 카드 제거하기 (사용한 카드를 플레이어 손패에서 빼는 단계)
function removeCardFromHand(room, playerId, cardInstanceId) {
  const hand = getPlayerHand(room, playerId);
  const cardIndex = hand.findIndex((card) => card.instanceId === cardInstanceId);

  if (cardIndex === -1) {
    return null;
  }

  const [removedCard] = hand.splice(cardIndex, 1);
  updateHandCounts(room);
  return removedCard;
}

// 22. 배관 타일 배치하기 (선택한 카드와 좌표를 검증한 뒤 보드에 저장하는 단계)
export function placePipeTile(room, playerId, cardInstanceId, coord, rotation) {
  const currentPlayer = getCurrentPlayer(room);
  const player = room.players.find((item) => item.id === playerId);

  if (room.status !== GAME_PHASES.PLAYING) {
    return {
      ok: false,
      message: "게임이 아직 시작되지 않았습니다.",
    };
  }

  if (!currentPlayer || currentPlayer.id !== playerId) {
    return {
      ok: false,
      message: "현재 턴 플레이어만 배관 타일을 놓을 수 있습니다.",
    };
  }

  if (player.suitDamaged) {
    return {
      ok: false,
      message: "우주복 손상 상태에서는 배관 타일을 놓을 수 없습니다.",
    };
  }

  const card = findCardInPlayerHand(room, playerId, cardInstanceId);

  if (!card || card.type !== CARD_TYPES.PIPE_TILE) {
    return {
      ok: false,
      message: "배관 타일 카드를 선택해야 합니다.",
    };
  }

  const tileDefinition = getPipeTileDefinition(card.tileId);

  if (!tileDefinition) {
    return {
      ok: false,
      message: "배관 타일 정의를 찾을 수 없습니다.",
    };
  }

  const targetCoord = createCoord(coord.x, coord.y);
  const nextRotation = normalizeRotation(rotation);
  const placement = isPipePlacementAllowed(room.board, targetCoord, tileDefinition, nextRotation);

  if (!placement.ok) {
    return placement;
  }

  room.board.tiles[coordKey(targetCoord)] = {
    type: "pipe",
    tileId: tileDefinition.id,
    label: tileDefinition.label,
    placedBy: playerId,
    rotation: nextRotation,
    connections: rotateConnections(tileDefinition.connections, nextRotation),
  };

  removeCardFromHand(room, playerId, cardInstanceId);
  drawCardForPlayer(room, playerId);
  addLog(room, `${player.name}이 ${tileDefinition.label} 배치.`);
  advanceTurn(room);

  return {
    ok: true,
    message: "배관 타일을 배치했습니다.",
  };
}

// 23. 행동 카드 자리 만들기 (세부 효과는 다음 단계에서 구현할 수 있게 남겨두는 단계)
export function playActionCard(room, playerId, cardInstanceId, target) {
  const card = findCardInPlayerHand(room, playerId, cardInstanceId);

  if (!card || card.type !== CARD_TYPES.ACTION) {
    return {
      ok: false,
      message: "행동 카드를 선택해야 합니다.",
    };
  }

  addLog(room, `${card.label} 처리는 다음 구현 단계에서 연결됩니다.`);

  return {
    ok: false,
    target,
    message: "행동 카드 처리는 아직 자리만 준비되어 있습니다.",
  };
}

// 24. 우주복 손상 상태 바꾸기 (행동 카드 구현 전에도 배치 제한 로직을 테스트하는 단계)
export function setSuitDamage(room, playerId, isDamaged) {
  const player = room.players.find((item) => item.id === playerId);

  if (!player) {
    return false;
  }

  player.suitDamaged = Boolean(isDamaged);
  return true;
}

// 25. 턴 넘기기 (다음 플레이어 인덱스로 이동하는 단계)
export function advanceTurn(room) {
  if (!room || room.players.length === 0) {
    return;
  }

  room.currentPlayerIndex = (room.currentPlayerIndex + 1) % room.players.length;

  const currentPlayer = getCurrentPlayer(room);
  addLog(room, `현재 턴: ${currentPlayer.name}`);
}

// 26. 로그 추가하기 (중요한 이벤트를 최신순 확인용 목록에 남기는 단계)
export function addLog(room, message) {
  room.logs.push(message);

  if (room.logs.length > 50) {
    room.logs.shift();
  }
}
