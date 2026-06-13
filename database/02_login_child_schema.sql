-- Oracle XE 11g: parent/child login schema
BEGIN
    EXECUTE IMMEDIATE '
        CREATE TABLE CHILD_INVITE (
            invite_id NUMBER NOT NULL,
            parent_id NUMBER NOT NULL,
            invite_code VARCHAR2(30) NOT NULL,
            qr_url VARCHAR2(500),
            created_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
            regenerated_at TIMESTAMP,
            CONSTRAINT pk_child_invite PRIMARY KEY (invite_id),
            CONSTRAINT uq_child_invite_code UNIQUE (invite_code),
            CONSTRAINT fk_child_invite_parent
                FOREIGN KEY (parent_id) REFERENCES PARENT(parent_id)
        )';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -955 THEN
            RAISE;
        END IF;
END;
/

BEGIN
    EXECUTE IMMEDIATE '
        CREATE TABLE FRAME (
            frame_id NUMBER NOT NULL,
            frame_type VARCHAR2(20) NOT NULL,
            frame_name VARCHAR2(50) NOT NULL,
            frame_image_url VARCHAR2(500) NOT NULL,
            required_badge_count NUMBER DEFAULT 0 NOT NULL,
            created_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
            CONSTRAINT pk_frame PRIMARY KEY (frame_id),
            CONSTRAINT uq_frame_type UNIQUE (frame_type),
            CONSTRAINT ck_frame_type CHECK (frame_type IN (''wood'', ''bronze'', ''iron'', ''gold'', ''crystal'', ''legend'', ''Aurora'')),
            CONSTRAINT ck_frame_badge CHECK (required_badge_count >= 0)
        )';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -955 THEN
            RAISE;
        END IF;
END;
/

BEGIN
    EXECUTE IMMEDIATE '
        CREATE TABLE CHILD (
            child_id NUMBER NOT NULL,
            parent_id NUMBER NOT NULL,
            invite_id NUMBER NOT NULL,
            frame_id NUMBER NOT NULL,
            nickname VARCHAR2(50) NOT NULL,
            character_image_url VARCHAR2(500),
            character_level NUMBER DEFAULT 1 NOT NULL,
            created_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
            CONSTRAINT pk_child PRIMARY KEY (child_id),
            CONSTRAINT uq_child_invite UNIQUE (invite_id),
            CONSTRAINT fk_child_parent FOREIGN KEY (parent_id) REFERENCES PARENT(parent_id),
            CONSTRAINT fk_child_invite FOREIGN KEY (invite_id) REFERENCES CHILD_INVITE(invite_id),
            CONSTRAINT fk_child_frame FOREIGN KEY (frame_id) REFERENCES FRAME(frame_id),
            CONSTRAINT ck_child_level CHECK (character_level >= 1)
        )';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -955 THEN
            RAISE;
        END IF;
END;
/

BEGIN
    EXECUTE IMMEDIATE '
        CREATE SEQUENCE seq_child_invite
        START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -955 THEN
            RAISE;
        END IF;
END;
/

BEGIN
    EXECUTE IMMEDIATE '
        CREATE SEQUENCE seq_frame
        START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -955 THEN
            RAISE;
        END IF;
END;
/

BEGIN
    EXECUTE IMMEDIATE '
        CREATE SEQUENCE seq_child
        START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -955 THEN
            RAISE;
        END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_child_invite_id
BEFORE INSERT ON CHILD_INVITE
FOR EACH ROW
BEGIN
    IF :NEW.invite_id IS NULL THEN
        SELECT seq_child_invite.NEXTVAL INTO :NEW.invite_id FROM dual;
    END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_frame_id
BEFORE INSERT ON FRAME
FOR EACH ROW
BEGIN
    IF :NEW.frame_id IS NULL THEN
        SELECT seq_frame.NEXTVAL INTO :NEW.frame_id FROM dual;
    END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_child_id
BEFORE INSERT ON CHILD
FOR EACH ROW
BEGIN
    IF :NEW.child_id IS NULL THEN
        SELECT seq_child.NEXTVAL INTO :NEW.child_id FROM dual;
    END IF;
END;
/

MERGE INTO FRAME target
USING (
    SELECT 'bronze' frame_type, '동 액자' frame_name,
           '/assets/frames/frame-bronze.webp' frame_image_url, 0 required_badge_count
    FROM dual
) source
ON (target.frame_type = source.frame_type)
WHEN NOT MATCHED THEN
    INSERT (frame_type, frame_name, frame_image_url, required_badge_count)
    VALUES (source.frame_type, source.frame_name, source.frame_image_url, source.required_badge_count);

MERGE INTO FRAME target
USING (
    SELECT 'iron' frame_type, '은 액자' frame_name,
           '/assets/frames/frame-silver.webp' frame_image_url, 1 required_badge_count
    FROM dual
) source
ON (target.frame_type = source.frame_type)
WHEN NOT MATCHED THEN
    INSERT (frame_type, frame_name, frame_image_url, required_badge_count)
    VALUES (source.frame_type, source.frame_name, source.frame_image_url, source.required_badge_count);

MERGE INTO FRAME target
USING (
    SELECT 'gold' frame_type, '금 액자' frame_name,
           '/assets/frames/frame-gold.webp' frame_image_url, 2 required_badge_count
    FROM dual
) source
ON (target.frame_type = source.frame_type)
WHEN NOT MATCHED THEN
    INSERT (frame_type, frame_name, frame_image_url, required_badge_count)
    VALUES (source.frame_type, source.frame_name, source.frame_image_url, source.required_badge_count);

MERGE INTO FRAME target
USING (
    SELECT 'crystal' frame_type, '수정 액자' frame_name,
           '/assets/frames/frame-tier-4.webp' frame_image_url, 3 required_badge_count
    FROM dual
) source
ON (target.frame_type = source.frame_type)
WHEN NOT MATCHED THEN
    INSERT (frame_type, frame_name, frame_image_url, required_badge_count)
    VALUES (source.frame_type, source.frame_name, source.frame_image_url, source.required_badge_count);

MERGE INTO FRAME target
USING (
    SELECT 'legend' frame_type, '전설 액자' frame_name,
           '/assets/frames/frame-tier-5.webp' frame_image_url, 4 required_badge_count
    FROM dual
) source
ON (target.frame_type = source.frame_type)
WHEN NOT MATCHED THEN
    INSERT (frame_type, frame_name, frame_image_url, required_badge_count)
    VALUES (source.frame_type, source.frame_name, source.frame_image_url, source.required_badge_count);

MERGE INTO FRAME target
USING (
    SELECT 'Aurora' frame_type, '오로라 액자' frame_name,
           '/assets/frames/frame-tier-6.webp' frame_image_url, 5 required_badge_count
    FROM dual
) source
ON (target.frame_type = source.frame_type)
WHEN NOT MATCHED THEN
    INSERT (frame_type, frame_name, frame_image_url, required_badge_count)
    VALUES (source.frame_type, source.frame_name, source.frame_image_url, source.required_badge_count);

COMMIT;
