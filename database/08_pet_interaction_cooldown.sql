-- Stores independent 30-minute EXP cooldowns for each pet interaction.
BEGIN
    EXECUTE IMMEDIATE '
        CREATE TABLE PET_INTERACTION_COOLDOWN (
            child_pet_id NUMBER NOT NULL,
            action_type VARCHAR2(20) NOT NULL,
            last_rewarded_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
            CONSTRAINT pk_pet_interaction_cooldown
                PRIMARY KEY (child_pet_id, action_type),
            CONSTRAINT fk_pet_interaction_child_pet
                FOREIGN KEY (child_pet_id) REFERENCES CHILD_PET(child_pet_id),
            CONSTRAINT ck_pet_interaction_action
                CHECK (action_type IN (''touch'', ''praise'', ''play'', ''magic''))
        )';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -955 THEN RAISE; END IF;
END;
/

COMMIT;
