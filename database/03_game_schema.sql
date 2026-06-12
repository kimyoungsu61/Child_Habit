-- Oracle XE 11g: pet, submission, reward, and notification schema
BEGIN
    EXECUTE IMMEDIATE '
        CREATE TABLE REWARD_BOX (
            box_grade VARCHAR2(20) NOT NULL,
            box_name VARCHAR2(50) NOT NULL,
            min_exp NUMBER NOT NULL,
            max_exp NUMBER NOT NULL,
            pet_drop_rate NUMBER(5,2) DEFAULT 1.00 NOT NULL,
            created_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
            CONSTRAINT pk_reward_box PRIMARY KEY (box_grade),
            CONSTRAINT ck_reward_box_grade CHECK (box_grade IN (''low'', ''middle'', ''high'')),
            CONSTRAINT ck_reward_box_exp CHECK (min_exp >= 0 AND max_exp >= min_exp),
            CONSTRAINT ck_reward_box_rate CHECK (pet_drop_rate >= 0 AND pet_drop_rate <= 100)
        )';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -955 THEN RAISE; END IF;
END;
/

BEGIN
    EXECUTE IMMEDIATE '
        CREATE TABLE PET (
            pet_id NUMBER NOT NULL,
            pet_name VARCHAR2(50) NOT NULL,
            pet_image_url VARCHAR2(500) NOT NULL,
            acquisition_type VARCHAR2(30) NOT NULL,
            max_level NUMBER NOT NULL,
            badge_name VARCHAR2(50) NOT NULL,
            badge_image_url VARCHAR2(500) NOT NULL,
            description VARCHAR2(1000),
            CONSTRAINT pk_pet PRIMARY KEY (pet_id),
            CONSTRAINT ck_pet_acq_type
                CHECK (acquisition_type IN (''default'', ''random_box'', ''character_level'')),
            CONSTRAINT ck_pet_max_level CHECK (max_level > 0)
        )';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -955 THEN RAISE; END IF;
END;
/

BEGIN
    EXECUTE IMMEDIATE '
        CREATE TABLE CHILD_PET (
            child_pet_id NUMBER NOT NULL,
            child_id NUMBER NOT NULL,
            pet_id NUMBER NOT NULL,
            current_level NUMBER DEFAULT 1 NOT NULL,
            current_exp NUMBER DEFAULT 0 NOT NULL,
            is_active CHAR(1) DEFAULT ''N'' NOT NULL,
            is_maxed CHAR(1) DEFAULT ''N'' NOT NULL,
            badge_acquired CHAR(1) DEFAULT ''N'' NOT NULL,
            badge_acquired_at TIMESTAMP,
            acquired_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
            CONSTRAINT pk_child_pet PRIMARY KEY (child_pet_id),
            CONSTRAINT uq_child_pet UNIQUE (child_id, pet_id),
            CONSTRAINT fk_child_pet_child FOREIGN KEY (child_id) REFERENCES CHILD(child_id),
            CONSTRAINT fk_child_pet_pet FOREIGN KEY (pet_id) REFERENCES PET(pet_id),
            CONSTRAINT ck_child_pet_level CHECK (current_level >= 1),
            CONSTRAINT ck_child_pet_exp CHECK (current_exp >= 0),
            CONSTRAINT ck_child_pet_active CHECK (is_active IN (''Y'', ''N'')),
            CONSTRAINT ck_child_pet_maxed CHECK (is_maxed IN (''Y'', ''N'')),
            CONSTRAINT ck_child_pet_badge CHECK (badge_acquired IN (''Y'', ''N''))
        )';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -955 THEN RAISE; END IF;
END;
/

BEGIN
    EXECUTE IMMEDIATE '
        CREATE TABLE MISSION (
            mission_id NUMBER NOT NULL,
            parent_id NUMBER NOT NULL,
            child_id NUMBER NOT NULL,
            mission_title VARCHAR2(100) NOT NULL,
            mission_description VARCHAR2(1000),
            mission_grade VARCHAR2(20) NOT NULL,
            media_type VARCHAR2(10) DEFAULT ''video'' NOT NULL,
            is_active CHAR(1) DEFAULT ''Y'' NOT NULL,
            created_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
            CONSTRAINT pk_mission PRIMARY KEY (mission_id),
            CONSTRAINT fk_mission_parent FOREIGN KEY (parent_id) REFERENCES PARENT(parent_id),
            CONSTRAINT fk_mission_child FOREIGN KEY (child_id) REFERENCES CHILD(child_id),
            CONSTRAINT fk_mission_box FOREIGN KEY (mission_grade) REFERENCES REWARD_BOX(box_grade),
            CONSTRAINT ck_mission_media CHECK (media_type IN (''photo'', ''video'')),
            CONSTRAINT ck_mission_active CHECK (is_active IN (''Y'', ''N''))
        )';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -955 THEN RAISE; END IF;
END;
/

BEGIN
    EXECUTE IMMEDIATE '
        CREATE TABLE MISSION_SUBMISSION (
            submission_id NUMBER NOT NULL,
            mission_id NUMBER NOT NULL,
            child_id NUMBER NOT NULL,
            mission_date DATE NOT NULL,
            box_grade VARCHAR2(20),
            media_type VARCHAR2(10) NOT NULL,
            media_url VARCHAR2(500) NOT NULL,
            status VARCHAR2(20) DEFAULT ''pending'' NOT NULL,
            submitted_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
            reviewed_at TIMESTAMP,
            reward_given CHAR(1) DEFAULT ''N'' NOT NULL,
            media_deleted_at TIMESTAMP,
            CONSTRAINT pk_mission_submission PRIMARY KEY (submission_id),
            CONSTRAINT fk_submission_mission FOREIGN KEY (mission_id) REFERENCES MISSION(mission_id),
            CONSTRAINT fk_submission_child FOREIGN KEY (child_id) REFERENCES CHILD(child_id),
            CONSTRAINT fk_submission_box FOREIGN KEY (box_grade) REFERENCES REWARD_BOX(box_grade),
            CONSTRAINT ck_submission_media CHECK (media_type IN (''photo'', ''video'')),
            CONSTRAINT ck_submission_status
                CHECK (status IN (''pending'', ''approved'', ''rejected'')),
            CONSTRAINT ck_submission_reward CHECK (reward_given IN (''Y'', ''N''))
        )';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -955 THEN RAISE; END IF;
END;
/

BEGIN
    EXECUTE IMMEDIATE '
        CREATE TABLE REWARD_HISTORY (
            reward_id NUMBER NOT NULL,
            child_id NUMBER NOT NULL,
            submission_id NUMBER,
            box_grade VARCHAR2(20),
            child_pet_id NUMBER,
            pet_id NUMBER,
            frame_id NUMBER,
            reward_type VARCHAR2(20) NOT NULL,
            reward_source VARCHAR2(30) NOT NULL,
            exp_amount NUMBER,
            created_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
            CONSTRAINT pk_reward_history PRIMARY KEY (reward_id),
            CONSTRAINT fk_reward_child FOREIGN KEY (child_id) REFERENCES CHILD(child_id),
            CONSTRAINT fk_reward_submission
                FOREIGN KEY (submission_id) REFERENCES MISSION_SUBMISSION(submission_id),
            CONSTRAINT fk_reward_box FOREIGN KEY (box_grade) REFERENCES REWARD_BOX(box_grade),
            CONSTRAINT fk_reward_child_pet
                FOREIGN KEY (child_pet_id) REFERENCES CHILD_PET(child_pet_id),
            CONSTRAINT fk_reward_pet FOREIGN KEY (pet_id) REFERENCES PET(pet_id),
            CONSTRAINT fk_reward_frame FOREIGN KEY (frame_id) REFERENCES FRAME(frame_id),
            CONSTRAINT ck_reward_type CHECK (reward_type IN (''exp'', ''pet'', ''badge'', ''frame'')),
            CONSTRAINT ck_reward_source
                CHECK (reward_source IN (''box'', ''interaction'', ''pet_level'', ''badge_count'')),
            CONSTRAINT ck_reward_exp CHECK (exp_amount IS NULL OR exp_amount >= 0)
        )';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -955 THEN RAISE; END IF;
END;
/

BEGIN
    EXECUTE IMMEDIATE '
        CREATE TABLE NOTIFICATION (
            notification_id NUMBER NOT NULL,
            parent_id NUMBER,
            child_id NUMBER,
            mission_id NUMBER,
            submission_id NUMBER,
            reward_id NUMBER,
            notification_type VARCHAR2(30) NOT NULL,
            title VARCHAR2(100) NOT NULL,
            content VARCHAR2(1000),
            is_read CHAR(1) DEFAULT ''N'' NOT NULL,
            created_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
            read_at TIMESTAMP,
            CONSTRAINT pk_notification PRIMARY KEY (notification_id),
            CONSTRAINT fk_notification_parent FOREIGN KEY (parent_id) REFERENCES PARENT(parent_id),
            CONSTRAINT fk_notification_child FOREIGN KEY (child_id) REFERENCES CHILD(child_id),
            CONSTRAINT fk_notification_mission FOREIGN KEY (mission_id) REFERENCES MISSION(mission_id),
            CONSTRAINT fk_notification_submission
                FOREIGN KEY (submission_id) REFERENCES MISSION_SUBMISSION(submission_id),
            CONSTRAINT fk_notification_reward
                FOREIGN KEY (reward_id) REFERENCES REWARD_HISTORY(reward_id),
            CONSTRAINT ck_notification_type
                CHECK (notification_type IN (
                    ''mission_assigned'', ''reward_request'', ''mission_approved'',
                    ''mission_rejected'', ''reward_paid'', ''reminder''
                )),
            CONSTRAINT ck_notification_read CHECK (is_read IN (''Y'', ''N'')),
            CONSTRAINT ck_notification_receiver CHECK (
                (parent_id IS NOT NULL AND child_id IS NULL) OR
                (parent_id IS NULL AND child_id IS NOT NULL)
            )
        )';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -955 THEN RAISE; END IF;
END;
/

BEGIN EXECUTE IMMEDIATE 'CREATE SEQUENCE seq_pet START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF; END;
/
BEGIN EXECUTE IMMEDIATE 'CREATE SEQUENCE seq_child_pet START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF; END;
/
BEGIN EXECUTE IMMEDIATE 'CREATE SEQUENCE seq_mission START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF; END;
/
BEGIN EXECUTE IMMEDIATE 'CREATE SEQUENCE seq_mission_submission START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF; END;
/
BEGIN EXECUTE IMMEDIATE 'CREATE SEQUENCE seq_reward_history START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF; END;
/
BEGIN EXECUTE IMMEDIATE 'CREATE SEQUENCE seq_notification START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF; END;
/

CREATE OR REPLACE TRIGGER trg_pet_id
BEFORE INSERT ON PET FOR EACH ROW
BEGIN
    IF :NEW.pet_id IS NULL THEN SELECT seq_pet.NEXTVAL INTO :NEW.pet_id FROM dual; END IF;
END;
/
CREATE OR REPLACE TRIGGER trg_child_pet_id
BEFORE INSERT ON CHILD_PET FOR EACH ROW
BEGIN
    IF :NEW.child_pet_id IS NULL THEN
        SELECT seq_child_pet.NEXTVAL INTO :NEW.child_pet_id FROM dual;
    END IF;
END;
/
CREATE OR REPLACE TRIGGER trg_mission_id
BEFORE INSERT ON MISSION FOR EACH ROW
BEGIN
    IF :NEW.mission_id IS NULL THEN SELECT seq_mission.NEXTVAL INTO :NEW.mission_id FROM dual; END IF;
END;
/
CREATE OR REPLACE TRIGGER trg_submission_id
BEFORE INSERT ON MISSION_SUBMISSION FOR EACH ROW
BEGIN
    IF :NEW.submission_id IS NULL THEN
        SELECT seq_mission_submission.NEXTVAL INTO :NEW.submission_id FROM dual;
    END IF;
END;
/
CREATE OR REPLACE TRIGGER trg_reward_history_id
BEFORE INSERT ON REWARD_HISTORY FOR EACH ROW
BEGIN
    IF :NEW.reward_id IS NULL THEN
        SELECT seq_reward_history.NEXTVAL INTO :NEW.reward_id FROM dual;
    END IF;
END;
/
CREATE OR REPLACE TRIGGER trg_notification_id
BEFORE INSERT ON NOTIFICATION FOR EACH ROW
BEGIN
    IF :NEW.notification_id IS NULL THEN
        SELECT seq_notification.NEXTVAL INTO :NEW.notification_id FROM dual;
    END IF;
END;
/

BEGIN EXECUTE IMMEDIATE 'ALTER TABLE MISSION_SUBMISSION ADD mission_id NUMBER';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -1430 THEN RAISE; END IF; END;
/
BEGIN EXECUTE IMMEDIATE 'ALTER TABLE MISSION_SUBMISSION ADD mission_date DATE';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -1430 THEN RAISE; END IF; END;
/
BEGIN EXECUTE IMMEDIATE 'ALTER TABLE NOTIFICATION ADD mission_id NUMBER';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -1430 THEN RAISE; END IF; END;
/
BEGIN EXECUTE IMMEDIATE 'ALTER TABLE MISSION_SUBMISSION ADD CONSTRAINT fk_submission_mission FOREIGN KEY (mission_id) REFERENCES MISSION(mission_id)';
EXCEPTION WHEN OTHERS THEN IF SQLCODE NOT IN (-2264, -2275) THEN RAISE; END IF; END;
/
BEGIN EXECUTE IMMEDIATE 'ALTER TABLE NOTIFICATION ADD CONSTRAINT fk_notification_mission FOREIGN KEY (mission_id) REFERENCES MISSION(mission_id)';
EXCEPTION WHEN OTHERS THEN IF SQLCODE NOT IN (-2264, -2275) THEN RAISE; END IF; END;
/

MERGE INTO REWARD_BOX target
USING (SELECT 'low' box_grade, 'low box' box_name, 10 min_exp, 30 max_exp, 1 pet_drop_rate FROM dual) source
ON (target.box_grade = source.box_grade)
WHEN MATCHED THEN UPDATE SET
    target.box_name = source.box_name,
    target.min_exp = source.min_exp,
    target.max_exp = source.max_exp,
    target.pet_drop_rate = source.pet_drop_rate
WHEN NOT MATCHED THEN INSERT (box_grade, box_name, min_exp, max_exp, pet_drop_rate)
VALUES (source.box_grade, source.box_name, source.min_exp, source.max_exp, source.pet_drop_rate);

MERGE INTO REWARD_BOX target
USING (SELECT 'middle' box_grade, 'middle box' box_name, 30 min_exp, 70 max_exp, 1 pet_drop_rate FROM dual) source
ON (target.box_grade = source.box_grade)
WHEN MATCHED THEN UPDATE SET
    target.box_name = source.box_name,
    target.min_exp = source.min_exp,
    target.max_exp = source.max_exp,
    target.pet_drop_rate = source.pet_drop_rate
WHEN NOT MATCHED THEN INSERT (box_grade, box_name, min_exp, max_exp, pet_drop_rate)
VALUES (source.box_grade, source.box_name, source.min_exp, source.max_exp, source.pet_drop_rate);

MERGE INTO REWARD_BOX target
USING (SELECT 'high' box_grade, 'high box' box_name, 70 min_exp, 150 max_exp, 1 pet_drop_rate FROM dual) source
ON (target.box_grade = source.box_grade)
WHEN MATCHED THEN UPDATE SET
    target.box_name = source.box_name,
    target.min_exp = source.min_exp,
    target.max_exp = source.max_exp,
    target.pet_drop_rate = source.pet_drop_rate
WHEN NOT MATCHED THEN INSERT (box_grade, box_name, min_exp, max_exp, pet_drop_rate)
VALUES (source.box_grade, source.box_name, source.min_exp, source.max_exp, source.pet_drop_rate);

MERGE INTO PET target
USING (
    SELECT 'mongle' pet_name, '/assets/images/pets/pet_mongle.webp' pet_image_url, 'default' acquisition_type,
           10 max_level, '몽글 별빛 뱃지' badge_name, '/assets/images/badges/badge_mongle.webp' badge_image_url,
           '별빛을 모아 아이의 습관 성장을 응원하는 첫 번째 친구.' description
    FROM dual
) source
ON (target.pet_name = source.pet_name)
WHEN MATCHED THEN UPDATE SET
    target.pet_image_url = source.pet_image_url,
    target.acquisition_type = source.acquisition_type,
    target.max_level = source.max_level,
    target.badge_name = source.badge_name,
    target.badge_image_url = source.badge_image_url,
    target.description = source.description
WHEN NOT MATCHED THEN INSERT (
    pet_name, pet_image_url, acquisition_type, max_level, badge_name, badge_image_url, description
) VALUES (
    source.pet_name, source.pet_image_url, source.acquisition_type, source.max_level,
    source.badge_name, source.badge_image_url, source.description
);

MERGE INTO PET target
USING (
    SELECT 'roa' pet_name, '/assets/images/pets/pet_roa.webp' pet_image_url, 'random_box' acquisition_type,
           10 max_level, '로아 용기 뱃지' badge_name, '/assets/images/badges/badge_roa.webp' badge_image_url,
           '작은 불꽃으로 아이의 안전과 용기를 따뜻하게 밝혀주는 친구.' description
    FROM dual
) source
ON (target.pet_name = source.pet_name)
WHEN MATCHED THEN UPDATE SET
    target.pet_image_url = source.pet_image_url,
    target.acquisition_type = source.acquisition_type,
    target.max_level = source.max_level,
    target.badge_name = source.badge_name,
    target.badge_image_url = source.badge_image_url,
    target.description = source.description
WHEN NOT MATCHED THEN INSERT (
    pet_name, pet_image_url, acquisition_type, max_level, badge_name, badge_image_url, description
) VALUES (
    source.pet_name, source.pet_image_url, source.acquisition_type, source.max_level,
    source.badge_name, source.badge_image_url, source.description
);

MERGE INTO PET target
USING (
    SELECT 'haeon' pet_name, '/assets/images/pets/pet_haeon.webp' pet_image_url, 'random_box' acquisition_type,
           10 max_level, '해온 햇살 뱃지' badge_name, '/assets/images/badges/badge_haeon.webp' badge_image_url,
           '따뜻한 햇살처럼 매일의 도전을 응원하는 친구.' description
    FROM dual
) source
ON (target.pet_name = source.pet_name)
WHEN MATCHED THEN UPDATE SET
    target.pet_image_url = source.pet_image_url,
    target.acquisition_type = source.acquisition_type,
    target.max_level = source.max_level,
    target.badge_name = source.badge_name,
    target.badge_image_url = source.badge_image_url,
    target.description = source.description
WHEN NOT MATCHED THEN INSERT (
    pet_name, pet_image_url, acquisition_type, max_level, badge_name, badge_image_url, description
) VALUES (
    source.pet_name, source.pet_image_url, source.acquisition_type, source.max_level,
    source.badge_name, source.badge_image_url, source.description
);

MERGE INTO PET target
USING (
    SELECT 'nuri' pet_name, '/assets/images/pets/pet_nuri.webp' pet_image_url, 'random_box' acquisition_type,
           10 max_level, '누리 잎새 뱃지' badge_name, '/assets/images/badges/badge_nuri.webp' badge_image_url,
           '작은 새싹처럼 천천히 자라는 마음을 함께 돌보는 친구.' description
    FROM dual
) source
ON (target.pet_name = source.pet_name)
WHEN MATCHED THEN UPDATE SET
    target.pet_image_url = source.pet_image_url,
    target.acquisition_type = source.acquisition_type,
    target.max_level = source.max_level,
    target.badge_name = source.badge_name,
    target.badge_image_url = source.badge_image_url,
    target.description = source.description
WHEN NOT MATCHED THEN INSERT (
    pet_name, pet_image_url, acquisition_type, max_level, badge_name, badge_image_url, description
) VALUES (
    source.pet_name, source.pet_image_url, source.acquisition_type, source.max_level,
    source.badge_name, source.badge_image_url, source.description
);

MERGE INTO PET target
USING (
    SELECT 'aro' pet_name, '/assets/images/pets/pet_aro.webp' pet_image_url, 'random_box' acquisition_type,
           10 max_level, '아로 물결 뱃지' badge_name, '/assets/images/badges/badge_aro.webp' badge_image_url,
           '잔잔한 물결처럼 아이의 마음을 차분하게 감싸주는 친구.' description
    FROM dual
) source
ON (target.pet_name = source.pet_name)
WHEN MATCHED THEN UPDATE SET
    target.pet_image_url = source.pet_image_url,
    target.acquisition_type = source.acquisition_type,
    target.max_level = source.max_level,
    target.badge_name = source.badge_name,
    target.badge_image_url = source.badge_image_url,
    target.description = source.description
WHEN NOT MATCHED THEN INSERT (
    pet_name, pet_image_url, acquisition_type, max_level, badge_name, badge_image_url, description
) VALUES (
    source.pet_name, source.pet_image_url, source.acquisition_type, source.max_level,
    source.badge_name, source.badge_image_url, source.description
);

MERGE INTO PET target
USING (
    SELECT 'pogeun' pet_name, '/assets/images/pets/pet_pogeun.webp' pet_image_url, 'random_box' acquisition_type,
           10 max_level, '포근 하트 뱃지' badge_name, '/assets/images/badges/badge_pogeun.webp' badge_image_url,
           '포근한 마음으로 아이의 감정을 다정하게 안아주는 친구.' description
    FROM dual
) source
ON (target.pet_name = source.pet_name)
WHEN MATCHED THEN UPDATE SET
    target.pet_image_url = source.pet_image_url,
    target.acquisition_type = source.acquisition_type,
    target.max_level = source.max_level,
    target.badge_name = source.badge_name,
    target.badge_image_url = source.badge_image_url,
    target.description = source.description
WHEN NOT MATCHED THEN INSERT (
    pet_name, pet_image_url, acquisition_type, max_level, badge_name, badge_image_url, description
) VALUES (
    source.pet_name, source.pet_image_url, source.acquisition_type, source.max_level,
    source.badge_name, source.badge_image_url, source.description
);

UPDATE PET
SET acquisition_type = 'random_box'
WHERE pet_name IN ('tori', 'mongsil', 'kongi');

BEGIN EXECUTE IMMEDIATE 'CREATE INDEX idx_submission_child ON MISSION_SUBMISSION(child_id)';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF; END;
/
BEGIN EXECUTE IMMEDIATE 'CREATE INDEX idx_mission_child ON MISSION(child_id)';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF; END;
/
BEGIN EXECUTE IMMEDIATE 'CREATE INDEX idx_mission_parent ON MISSION(parent_id)';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF; END;
/
BEGIN EXECUTE IMMEDIATE 'CREATE INDEX idx_reward_child ON REWARD_HISTORY(child_id)';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF; END;
/
BEGIN EXECUTE IMMEDIATE 'CREATE INDEX idx_notification_parent ON NOTIFICATION(parent_id)';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF; END;
/
BEGIN EXECUTE IMMEDIATE 'CREATE INDEX idx_notification_child ON NOTIFICATION(child_id)';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF; END;
/

COMMIT;
