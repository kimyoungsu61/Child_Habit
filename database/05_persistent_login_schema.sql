-- Oracle XE 11g: persistent parent/child login tokens
BEGIN
    EXECUTE IMMEDIATE '
        CREATE TABLE AUTH_LOGIN_TOKEN (
            token_id NUMBER NOT NULL,
            token_hash VARCHAR2(64) NOT NULL,
            subject_type VARCHAR2(10) NOT NULL,
            parent_id NUMBER,
            child_id NUMBER,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
            last_used_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
            CONSTRAINT pk_auth_login_token PRIMARY KEY (token_id),
            CONSTRAINT uq_auth_login_token_hash UNIQUE (token_hash),
            CONSTRAINT fk_auth_token_parent
                FOREIGN KEY (parent_id) REFERENCES PARENT(parent_id),
            CONSTRAINT fk_auth_token_child
                FOREIGN KEY (child_id) REFERENCES CHILD(child_id),
            CONSTRAINT ck_auth_token_type
                CHECK (subject_type IN (''parent'', ''child'')),
            CONSTRAINT ck_auth_token_subject CHECK (
                (subject_type = ''parent'' AND parent_id IS NOT NULL AND child_id IS NULL)
                OR
                (subject_type = ''child'' AND child_id IS NOT NULL AND parent_id IS NULL)
            )
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
        CREATE SEQUENCE seq_auth_login_token
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
        CREATE INDEX idx_auth_token_parent
        ON AUTH_LOGIN_TOKEN(parent_id)';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -955 THEN
            RAISE;
        END IF;
END;
/

BEGIN
    EXECUTE IMMEDIATE '
        CREATE INDEX idx_auth_token_child
        ON AUTH_LOGIN_TOKEN(child_id)';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -955 THEN
            RAISE;
        END IF;
END;
/

BEGIN
    EXECUTE IMMEDIATE '
        CREATE INDEX idx_auth_token_expiry
        ON AUTH_LOGIN_TOKEN(expires_at)';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -955 THEN
            RAISE;
        END IF;
END;
/

