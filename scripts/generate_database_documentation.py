from __future__ import annotations

import re
import xml.etree.ElementTree as ET
from collections import defaultdict
from datetime import datetime
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "database_documentation.pdf"
MAPPER_DIR = ROOT / "src/main/resources/mapper"
MODEL_DIR = ROOT / "src/main/java/com/genai/model"


def col(name, data_type, nullable=False, default="", keys="", note=""):
    return {
        "name": name,
        "type": data_type,
        "nullable": nullable,
        "default": default,
        "keys": keys,
        "note": note,
    }


TABLES = {
    "PARENT": {
        "description": "보호자 계정과 인증 정보를 저장한다.",
        "columns": [
            col("PARENT_ID", "NUMBER", keys="PK", note="보호자 식별자"),
            col("EMAIL", "VARCHAR2(100)", keys="UNIQUE", note="로그인 이메일"),
            col("PASSWORD_HASH", "VARCHAR2(255)", note="해시된 비밀번호"),
            col("NAME", "VARCHAR2(50)", note="보호자 이름"),
            col("CREATED_AT", "TIMESTAMP(6)", default="SYSTIMESTAMP", note="가입 시각"),
        ],
        "constraints": [
            "PK_PARENT: PRIMARY KEY (PARENT_ID)",
            "UQ_PARENT_EMAIL: UNIQUE (EMAIL)",
        ],
        "indexes": ["PK_PARENT (UNIQUE)", "UQ_PARENT_EMAIL (UNIQUE)"],
        "sequence": "SEQ_PARENT",
        "trigger": "TRG_PARENT_ID (BEFORE INSERT)",
        "source": "database/01_parent_schema.sql",
    },
    "CHILD_INVITE": {
        "description": "보호자가 발급한 아이 연결용 초대코드와 재발급 이력을 저장한다.",
        "columns": [
            col("INVITE_ID", "NUMBER", keys="PK"),
            col("PARENT_ID", "NUMBER", keys="FK → PARENT.PARENT_ID"),
            col("INVITE_CODE", "VARCHAR2(30)", keys="UNIQUE"),
            col("QR_URL", "VARCHAR2(500)", nullable=True),
            col("CREATED_AT", "TIMESTAMP(6)", default="SYSTIMESTAMP"),
            col("REGENERATED_AT", "TIMESTAMP(6)", nullable=True),
        ],
        "constraints": [
            "PK_CHILD_INVITE: PRIMARY KEY (INVITE_ID)",
            "UQ_CHILD_INVITE_CODE: UNIQUE (INVITE_CODE)",
            "FK_CHILD_INVITE_PARENT: PARENT_ID → PARENT.PARENT_ID",
        ],
        "indexes": ["PK_CHILD_INVITE (UNIQUE)", "UQ_CHILD_INVITE_CODE (UNIQUE)"],
        "sequence": "SEQ_CHILD_INVITE",
        "trigger": "TRG_CHILD_INVITE_ID (BEFORE INSERT)",
        "source": "database/02_login_child_schema.sql",
    },
    "FRAME": {
        "description": "아이 프로필에 적용되는 액자 등급, 이미지, 해금 배지 수를 관리한다.",
        "columns": [
            col("FRAME_ID", "NUMBER", keys="PK"),
            col("FRAME_TYPE", "VARCHAR2(20)", keys="UNIQUE"),
            col("FRAME_NAME", "VARCHAR2(50)"),
            col("FRAME_IMAGE_URL", "VARCHAR2(500)"),
            col("REQUIRED_BADGE_COUNT", "NUMBER", default="0", note="해금에 필요한 배지 수"),
            col("CREATED_AT", "TIMESTAMP(6)", default="SYSTIMESTAMP"),
        ],
        "constraints": [
            "PK_FRAME: PRIMARY KEY (FRAME_ID)",
            "UQ_FRAME_TYPE: UNIQUE (FRAME_TYPE)",
            "CK_FRAME_TYPE: wood/bronze/iron/gold/crystal/legend/Aurora",
            "CK_FRAME_BADGE: REQUIRED_BADGE_COUNT >= 0",
        ],
        "indexes": ["PK_FRAME (UNIQUE)", "UQ_FRAME_TYPE (UNIQUE)"],
        "sequence": "SEQ_FRAME",
        "trigger": "TRG_FRAME_ID (BEFORE INSERT)",
        "source": "database/02_login_child_schema.sql, database/06_profile_frame_seed.sql",
    },
    "CHILD": {
        "description": "보호자에게 연결된 아이 프로필과 현재 액자·캐릭터 상태를 저장한다.",
        "columns": [
            col("CHILD_ID", "NUMBER", keys="PK"),
            col("PARENT_ID", "NUMBER", keys="FK → PARENT.PARENT_ID"),
            col("INVITE_ID", "NUMBER", keys="FK → CHILD_INVITE.INVITE_ID, UNIQUE"),
            col("FRAME_ID", "NUMBER", keys="FK → FRAME.FRAME_ID"),
            col("NICKNAME", "VARCHAR2(50)"),
            col("CHARACTER_IMAGE_URL", "VARCHAR2(500)", nullable=True),
            col("CHARACTER_LEVEL", "NUMBER", default="1"),
            col("CREATED_AT", "TIMESTAMP(6)", default="SYSTIMESTAMP"),
        ],
        "constraints": [
            "PK_CHILD: PRIMARY KEY (CHILD_ID)",
            "UQ_CHILD_INVITE: UNIQUE (INVITE_ID)",
            "FK_CHILD_PARENT / FK_CHILD_INVITE / FK_CHILD_FRAME",
            "CK_CHILD_LEVEL: CHARACTER_LEVEL >= 1",
        ],
        "indexes": [
            "PK_CHILD (UNIQUE)",
            "UQ_CHILD_INVITE (UNIQUE)",
            "IDX_CHILD_PARENT (실DB)",
        ],
        "sequence": "SEQ_CHILD",
        "trigger": "TRG_CHILD_ID (BEFORE INSERT)",
        "source": "database/02_login_child_schema.sql",
    },
    "REWARD_BOX": {
        "description": "미션 등급별 보상 상자의 경험치 범위와 펫 드롭 확률을 정의한다.",
        "columns": [
            col("BOX_GRADE", "VARCHAR2(20)", keys="PK"),
            col("BOX_NAME", "VARCHAR2(50)"),
            col("MIN_EXP", "NUMBER"),
            col("MAX_EXP", "NUMBER"),
            col("PET_DROP_RATE", "NUMBER(5,2)", default="1.00"),
            col("CREATED_AT", "TIMESTAMP(6)", default="SYSTIMESTAMP"),
        ],
        "constraints": [
            "PK_REWARD_BOX: PRIMARY KEY (BOX_GRADE)",
            "CK_REWARD_BOX_GRADE: low/middle/high",
            "CK_REWARD_BOX_EXP: MIN_EXP >= 0 AND MAX_EXP >= MIN_EXP",
            "CK_REWARD_BOX_RATE: 0~100",
        ],
        "indexes": ["PK_REWARD_BOX (UNIQUE)"],
        "sequence": "없음(문자 PK)",
        "trigger": "없음",
        "source": "database/03_game_schema.sql, database/04_frontend_gap_schema.sql",
    },
    "PET": {
        "description": "펫 카탈로그, 획득 방식, 최대 레벨과 배지 메타데이터를 저장한다.",
        "columns": [
            col("PET_ID", "NUMBER", keys="PK"),
            col("PET_NAME", "VARCHAR2(50)"),
            col("PET_IMAGE_URL", "VARCHAR2(500)"),
            col("ACQUISITION_TYPE", "VARCHAR2(30)"),
            col("MAX_LEVEL", "NUMBER"),
            col("BADGE_NAME", "VARCHAR2(50)"),
            col("BADGE_IMAGE_URL", "VARCHAR2(500)"),
            col("DESCRIPTION", "VARCHAR2(1000)", nullable=True),
        ],
        "constraints": [
            "PK_PET: PRIMARY KEY (PET_ID)",
            "CK_PET_ACQ_TYPE: default/random_box/character_level",
            "CK_PET_MAX_LEVEL: MAX_LEVEL > 0",
        ],
        "indexes": ["PK_PET (UNIQUE)"],
        "sequence": "SEQ_PET",
        "trigger": "TRG_PET_ID (BEFORE INSERT)",
        "source": "database/03_game_schema.sql, database/07_pet_catalog_update.sql",
    },
    "CHILD_PET": {
        "description": "아이별 보유 펫의 레벨·경험치·대표 펫·배지 획득 상태를 저장한다.",
        "columns": [
            col("CHILD_PET_ID", "NUMBER", keys="PK"),
            col("CHILD_ID", "NUMBER", keys="FK → CHILD.CHILD_ID"),
            col("PET_ID", "NUMBER", keys="FK → PET.PET_ID"),
            col("CURRENT_LEVEL", "NUMBER", default="1"),
            col("CURRENT_EXP", "NUMBER", default="0"),
            col("IS_ACTIVE", "CHAR(1)", default="'N'"),
            col("IS_MAXED", "CHAR(1)", default="'N'"),
            col("BADGE_ACQUIRED", "CHAR(1)", default="'N'"),
            col("BADGE_ACQUIRED_AT", "TIMESTAMP(6)", nullable=True),
            col("ACQUIRED_AT", "TIMESTAMP(6)", default="SYSTIMESTAMP"),
        ],
        "constraints": [
            "PK_CHILD_PET: PRIMARY KEY (CHILD_PET_ID)",
            "UQ_CHILD_PET: UNIQUE (CHILD_ID, PET_ID)",
            "FK_CHILD_PET_CHILD / FK_CHILD_PET_PET",
            "레벨·EXP 음수 방지, Y/N 상태 체크",
        ],
        "indexes": [
            "PK_CHILD_PET (UNIQUE)",
            "UQ_CHILD_PET (UNIQUE)",
            "IDX_CHILD_PET_CHILD, IDX_CHILD_PET_PET (실DB)",
        ],
        "sequence": "SEQ_CHILD_PET",
        "trigger": "TRG_CHILD_PET_ID (BEFORE INSERT)",
        "source": "database/03_game_schema.sql",
    },
    "MISSION": {
        "description": "보호자가 아이에게 배정한 미션과 인증 방식·보상 등급을 저장한다.",
        "columns": [
            col("MISSION_ID", "NUMBER", keys="PK"),
            col("PARENT_ID", "NUMBER", keys="FK → PARENT.PARENT_ID"),
            col("CHILD_ID", "NUMBER", keys="FK → CHILD.CHILD_ID"),
            col("MISSION_TITLE", "VARCHAR2(100)"),
            col("MISSION_DESCRIPTION", "VARCHAR2(1000)", nullable=True),
            col("MISSION_GRADE", "VARCHAR2(20)", note="소스 DDL은 REWARD_BOX FK, 실DB는 CHECK 제약"),
            col("IS_ACTIVE", "CHAR(1)", default="'Y'"),
            col("CREATED_AT", "TIMESTAMP(6)", default="SYSTIMESTAMP"),
            col("UPDATED_AT", "TIMESTAMP(6)", nullable=True, note="실DB에만 확인"),
            col("MEDIA_TYPE", "VARCHAR2(10)", default="'video'"),
        ],
        "constraints": [
            "PK_MISSION: PRIMARY KEY (MISSION_ID)",
            "FK_MISSION_PARENT / FK_MISSION_CHILD",
            "소스: FK_MISSION_BOX → REWARD_BOX.BOX_GRADE",
            "실DB: CK_MISSION_GRADE, CK_MISSION_MEDIA, CK_MISSION_ACTIVE",
        ],
        "indexes": [
            "PK_MISSION (UNIQUE)",
            "IDX_MISSION_PARENT, IDX_MISSION_CHILD, IDX_MISSION_GRADE",
        ],
        "sequence": "SEQ_MISSION",
        "trigger": "TRG_MISSION_ID (BEFORE INSERT)",
        "source": "database/03_game_schema.sql, database/04_frontend_gap_schema.sql",
    },
    "MISSION_SUBMISSION": {
        "description": "아이의 사진·영상 인증 제출, 검토 결과, 보상 지급 상태를 저장한다.",
        "columns": [
            col("SUBMISSION_ID", "NUMBER", keys="PK"),
            col("MISSION_ID", "NUMBER", keys="FK → MISSION.MISSION_ID"),
            col("CHILD_ID", "NUMBER", keys="FK → CHILD.CHILD_ID"),
            col("MISSION_DATE", "DATE"),
            col("BOX_GRADE", "VARCHAR2(20)", nullable=True, keys="FK → REWARD_BOX.BOX_GRADE"),
            col("MEDIA_TYPE", "VARCHAR2(10)"),
            col("MEDIA_URL", "VARCHAR2(500)"),
            col("STATUS", "VARCHAR2(20)", default="'pending'"),
            col("SUBMITTED_AT", "TIMESTAMP(6)", default="SYSTIMESTAMP"),
            col("REVIEWED_AT", "TIMESTAMP(6)", nullable=True),
            col("REWARD_GIVEN", "CHAR(1)", default="'N'"),
            col("MEDIA_DELETED_AT", "TIMESTAMP(6)", nullable=True),
        ],
        "constraints": [
            "PK_MISSION_SUBMISSION",
            "FK_SUBMISSION_MISSION / CHILD / BOX",
            "CK_SUBMISSION_MEDIA: photo/video",
            "CK_SUBMISSION_STATUS: pending/approved/rejected",
            "CK_SUBMISSION_REWARD: Y/N",
        ],
        "indexes": [
            "PK_MISSION_SUBMISSION (UNIQUE)",
            "IDX_SUBMISSION_MISSION/CHILD/DATE/BOX",
        ],
        "sequence": "SEQ_MISSION_SUBMISSION",
        "trigger": "TRG_SUBMISSION_ID (BEFORE INSERT)",
        "source": "database/03_game_schema.sql",
    },
    "REWARD_HISTORY": {
        "description": "상자·상호작용·레벨·배지로 발생한 경험치/펫/액자 보상 이력을 저장한다.",
        "columns": [
            col("REWARD_ID", "NUMBER", keys="PK"),
            col("CHILD_ID", "NUMBER", keys="FK → CHILD.CHILD_ID"),
            col("SUBMISSION_ID", "NUMBER", nullable=True, keys="FK → MISSION_SUBMISSION.SUBMISSION_ID"),
            col("BOX_GRADE", "VARCHAR2(20)", nullable=True, keys="FK → REWARD_BOX.BOX_GRADE"),
            col("CHILD_PET_ID", "NUMBER", nullable=True, keys="FK → CHILD_PET.CHILD_PET_ID"),
            col("PET_ID", "NUMBER", nullable=True, keys="FK → PET.PET_ID"),
            col("FRAME_ID", "NUMBER", nullable=True, keys="FK → FRAME.FRAME_ID"),
            col("REWARD_TYPE", "VARCHAR2(20)"),
            col("REWARD_SOURCE", "VARCHAR2(30)"),
            col("EXP_AMOUNT", "NUMBER", nullable=True),
            col("CREATED_AT", "TIMESTAMP(6)", default="SYSTIMESTAMP"),
        ],
        "constraints": [
            "PK_REWARD_HISTORY 및 6개 FK",
            "CK_REWARD_TYPE: exp/pet/badge/frame",
            "CK_REWARD_SOURCE: box/interaction/pet_level/badge_count",
            "CK_REWARD_EXP: NULL 또는 0 이상",
        ],
        "indexes": [
            "PK_REWARD_HISTORY (UNIQUE)",
            "IDX_REWARD_CHILD/SUBMISSION/BOX",
        ],
        "sequence": "SEQ_REWARD_HISTORY",
        "trigger": "TRG_REWARD_HISTORY_ID (BEFORE INSERT)",
        "source": "database/03_game_schema.sql",
    },
    "NOTIFICATION": {
        "description": "부모·아이에게 전달되는 미션 배정, 인증 요청, 승인, 보상 알림을 저장한다.",
        "columns": [
            col("NOTIFICATION_ID", "NUMBER", keys="PK"),
            col("PARENT_ID", "NUMBER", nullable=True, keys="FK → PARENT.PARENT_ID"),
            col("CHILD_ID", "NUMBER", nullable=True, keys="FK → CHILD.CHILD_ID"),
            col("MISSION_ID", "NUMBER", nullable=True, keys="FK → MISSION.MISSION_ID"),
            col("SUBMISSION_ID", "NUMBER", nullable=True, keys="FK → MISSION_SUBMISSION.SUBMISSION_ID"),
            col("REWARD_ID", "NUMBER", nullable=True, keys="FK → REWARD_HISTORY.REWARD_ID"),
            col("NOTIFICATION_TYPE", "VARCHAR2(30)"),
            col("TITLE", "VARCHAR2(100)"),
            col("CONTENT", "VARCHAR2(1000)", nullable=True),
            col("IS_READ", "CHAR(1)", default="'N'"),
            col("CREATED_AT", "TIMESTAMP(6)", default="SYSTIMESTAMP"),
            col("READ_AT", "TIMESTAMP(6)", nullable=True),
        ],
        "constraints": [
            "PK_NOTIFICATION 및 5개 FK",
            "CK_NOTIFICATION_TYPE: mission_assigned/reward_request/mission_approved/mission_rejected/reward_paid/reminder",
            "CK_NOTIFICATION_READ: Y/N",
            "CK_NOTIFICATION_RECEIVER: 부모 또는 아이 중 정확히 한 대상",
        ],
        "indexes": [
            "PK_NOTIFICATION (UNIQUE)",
            "IDX_NOTIFICATION_PARENT/CHILD/MISSION/SUBMISSION/REWARD",
        ],
        "sequence": "SEQ_NOTIFICATION",
        "trigger": "TRG_NOTIFICATION_ID (BEFORE INSERT)",
        "source": "database/03_game_schema.sql, database/04_frontend_gap_schema.sql",
    },
    "AUTH_LOGIN_TOKEN": {
        "description": "부모 7일·아이 30일 로그인 유지를 위한 해시 토큰과 만료 시각을 저장한다.",
        "columns": [
            col("TOKEN_ID", "NUMBER", keys="PK"),
            col("TOKEN_HASH", "VARCHAR2(64)", keys="UNIQUE"),
            col("SUBJECT_TYPE", "VARCHAR2(10)"),
            col("PARENT_ID", "NUMBER", nullable=True, keys="FK → PARENT.PARENT_ID"),
            col("CHILD_ID", "NUMBER", nullable=True, keys="FK → CHILD.CHILD_ID"),
            col("EXPIRES_AT", "TIMESTAMP(6)"),
            col("CREATED_AT", "TIMESTAMP(6)", default="SYSTIMESTAMP"),
            col("LAST_USED_AT", "TIMESTAMP(6)", default="SYSTIMESTAMP"),
        ],
        "constraints": [
            "PK_AUTH_LOGIN_TOKEN",
            "UQ_AUTH_LOGIN_TOKEN_HASH",
            "FK_AUTH_TOKEN_PARENT / FK_AUTH_TOKEN_CHILD",
            "CK_AUTH_TOKEN_TYPE 및 대상 일관성 체크",
        ],
        "indexes": [
            "PK/UQ 인덱스",
            "IDX_AUTH_TOKEN_PARENT/CHILD/EXPIRY",
        ],
        "sequence": "SEQ_AUTH_LOGIN_TOKEN",
        "trigger": "없음(MyBatis가 NEXTVAL 직접 사용)",
        "source": "database/05_persistent_login_schema.sql",
    },
    "PET_INTERACTION_COOLDOWN": {
        "description": "대표 펫 상호작용 종류별 30분 경험치 보상 쿨타임을 저장한다.",
        "columns": [
            col("CHILD_PET_ID", "NUMBER", keys="PK, FK → CHILD_PET.CHILD_PET_ID"),
            col("ACTION_TYPE", "VARCHAR2(20)", keys="PK"),
            col("LAST_REWARDED_AT", "TIMESTAMP(6)", default="SYSTIMESTAMP"),
        ],
        "constraints": [
            "PK_PET_INTERACTION_COOLDOWN: (CHILD_PET_ID, ACTION_TYPE)",
            "FK_PET_INTERACTION_CHILD_PET",
            "CK_PET_INTERACTION_ACTION: touch/praise/play/magic",
        ],
        "indexes": ["PK_PET_INTERACTION_COOLDOWN (UNIQUE)"],
        "sequence": "없음(복합 PK)",
        "trigger": "없음",
        "source": "database/08_pet_interaction_cooldown.sql",
    },
    "CHILD_DAILY_MISSION_PROGRESS": {
        "description": "아이별 날짜·난이도별 일일 미션 완료 횟수를 집계한다. 현재 실DB에는 있으나 저장소 SQL/매퍼에는 정의가 없다.",
        "columns": [
            col("PROGRESS_ID", "NUMBER", keys="PK"),
            col("CHILD_ID", "NUMBER", keys="FK → CHILD.CHILD_ID"),
            col("PROGRESS_DATE", "DATE", keys="UNIQUE(복합)"),
            col("LOW_CLEAR_COUNT", "NUMBER", default="0"),
            col("MIDDLE_CLEAR_COUNT", "NUMBER", default="0"),
            col("HIGH_CLEAR_COUNT", "NUMBER", default="0"),
            col("TOTAL_CLEAR_COUNT", "NUMBER", default="0"),
            col("CREATED_AT", "TIMESTAMP(6)", default="SYSTIMESTAMP"),
            col("UPDATED_AT", "TIMESTAMP(6)", nullable=True),
        ],
        "constraints": [
            "PK_DAILY_PROGRESS",
            "UQ_DAILY_PROGRESS: UNIQUE (CHILD_ID, PROGRESS_DATE)",
            "FK_DAILY_PROGRESS_CHILD",
            "등급별/전체 완료 횟수 범위 CHECK",
        ],
        "indexes": [
            "PK_DAILY_PROGRESS (UNIQUE)",
            "UQ_DAILY_PROGRESS (UNIQUE)",
            "IDX_DAILY_PROGRESS_CHILD",
        ],
        "sequence": "SEQ_DAILY_PROGRESS",
        "trigger": "TRG_DAILY_PROGRESS_ID (BEFORE INSERT)",
        "source": "실DB 메타데이터(저장소 내 DDL 없음)",
    },
}


RELATIONSHIPS = [
    ("CHILD_INVITE", "PARENT", "PARENT_ID"),
    ("CHILD", "PARENT", "PARENT_ID"),
    ("CHILD", "CHILD_INVITE", "INVITE_ID"),
    ("CHILD", "FRAME", "FRAME_ID"),
    ("CHILD_PET", "CHILD", "CHILD_ID"),
    ("CHILD_PET", "PET", "PET_ID"),
    ("MISSION", "PARENT", "PARENT_ID"),
    ("MISSION", "CHILD", "CHILD_ID"),
    ("MISSION_SUBMISSION", "MISSION", "MISSION_ID"),
    ("MISSION_SUBMISSION", "CHILD", "CHILD_ID"),
    ("MISSION_SUBMISSION", "REWARD_BOX", "BOX_GRADE"),
    ("REWARD_HISTORY", "CHILD", "CHILD_ID"),
    ("REWARD_HISTORY", "MISSION_SUBMISSION", "SUBMISSION_ID"),
    ("REWARD_HISTORY", "REWARD_BOX", "BOX_GRADE"),
    ("REWARD_HISTORY", "CHILD_PET", "CHILD_PET_ID"),
    ("REWARD_HISTORY", "PET", "PET_ID"),
    ("REWARD_HISTORY", "FRAME", "FRAME_ID"),
    ("NOTIFICATION", "PARENT", "PARENT_ID"),
    ("NOTIFICATION", "CHILD", "CHILD_ID"),
    ("NOTIFICATION", "MISSION", "MISSION_ID"),
    ("NOTIFICATION", "MISSION_SUBMISSION", "SUBMISSION_ID"),
    ("NOTIFICATION", "REWARD_HISTORY", "REWARD_ID"),
    ("AUTH_LOGIN_TOKEN", "PARENT", "PARENT_ID"),
    ("AUTH_LOGIN_TOKEN", "CHILD", "CHILD_ID"),
    ("PET_INTERACTION_COOLDOWN", "CHILD_PET", "CHILD_PET_ID"),
    ("CHILD_DAILY_MISSION_PROGRESS", "CHILD", "CHILD_ID"),
]


TABLE_CLASS_MAP = {
    "PARENT": ["Parent"],
    "CHILD_INVITE": ["ChildInvite"],
    "FRAME": ["ProfileFrame"],
    "CHILD": ["ChildProfile"],
    "REWARD_BOX": ["RewardBox", "RewardInventoryItem"],
    "PET": ["Pet"],
    "CHILD_PET": ["ChildPet"],
    "MISSION": ["Mission", "ChildMissionProgress"],
    "MISSION_SUBMISSION": ["MissionSubmission"],
    "REWARD_HISTORY": ["ActivityRecord", "BoxOpenResult"],
    "NOTIFICATION": ["Notification"],
    "AUTH_LOGIN_TOKEN": ["Parent", "ChildProfile (조회 결과)", "직접 토큰 VO 없음"],
    "PET_INTERACTION_COOLDOWN": ["PetInteractionCooldown"],
    "CHILD_DAILY_MISSION_PROGRESS": ["대응 Java 클래스 없음"],
}


MAPPER_PURPOSE = {
    "ParentMapper": "보호자 회원가입·이메일 조회",
    "ChildAccountMapper": "초대코드, 아이 계정, 프로필 액자",
    "GameProfileMapper": "펫 카탈로그, 보유 펫, 성장 및 상호작용",
    "MissionMapper": "미션, 인증 제출, 보상, 알림, 활동 집계",
    "AuthTokenMapper": "부모·아이 로그인 유지 토큰",
}


def register_fonts():
    candidates = [
        Path("C:/Windows/Fonts/malgun.ttf"),
        Path("/usr/share/fonts/truetype/nanum/NanumGothic.ttf"),
        ROOT / "fonts/NanumGothic.ttf",
    ]
    bold_candidates = [
        Path("C:/Windows/Fonts/malgunbd.ttf"),
        Path("/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf"),
        ROOT / "fonts/NanumGothicBold.ttf",
    ]
    regular = next((p for p in candidates if p.exists()), None)
    bold = next((p for p in bold_candidates if p.exists()), regular)
    if not regular:
        raise FileNotFoundError("한글 폰트를 찾을 수 없습니다.")
    pdfmetrics.registerFont(TTFont("Korean", str(regular)))
    pdfmetrics.registerFont(TTFont("Korean-Bold", str(bold)))
    pdfmetrics.registerFontFamily(
        "Korean", normal="Korean", bold="Korean-Bold",
        italic="Korean", boldItalic="Korean-Bold"
    )


def parse_mapper_xml():
    mappings = []
    for path in sorted(MAPPER_DIR.glob("*.xml")):
        text = path.read_text(encoding="utf-8")
        text = re.sub(r"<!DOCTYPE[^>]*(?:\[[\s\S]*?\]\s*)?>", "", text, count=1)
        root = ET.fromstring(text)
        namespace = root.attrib.get("namespace", "")
        mapper_name = namespace.rsplit(".", 1)[-1]
        for node in root:
            if node.tag not in {"select", "insert", "update", "delete"}:
                continue
            sql = " ".join("".join(node.itertext()).split())
            tables = sorted(set(
                re.findall(
                    r"\b(?:FROM|JOIN|INTO|UPDATE|MERGE\s+INTO)\s+([A-Z][A-Z0-9_]*)",
                    sql.upper(),
                )
            ) - {"DUAL"})
            mappings.append({
                "mapper": mapper_name,
                "xml": path.name,
                "id": node.attrib.get("id", ""),
                "op": node.tag.upper(),
                "tables": tables,
                "summary": summarize_query(node.attrib.get("id", ""), node.tag),
            })
    return mappings


def summarize_query(query_id, operation):
    words = re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", query_id).replace("_", " ").lower()
    translations = {
        "find": "조회", "count": "건수 확인", "insert": "등록", "update": "수정",
        "delete": "삭제", "mark": "상태 표시", "activate": "활성화",
        "deactivate": "비활성화", "unlock": "해금", "claim": "보상 수령",
    }
    action = next((ko for en, ko in translations.items() if words.startswith(en)), operation)
    return f"{action}: {words}"


def parse_java_fields():
    result = {}
    pattern = re.compile(r"^\s*private\s+(?!static|final)([\w.<>, ?]+)\s+(\w+)\s*;", re.M)
    for path in sorted(MODEL_DIR.glob("*.java")):
        text = path.read_text(encoding="utf-8")
        fields = [(field_type.strip(), name) for field_type, name in pattern.findall(text)]
        if fields:
            result[path.stem] = fields
    return result


def camel_to_snake(name):
    return re.sub(r"(?<!^)(?=[A-Z])", "_", name).upper()


class DatabaseDocTemplate(BaseDocTemplate):
    def __init__(self, filename, **kwargs):
        super().__init__(filename, **kwargs)
        frame = Frame(
            self.leftMargin, self.bottomMargin, self.width, self.height,
            id="normal", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0
        )
        self.addPageTemplates(PageTemplate(id="main", frames=frame, onPage=self.draw_page))

    def draw_page(self, canvas, doc):
        canvas.saveState()
        canvas.setFont("Korean", 8)
        canvas.setFillColor(colors.HexColor("#64748B"))
        if doc.page > 1:
            canvas.drawString(18 * mm, 10 * mm, "Oracle 데이터베이스 스키마 문서")
            canvas.drawRightString(A4[0] - 18 * mm, 10 * mm, f"{doc.page}")
        canvas.restoreState()

    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph):
            level = getattr(flowable, "_toc_level", None)
            if level is not None:
                text = flowable.getPlainText()
                key = f"section-{self.seq.nextf('section')}"
                self.canv.bookmarkPage(key)
                self.canv.addOutlineEntry(text, key, level=level, closed=False)
                self.notify("TOCEntry", (level, text, self.page, key))


def build_styles():
    styles = getSampleStyleSheet()
    base = ParagraphStyle(
        "BodyKR", parent=styles["BodyText"], fontName="Korean",
        fontSize=9, leading=14, textColor=colors.HexColor("#263238"),
        wordWrap="CJK", spaceAfter=4,
    )
    return {
        "title": ParagraphStyle(
            "TitleKR", parent=base, fontName="Korean-Bold", fontSize=25,
            leading=34, alignment=TA_CENTER, textColor=colors.HexColor("#1E3A5F"),
        ),
        "subtitle": ParagraphStyle(
            "SubtitleKR", parent=base, fontSize=11, leading=18,
            alignment=TA_CENTER, textColor=colors.HexColor("#546E7A"),
        ),
        "h1": ParagraphStyle(
            "H1KR", parent=base, fontName="Korean-Bold", fontSize=17,
            leading=23, textColor=colors.HexColor("#123B5D"),
            spaceBefore=10, spaceAfter=9, keepWithNext=True,
        ),
        "h2": ParagraphStyle(
            "H2KR", parent=base, fontName="Korean-Bold", fontSize=13,
            leading=18, textColor=colors.HexColor("#176B87"),
            spaceBefore=8, spaceAfter=6, keepWithNext=True,
        ),
        "h3": ParagraphStyle(
            "H3KR", parent=base, fontName="Korean-Bold", fontSize=10.5,
            leading=15, textColor=colors.HexColor("#0F766E"),
            spaceBefore=6, spaceAfter=4, keepWithNext=True,
        ),
        "body": base,
        "small": ParagraphStyle(
            "SmallKR", parent=base, fontSize=7.5, leading=10,
        ),
        "code": ParagraphStyle(
            "CodeKR", parent=base, fontName="Korean", fontSize=7.2,
            leading=10, leftIndent=5, rightIndent=5,
            backColor=colors.HexColor("#F1F5F9"), borderPadding=5,
        ),
        "note": ParagraphStyle(
            "NoteKR", parent=base, fontSize=8.5, leading=13,
            backColor=colors.HexColor("#FFF8E1"), borderColor=colors.HexColor("#F4B942"),
            borderWidth=0.6, borderPadding=7, spaceBefore=5, spaceAfter=7,
        ),
    }


def heading(text, style, level):
    p = Paragraph(text, style)
    p._toc_level = level
    return p


def p(text, style):
    return Paragraph(str(text).replace("\n", "<br/>"), style)


def styled_table(data, widths, font_size=7.2, header=True, repeat_rows=1):
    table = Table(data, colWidths=widths, repeatRows=repeat_rows if header else 0, hAlign="LEFT")
    commands = [
        ("FONTNAME", (0, 0), (-1, -1), "Korean"),
        ("FONTSIZE", (0, 0), (-1, -1), font_size),
        ("LEADING", (0, 0), (-1, -1), font_size + 3),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#CBD5E1")),
        ("ROWBACKGROUNDS", (0, 1 if header else 0), (-1, -1),
         [colors.white, colors.HexColor("#F8FAFC")]),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]
    if header:
        commands += [
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#DDEBF3")),
            ("FONTNAME", (0, 0), (-1, 0), "Korean-Bold"),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#16324F")),
        ]
    table.setStyle(TableStyle(commands))
    return table


def add_bullets(story, items, styles):
    for item in items:
        story.append(p(f"• {item}", styles["body"]))


def build_pdf():
    register_fonts()
    styles = build_styles()
    mapper_rows = parse_mapper_xml()
    java_fields = parse_java_fields()
    doc = DatabaseDocTemplate(
        str(OUTPUT), pagesize=A4,
        leftMargin=16 * mm, rightMargin=16 * mm,
        topMargin=17 * mm, bottomMargin=16 * mm,
        title="Oracle 데이터베이스 스키마 문서",
        author="프로젝트 자동 분석",
    )
    story = []

    story += [
        Spacer(1, 28 * mm),
        p("Oracle 데이터베이스<br/>스키마 분석 문서", styles["title"]),
        Spacer(1, 8 * mm),
        p("Java Servlet · JSP/JSTL · MyBatis · Oracle XE 11g", styles["subtitle"]),
        Spacer(1, 18 * mm),
        styled_table([
            [p("항목", styles["small"]), p("내용", styles["small"])],
            [p("분석 대상", styles["small"]), p("DDL SQL, MyBatis XML/인터페이스, Java model/DAO, mybatis-config.xml", styles["small"])],
            [p("Oracle 계정", styles["small"]), p("CGI_25IS_GA3_P2_3 (비밀번호 미기재)", styles["small"])],
            [p("접속 대상", styles["small"]), p("project-db-campus.smhrd.com:1524:xe", styles["small"])],
            [p("생성 시각", styles["small"]), p(datetime.now().strftime("%Y-%m-%d %H:%M"), styles["small"])],
        ], [32 * mm, 126 * mm], font_size=8),
        Spacer(1, 15 * mm),
        p("주의: 저장소 DDL과 연결된 실DB 메타데이터를 교차 검증했다. 두 상태가 다른 경우 본문에 별도로 표시한다.", styles["note"]),
        PageBreak(),
        heading("목차", styles["h1"], 0),
    ]
    toc = TableOfContents()
    toc.levelStyles = [
        ParagraphStyle("TOC1", fontName="Korean-Bold", fontSize=10, leading=15, leftIndent=0, firstLineIndent=0),
        ParagraphStyle("TOC2", fontName="Korean", fontSize=9, leading=13, leftIndent=12, firstLineIndent=0),
    ]
    story += [toc, PageBreak()]

    story.append(heading("1. 데이터베이스 개요", styles["h1"], 0))
    overview = [
        ["구분", "저장소 DDL 기준", "연결된 실DB 기준"],
        ["테이블", "13개", "14개"],
        ["시퀀스", "11개", "12개"],
        ["트리거", "9개", "11개"],
        ["MyBatis Mapper XML", "5개", "동일"],
    ]
    story.append(styled_table([[p(x, styles["small"]) for x in row] for row in overview],
                              [42 * mm, 55 * mm, 61 * mm], font_size=8))
    story.append(Spacer(1, 5 * mm))
    add_bullets(story, [
        "DBMS: Oracle Database XE 11g, JDBC 드라이버: oracle.jdbc.OracleDriver / ojdbc8",
        "MyBatis 설정: mapUnderscoreToCamelCase=true, JDBC 트랜잭션, POOLED 데이터소스",
        "실DB 추가 객체: CHILD_DAILY_MISSION_PROGRESS, SEQ_DAILY_PROGRESS, TRG_DAILY_PROGRESS_ID",
        "실DB에는 저장소 DDL보다 보조 인덱스와 MISSION.UPDATED_AT 컬럼이 더 존재한다.",
    ], styles)

    story.append(heading("2. 테이블 상세 정보", styles["h1"], 0))
    for index, (table_name, info) in enumerate(TABLES.items(), start=1):
        story.append(heading(f"2.{index} {table_name}", styles["h2"], 1))
        story.append(p(info["description"], styles["body"]))
        rows = [[
            p("컬럼", styles["small"]), p("데이터 타입", styles["small"]),
            p("NULL", styles["small"]), p("DEFAULT", styles["small"]),
            p("키/제약", styles["small"]), p("설명", styles["small"]),
        ]]
        for c in info["columns"]:
            rows.append([
                p(c["name"], styles["small"]), p(c["type"], styles["small"]),
                p("허용" if c["nullable"] else "NOT NULL", styles["small"]),
                p(c["default"] or "-", styles["small"]),
                p(c["keys"] or "-", styles["small"]), p(c["note"] or "-", styles["small"]),
            ])
        story.append(styled_table(
            rows, [31 * mm, 25 * mm, 17 * mm, 24 * mm, 38 * mm, 23 * mm],
            font_size=6.5,
        ))
        story.append(Spacer(1, 2 * mm))
        detail_rows = [
            [p("제약조건", styles["small"]), p("<br/>".join(info["constraints"]), styles["small"])],
            [p("인덱스", styles["small"]), p("<br/>".join(info["indexes"]), styles["small"])],
            [p("시퀀스", styles["small"]), p(info["sequence"], styles["small"])],
            [p("트리거", styles["small"]), p(info["trigger"], styles["small"])],
            [p("근거 파일", styles["small"]), p(info["source"], styles["small"])],
        ]
        story.append(styled_table(detail_rows, [28 * mm, 130 * mm], font_size=7, header=False, repeat_rows=0))
        story.append(Spacer(1, 5 * mm))

    story.append(PageBreak())
    story.append(heading("3. MyBatis 매퍼 매핑 정보", styles["h1"], 0))
    by_mapper = defaultdict(list)
    for row in mapper_rows:
        by_mapper[row["mapper"]].append(row)
    for mapper_name in sorted(by_mapper):
        rows = by_mapper[mapper_name]
        interface_path = f"src/main/java/com/genai/mapper/{mapper_name}.java"
        xml_path = f"src/main/resources/mapper/{rows[0]['xml']}"
        story.append(heading(f"3.{len([x for x in sorted(by_mapper) if x <= mapper_name])} {mapper_name}", styles["h2"], 1))
        story.append(p(
            f"<b>담당:</b> {MAPPER_PURPOSE.get(mapper_name, '-')}<br/>"
            f"<b>XML:</b> {xml_path}<br/><b>인터페이스:</b> {interface_path}",
            styles["body"],
        ))
        op_counts = defaultdict(int)
        table_set = set()
        for row in rows:
            op_counts[row["op"]] += 1
            table_set.update(row["tables"])
        story.append(p(
            f"담당 테이블: {', '.join(sorted(table_set))}<br/>"
            f"SQL 작업: " + ", ".join(f"{k} {v}개" for k, v in sorted(op_counts.items())),
            styles["note"],
        ))
        data = [[
            p("쿼리 ID", styles["small"]), p("작업", styles["small"]),
            p("대상 테이블", styles["small"]), p("용도", styles["small"]),
        ]]
        for row in rows:
            data.append([
                p(row["id"], styles["small"]), p(row["op"], styles["small"]),
                p(", ".join(row["tables"]) or "-", styles["small"]),
                p(row["summary"], styles["small"]),
            ])
        story.append(styled_table(data, [49 * mm, 17 * mm, 42 * mm, 50 * mm], font_size=6.8))
        story.append(Spacer(1, 5 * mm))

    story.append(PageBreak())
    story.append(heading("4. 테이블 관계도(ERD)", styles["h1"], 0))
    story.append(p("아래 Mermaid 정의는 FK 관계 전체를 표현한다. NULL 허용 FK도 관계선에 포함했다.", styles["body"]))
    mermaid = ["erDiagram"]
    for child, parent, fk in RELATIONSHIPS:
        mermaid.append(f"    {parent} ||--o{{ {child} : \"{fk}\"")
    story.append(p("<br/>".join(mermaid), styles["code"]))
    story.append(Spacer(1, 5 * mm))
    relationship_rows = [[p("참조 테이블", styles["small"]), p("FK 컬럼", styles["small"]), p("부모 테이블", styles["small"])]]
    for child, parent, fk in RELATIONSHIPS:
        relationship_rows.append([p(child, styles["small"]), p(fk, styles["small"]), p(parent, styles["small"])])
    story.append(styled_table(relationship_rows, [61 * mm, 45 * mm, 52 * mm], font_size=7.2))

    story.append(PageBreak())
    story.append(heading("5. Java VO/DTO/Model ↔ DB 매핑", styles["h1"], 0))
    for idx, (table_name, class_names) in enumerate(TABLE_CLASS_MAP.items(), start=1):
        story.append(heading(f"5.{idx} {table_name}", styles["h2"], 1))
        story.append(p(f"대응 클래스: {', '.join(class_names)}", styles["body"]))
        rows = [[p("Java 클래스", styles["small"]), p("필드", styles["small"]), p("DB 컬럼/성격", styles["small"])]]
        for class_name in class_names:
            base_name = class_name.split(" ", 1)[0]
            fields = java_fields.get(base_name, [])
            if not fields:
                rows.append([p(class_name, styles["small"]), p("-", styles["small"]), p("직접 대응 클래스 없음", styles["small"])])
                continue
            table_columns = {c["name"] for c in TABLES[table_name]["columns"]}
            for field_type, field_name in fields:
                column_name = camel_to_snake(field_name)
                mapping = column_name if column_name in table_columns else "조회 조인/계산 필드"
                rows.append([
                    p(class_name, styles["small"]),
                    p(f"{field_name}: {field_type}", styles["small"]),
                    p(mapping, styles["small"]),
                ])
        story.append(styled_table(rows, [39 * mm, 58 * mm, 61 * mm], font_size=7))
        story.append(Spacer(1, 4 * mm))

    story.append(PageBreak())
    story.append(heading("6. 신규 또는 변경된 테이블", styles["h1"], 0))
    changes = [
        ["대상", "구분", "근거/변경 내용"],
        ["PET_INTERACTION_COOLDOWN", "신규", "2026-06-12 추가. 펫 상호작용별 30분 보상 쿨타임 저장."],
        ["FRAME", "변경", "2026-06-12~13 액자 타입·이미지·필요 배지 수 시드 조정."],
        ["PET / CHILD_PET", "변경", "펫 카탈로그 6종 정비, 만렙·배지·다음 펫 해금 흐름 추가."],
        ["MISSION", "변경", "MEDIA_TYPE 추가 및 실DB에 UPDATED_AT 존재. 등급 제약은 소스와 실DB 차이 확인."],
        ["NOTIFICATION", "변경", "미션 배정/인증 요청/승인/거절/보상 알림 유형 확장."],
        ["AUTH_LOGIN_TOKEN", "신규", "2026-06-09 로그인 유지 토큰 테이블 추가."],
        ["CHILD_DAILY_MISSION_PROGRESS", "실DB 전용", "실DB에는 존재하지만 저장소 DDL·MyBatis·Java 모델에는 정의 없음."],
    ]
    story.append(styled_table([[p(x, styles["small"]) for x in row] for row in changes],
                              [48 * mm, 25 * mm, 85 * mm], font_size=7.3))
    story.append(Spacer(1, 5 * mm))
    story.append(p(
        "<b>권고:</b> 실DB 전용 CHILD_DAILY_MISSION_PROGRESS의 DDL/Mapper/Model을 저장소에 추가하거나, "
        "사용하지 않는 객체라면 제거 여부를 결정해야 한다. 또한 MISSION.UPDATED_AT과 MISSION_GRADE 제약을 "
        "소스 DDL과 실DB 중 어느 쪽을 정본으로 할지 통일하는 것이 좋다.",
        styles["note"],
    ))

    story.append(heading("7. 분석 근거와 한계", styles["h1"], 0))
    add_bullets(story, [
        "스캔 경로: database/*.sql, src/main/resources/mapper/*.xml, mapper 인터페이스, model/DAO 클래스, mybatis-config.xml",
        "소스 DDL은 멱등 실행을 위한 PL/SQL 블록과 후속 ALTER/MERGE 패치를 포함하므로 최종 상태로 합산했다.",
        "실DB 메타데이터는 USER_TABLES, USER_TAB_COLUMNS, USER_CONSTRAINTS, USER_INDEXES, USER_SEQUENCES, USER_TRIGGERS로 확인했다.",
        "CHECK 조건의 상세 표현은 소스 DDL을 우선 사용했고, 실DB 전용 객체는 DBMS_METADATA 결과를 사용했다.",
        "시드 데이터의 일부 한글 문자열은 원본 SQL 파일 인코딩이 깨져 있어 구조 분석에서 제외했다.",
    ], styles)

    doc.multiBuild(story)
    return {
        "output": OUTPUT,
        "tables": len(TABLES),
        "mappers": len(by_mapper),
        "queries": len(mapper_rows),
        "models": len(java_fields),
    }


if __name__ == "__main__":
    result = build_pdf()
    print(
        f"Generated {result['output']} "
        f"(tables={result['tables']}, mappers={result['mappers']}, "
        f"queries={result['queries']}, models={result['models']})"
    )
