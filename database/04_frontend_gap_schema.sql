-- Adds backend fields and notification types required by the deployed frontend flow.
BEGIN
    EXECUTE IMMEDIATE '
        ALTER TABLE MISSION
        ADD media_type VARCHAR2(10) DEFAULT ''video'' NOT NULL';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -1430 THEN RAISE; END IF;
END;
/

BEGIN
    EXECUTE IMMEDIATE '
        ALTER TABLE MISSION
        ADD CONSTRAINT ck_mission_media CHECK (media_type IN (''photo'', ''video''))';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE NOT IN (-2264, -2275) THEN RAISE; END IF;
END;
/

BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE NOTIFICATION DROP CONSTRAINT ck_notification_type';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -2443 THEN RAISE; END IF;
END;
/

ALTER TABLE NOTIFICATION ADD CONSTRAINT ck_notification_type
    CHECK (notification_type IN (
        'mission_assigned',
        'reward_request',
        'mission_approved',
        'mission_rejected',
        'reward_paid',
        'reminder'
    ));

MERGE INTO REWARD_BOX target
USING (
    SELECT 'low' box_grade, 'low box' box_name, 10 min_exp, 30 max_exp FROM dual
    UNION ALL
    SELECT 'middle', 'middle box', 30, 70 FROM dual
    UNION ALL
    SELECT 'high', 'high box', 70, 150 FROM dual
) source
ON (target.box_grade = source.box_grade)
WHEN MATCHED THEN UPDATE SET
    target.box_name = source.box_name,
    target.min_exp = source.min_exp,
    target.max_exp = source.max_exp
WHEN NOT MATCHED THEN INSERT (box_grade, box_name, min_exp, max_exp, pet_drop_rate)
VALUES (source.box_grade, source.box_name, source.min_exp, source.max_exp, 1);

COMMIT;
