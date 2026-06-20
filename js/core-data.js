// 1. 역할 상수 만들기 (게임 안에서 쓰는 역할 값을 한곳에 모으는 단계)
export const ROLES = Object.freeze({
  ASTRONAUT: "astronaut",
  ALIEN: "alien",
});

export const ROLE_LABELS = Object.freeze({
  [ROLES.ASTRONAUT]: "우주비행사",
  [ROLES.ALIEN]: "에일리언",
});

// 2. 카드 타입 상수 만들기 (배관 타일과 행동 카드를 구분하는 단계)
export const CARD_TYPES = Object.freeze({
  PIPE_TILE: "pipe-tile",
  ACTION: "action",
});

export const CARD_TYPE_LABELS = Object.freeze({
  [CARD_TYPES.PIPE_TILE]: "배관 타일",
  [CARD_TYPES.ACTION]: "행동 카드",
});

// 3. 행동 카드 상수 만들기 (다음 단계에서 구현할 행동 종류를 미리 고정하는 단계)
export const ACTION_CARD_TYPES = Object.freeze({
  SUIT_DAMAGE: "suit-damage",
  SUIT_REPAIR: "suit-repair",
  METEOR_COLLISION: "meteor-collision",
  SECTOR_SCAN: "sector-scan",
});

export const ACTION_CARD_LABELS = Object.freeze({
  [ACTION_CARD_TYPES.SUIT_DAMAGE]: "우주복 손상",
  [ACTION_CARD_TYPES.SUIT_REPAIR]: "우주복 수리",
  [ACTION_CARD_TYPES.METEOR_COLLISION]: "유성우 충돌",
  [ACTION_CARD_TYPES.SECTOR_SCAN]: "섹터 스캔",
});

// 4. 방향 상수 만들기 (배관 연결 방향을 같은 문자열로 다루는 단계)
export const DIRECTIONS = Object.freeze({
  UP: "up",
  RIGHT: "right",
  DOWN: "down",
  LEFT: "left",
});

export const DIRECTION_ORDER = Object.freeze([
  DIRECTIONS.UP,
  DIRECTIONS.RIGHT,
  DIRECTIONS.DOWN,
  DIRECTIONS.LEFT,
]);

export const DIRECTION_LABELS = Object.freeze({
  [DIRECTIONS.UP]: "상",
  [DIRECTIONS.RIGHT]: "우",
  [DIRECTIONS.DOWN]: "하",
  [DIRECTIONS.LEFT]: "좌",
});

export const DIRECTION_OFFSETS = Object.freeze({
  [DIRECTIONS.UP]: Object.freeze({ x: 0, y: -1 }),
  [DIRECTIONS.RIGHT]: Object.freeze({ x: 1, y: 0 }),
  [DIRECTIONS.DOWN]: Object.freeze({ x: 0, y: 1 }),
  [DIRECTIONS.LEFT]: Object.freeze({ x: -1, y: 0 }),
});

// 5. 배관 타일 정의하기 (기본 방향 연결을 카드 데이터로 표현하는 단계)
export const PIPE_TILE_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: "pipe-straight",
    label: "직선 배관",
    connections: Object.freeze([DIRECTIONS.LEFT, DIRECTIONS.RIGHT]),
  }),
  Object.freeze({
    id: "pipe-corner",
    label: "곡선 배관",
    connections: Object.freeze([DIRECTIONS.UP, DIRECTIONS.RIGHT]),
  }),
  Object.freeze({
    id: "pipe-t",
    label: "삼방향 배관",
    connections: Object.freeze([DIRECTIONS.LEFT, DIRECTIONS.UP, DIRECTIONS.RIGHT]),
  }),
  Object.freeze({
    id: "pipe-cross",
    label: "사방향 배관",
    connections: Object.freeze([
      DIRECTIONS.UP,
      DIRECTIONS.RIGHT,
      DIRECTIONS.DOWN,
      DIRECTIONS.LEFT,
    ]),
  }),
  Object.freeze({
    id: "pipe-dead-end",
    label: "막힌 배관",
    connections: Object.freeze([DIRECTIONS.LEFT]),
  }),
]);

// 6. 카드 정의하기 (덱을 만들 때 복사할 원본 목록을 준비하는 단계)
export const CARD_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: "card-pipe-straight",
    label: "직선 배관",
    type: CARD_TYPES.PIPE_TILE,
    tileId: "pipe-straight",
    count: 10,
  }),
  Object.freeze({
    id: "card-pipe-corner",
    label: "곡선 배관",
    type: CARD_TYPES.PIPE_TILE,
    tileId: "pipe-corner",
    count: 10,
  }),
  Object.freeze({
    id: "card-pipe-t",
    label: "삼방향 배관",
    type: CARD_TYPES.PIPE_TILE,
    tileId: "pipe-t",
    count: 8,
  }),
  Object.freeze({
    id: "card-pipe-cross",
    label: "사방향 배관",
    type: CARD_TYPES.PIPE_TILE,
    tileId: "pipe-cross",
    count: 5,
  }),
  Object.freeze({
    id: "card-pipe-dead-end",
    label: "막힌 배관",
    type: CARD_TYPES.PIPE_TILE,
    tileId: "pipe-dead-end",
    count: 5,
  }),
  Object.freeze({
    id: "card-suit-damage",
    label: ACTION_CARD_LABELS[ACTION_CARD_TYPES.SUIT_DAMAGE],
    type: CARD_TYPES.ACTION,
    actionType: ACTION_CARD_TYPES.SUIT_DAMAGE,
    count: 2,
  }),
  Object.freeze({
    id: "card-suit-repair",
    label: ACTION_CARD_LABELS[ACTION_CARD_TYPES.SUIT_REPAIR],
    type: CARD_TYPES.ACTION,
    actionType: ACTION_CARD_TYPES.SUIT_REPAIR,
    count: 2,
  }),
  Object.freeze({
    id: "card-meteor-collision",
    label: ACTION_CARD_LABELS[ACTION_CARD_TYPES.METEOR_COLLISION],
    type: CARD_TYPES.ACTION,
    actionType: ACTION_CARD_TYPES.METEOR_COLLISION,
    count: 2,
  }),
  Object.freeze({
    id: "card-sector-scan",
    label: ACTION_CARD_LABELS[ACTION_CARD_TYPES.SECTOR_SCAN],
    type: CARD_TYPES.ACTION,
    actionType: ACTION_CARD_TYPES.SECTOR_SCAN,
    count: 2,
  }),
]);

// 7. 목적지 타입 정의하기 (보드에는 숨김 상태로만 보여줄 실제 값을 준비하는 단계)
export const DESTINATION_TYPES = Object.freeze({
  GENERATOR_CORE: "generator-core",
  EMPTY_SECTOR: "empty-sector",
});

// 8. 좌표 키 만들기 (객체에서 보드 칸을 빠르게 찾기 위한 단계)
export function coordKey(coord) {
  return `${coord.x},${coord.y}`;
}

// 9. 좌표 키 풀기 (저장된 문자열 키를 다시 x, y로 바꾸는 단계)
export function parseCoordKey(key) {
  const [x, y] = key.split(",").map(Number);
  return { x, y };
}

// 10. 좌표 만들기 (문자열로 들어온 좌표도 숫자로 정리하는 단계)
export function createCoord(x, y) {
  return {
    x: Number(x),
    y: Number(y),
  };
}

// 11. 이웃 좌표 구하기 (방향 하나만큼 이동한 칸을 계산하는 단계)
export function neighborCoord(coord, direction) {
  const offset = DIRECTION_OFFSETS[direction];

  return {
    x: coord.x + offset.x,
    y: coord.y + offset.y,
  };
}

// 12. 반대 방향 구하기 (서로 맞닿은 배관을 검사하기 위한 단계)
export function getOppositeDirection(direction) {
  const index = DIRECTION_ORDER.indexOf(direction);
  return DIRECTION_ORDER[(index + 2) % DIRECTION_ORDER.length];
}

// 13. 회전값 정리하기 (음수나 큰 회전값도 0부터 3 사이로 맞추는 단계)
export function normalizeRotation(rotation) {
  return ((Number(rotation) % 4) + 4) % 4;
}

// 14. 방향 회전하기 (배관 타일을 90도 단위로 돌리는 단계)
export function rotateDirection(direction, rotation) {
  const index = DIRECTION_ORDER.indexOf(direction);
  const nextIndex = (index + normalizeRotation(rotation)) % DIRECTION_ORDER.length;
  return DIRECTION_ORDER[nextIndex];
}

// 15. 배관 연결 회전하기 (타일의 모든 연결 방향을 한 번에 계산하는 단계)
export function rotateConnections(connections, rotation) {
  const rotated = connections.map((direction) => rotateDirection(direction, rotation));
  return normalizeConnections(rotated);
}

// 16. 연결 방향 정렬하기 (화면과 비교 로직에서 항상 같은 순서로 쓰는 단계)
export function normalizeConnections(connections) {
  return DIRECTION_ORDER.filter((direction) => connections.includes(direction));
}

// 17. 특정 방향 연결 확인하기 (배관이 해당 방향으로 열려 있는지 검사하는 단계)
export function hasConnection(connections, direction) {
  return connections.includes(direction);
}

// 18. 배관 타일 찾기 (카드가 가리키는 타일 정의를 가져오는 단계)
export function getPipeTileDefinition(tileId) {
  return PIPE_TILE_DEFINITIONS.find((tile) => tile.id === tileId) ?? null;
}

// 19. 보드 칸 내용 찾기 (출발지, 목적지, 배치된 배관을 같은 방식으로 읽는 단계)
export function getBoardEntityAt(board, coord) {
  const key = coordKey(coord);

  if (board.tiles[key]) {
    return {
      kind: "pipe",
      data: board.tiles[key],
    };
  }

  if (board.start.x === coord.x && board.start.y === coord.y) {
    return {
      kind: "start",
      data: board.start,
    };
  }

  const destination = board.destinations.find(
    (target) => target.x === coord.x && target.y === coord.y,
  );

  if (destination) {
    return {
      kind: "destination",
      data: destination,
    };
  }

  return null;
}

// 20. 배관 배치 가능 여부 확인하기 (빈 칸인지와 이웃 연결이 맞는지 검사하는 단계)
export function isPipePlacementAllowed(board, coord, tileDefinition, rotation) {
  const existingEntity = getBoardEntityAt(board, coord);

  if (existingEntity) {
    return {
      ok: false,
      message: "이미 사용 중인 칸입니다.",
    };
  }

  const placedConnections = rotateConnections(tileDefinition.connections, rotation);
  let matchedConnectionCount = 0;

  for (const direction of DIRECTION_ORDER) {
    const neighbor = getBoardEntityAt(board, neighborCoord(coord, direction));

    if (!neighbor) {
      continue;
    }

    const neighborConnections = neighbor.data.connections;
    const currentOpens = hasConnection(placedConnections, direction);
    const neighborOpens = hasConnection(neighborConnections, getOppositeDirection(direction));

    if (currentOpens !== neighborOpens) {
      return {
        ok: false,
        message: "이웃 칸과 배관 방향이 맞지 않습니다.",
      };
    }

    if (currentOpens && neighborOpens && neighbor.kind !== "destination") {
      matchedConnectionCount += 1;
    }
  }

  if (matchedConnectionCount === 0) {
    return {
      ok: false,
      message: "기존 배관 또는 산소 공급기와 연결되어야 합니다.",
    };
  }

  return {
    ok: true,
    message: "배치할 수 있습니다.",
  };
}
