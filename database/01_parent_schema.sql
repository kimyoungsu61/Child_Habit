-- Oracle XE 11g: parent signup schema
BEGIN
    EXECUTE IMMEDIATE '
        CREATE TABLE PARENT (
            parent_id NUMBER NOT NULL,
            email VARCHAR2(100) NOT NULL,
            password_hash VARCHAR2(255) NOT NULL,
            name VARCHAR2(50) NOT NULL,
            created_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
            CONSTRAINT pk_parent PRIMARY KEY (parent_id),
            CONSTRAINT uq_parent_email UNIQUE (email)
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
        CREATE SEQUENCE seq_parent
        START WITH 1
        INCREMENT BY 1
        NOCACHE
        NOCYCLE';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -955 THEN
            RAISE;
        END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_parent_id
BEFORE INSERT ON PARENT
FOR EACH ROW
BEGIN
    IF :NEW.parent_id IS NULL THEN
        SELECT seq_parent.NEXTVAL INTO :NEW.parent_id FROM dual;
    END IF;
END;
/
