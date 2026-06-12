-- Existing DB patch: keep the original bronze/iron/gold rows and add the DB-backed tier frames.

BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE FRAME DROP CONSTRAINT ck_frame_type';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -2443 THEN
            RAISE;
        END IF;
END;
/

BEGIN
    EXECUTE IMMEDIATE '
        ALTER TABLE FRAME ADD CONSTRAINT ck_frame_type
        CHECK (frame_type IN (''wood'', ''bronze'', ''iron'', ''gold'', ''crystal'', ''legend'', ''Aurora''))';
END;
/

MERGE INTO FRAME target
USING (
    SELECT 1 frame_id, 'bronze' frame_type, '동 액자' frame_name,
           '/assets/frames/frame-bronze.webp' frame_image_url, 0 required_badge_count
    FROM dual
) source
ON (target.frame_id = source.frame_id)
WHEN MATCHED THEN
    UPDATE SET frame_type = source.frame_type,
               frame_name = source.frame_name,
               frame_image_url = source.frame_image_url,
               required_badge_count = source.required_badge_count
WHEN NOT MATCHED THEN
    INSERT (frame_id, frame_type, frame_name, frame_image_url, required_badge_count)
    VALUES (source.frame_id, source.frame_type, source.frame_name, source.frame_image_url, source.required_badge_count);

MERGE INTO FRAME target
USING (
    SELECT 2 frame_id, 'iron' frame_type, '은 액자' frame_name,
           '/assets/frames/frame-silver.webp' frame_image_url, 1 required_badge_count
    FROM dual
) source
ON (target.frame_id = source.frame_id)
WHEN MATCHED THEN
    UPDATE SET frame_type = source.frame_type,
               frame_name = source.frame_name,
               frame_image_url = source.frame_image_url,
               required_badge_count = source.required_badge_count
WHEN NOT MATCHED THEN
    INSERT (frame_id, frame_type, frame_name, frame_image_url, required_badge_count)
    VALUES (source.frame_id, source.frame_type, source.frame_name, source.frame_image_url, source.required_badge_count);

MERGE INTO FRAME target
USING (
    SELECT 3 frame_id, 'gold' frame_type, '금 액자' frame_name,
           '/assets/frames/frame-gold.webp' frame_image_url, 2 required_badge_count
    FROM dual
) source
ON (target.frame_id = source.frame_id)
WHEN MATCHED THEN
    UPDATE SET frame_type = source.frame_type,
               frame_name = source.frame_name,
               frame_image_url = source.frame_image_url,
               required_badge_count = source.required_badge_count
WHEN NOT MATCHED THEN
    INSERT (frame_id, frame_type, frame_name, frame_image_url, required_badge_count)
    VALUES (source.frame_id, source.frame_type, source.frame_name, source.frame_image_url, source.required_badge_count);

MERGE INTO FRAME target
USING (
    SELECT 4 frame_id, 'crystal' frame_type, '수정 액자' frame_name,
           '/assets/frames/frame-tier-4.webp' frame_image_url, 3 required_badge_count
    FROM dual
) source
ON (target.frame_id = source.frame_id)
WHEN MATCHED THEN
    UPDATE SET frame_type = source.frame_type,
               frame_name = source.frame_name,
               frame_image_url = source.frame_image_url,
               required_badge_count = source.required_badge_count
WHEN NOT MATCHED THEN
    INSERT (frame_id, frame_type, frame_name, frame_image_url, required_badge_count)
    VALUES (source.frame_id, source.frame_type, source.frame_name, source.frame_image_url, source.required_badge_count);

MERGE INTO FRAME target
USING (
    SELECT 5 frame_id, 'legend' frame_type, '전설 액자' frame_name,
           '/assets/frames/frame-tier-5.webp' frame_image_url, 4 required_badge_count
    FROM dual
) source
ON (target.frame_id = source.frame_id)
WHEN MATCHED THEN
    UPDATE SET frame_type = source.frame_type,
               frame_name = source.frame_name,
               frame_image_url = source.frame_image_url,
               required_badge_count = source.required_badge_count
WHEN NOT MATCHED THEN
    INSERT (frame_id, frame_type, frame_name, frame_image_url, required_badge_count)
    VALUES (source.frame_id, source.frame_type, source.frame_name, source.frame_image_url, source.required_badge_count);

MERGE INTO FRAME target
USING (
    SELECT 6 frame_id, 'Aurora' frame_type, '오로라 액자' frame_name,
           '/assets/frames/frame-tier-6.webp' frame_image_url, 5 required_badge_count
    FROM dual
) source
ON (target.frame_id = source.frame_id)
WHEN MATCHED THEN
    UPDATE SET frame_type = source.frame_type,
               frame_name = source.frame_name,
               frame_image_url = source.frame_image_url,
               required_badge_count = source.required_badge_count
WHEN NOT MATCHED THEN
    INSERT (frame_id, frame_type, frame_name, frame_image_url, required_badge_count)
    VALUES (source.frame_id, source.frame_type, source.frame_name, source.frame_image_url, source.required_badge_count);

COMMIT;
