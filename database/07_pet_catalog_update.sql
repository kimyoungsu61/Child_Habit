-- Replaces the legacy starter pets and adds the six production pet records.
MERGE INTO PET target
USING (
    SELECT 1 pet_id, '몽글' pet_name,
           '/assets/images/pets/pet_mongle.webp' pet_image_url,
           10 max_level, '몽글 별빛 뱃지' badge_name,
           '/assets/images/badges/badge_mongle.webp' badge_image_url,
           'A magical pet that brings courage with the power of starlight.' description
    FROM dual
) source
ON (target.pet_id = source.pet_id)
WHEN MATCHED THEN UPDATE SET
    target.pet_name = source.pet_name,
    target.pet_image_url = source.pet_image_url,
    target.max_level = source.max_level,
    target.badge_name = source.badge_name,
    target.badge_image_url = source.badge_image_url,
    target.description = source.description
WHEN NOT MATCHED THEN INSERT (
    pet_id, pet_name, pet_image_url, acquisition_type, max_level,
    badge_name, badge_image_url, description
) VALUES (
    source.pet_id, source.pet_name, source.pet_image_url, 'default',
    source.max_level, source.badge_name, source.badge_image_url, source.description
);

MERGE INTO PET target
USING (
    SELECT 2 pet_id, 'Roa' pet_name,
           '/assets/images/pets/pet_roa.webp' pet_image_url,
           10 max_level, 'Courage Guardian Pet' badge_name,
           '/assets/images/badges/badge_roa.webp' badge_image_url,
           'A guardian pet that protects and strengthens your courage.' description
    FROM dual
) source
ON (target.pet_id = source.pet_id)
WHEN MATCHED THEN UPDATE SET
    target.pet_name = source.pet_name,
    target.pet_image_url = source.pet_image_url,
    target.max_level = source.max_level,
    target.badge_name = source.badge_name,
    target.badge_image_url = source.badge_image_url,
    target.description = source.description
WHEN NOT MATCHED THEN INSERT (
    pet_id, pet_name, pet_image_url, acquisition_type, max_level,
    badge_name, badge_image_url, description
) VALUES (
    source.pet_id, source.pet_name, source.pet_image_url, 'default',
    source.max_level, source.badge_name, source.badge_image_url, source.description
);

MERGE INTO PET target
USING (
    SELECT 3 pet_id, 'Haeon' pet_name,
           '/assets/images/pets/pet_haeon.webp' pet_image_url,
           10 max_level, 'Sunshine Cheer Pet' badge_name,
           '/assets/images/badges/badge_haeon.webp' badge_image_url,
           'A cheerful pet that gives warm encouragement like sunshine.' description
    FROM dual
) source
ON (target.pet_id = source.pet_id)
WHEN MATCHED THEN UPDATE SET
    target.pet_name = source.pet_name,
    target.pet_image_url = source.pet_image_url,
    target.max_level = source.max_level,
    target.badge_name = source.badge_name,
    target.badge_image_url = source.badge_image_url,
    target.description = source.description
WHEN NOT MATCHED THEN INSERT (
    pet_id, pet_name, pet_image_url, acquisition_type, max_level,
    badge_name, badge_image_url, description
) VALUES (
    source.pet_id, source.pet_name, source.pet_image_url, 'default',
    source.max_level, source.badge_name, source.badge_image_url, source.description
);

MERGE INTO PET target
USING (
    SELECT 4 pet_id, 'Nuri' pet_name,
           '/assets/images/pets/pet_nuri.webp' pet_image_url,
           10 max_level, 'Sprout Growth Pet' badge_name,
           '/assets/images/badges/badge_nuri.webp' badge_image_url,
           'A growth pet that grows with you like a fresh new sprout.' description
    FROM dual
) source
ON (target.pet_id = source.pet_id)
WHEN MATCHED THEN UPDATE SET
    target.pet_name = source.pet_name,
    target.pet_image_url = source.pet_image_url,
    target.max_level = source.max_level,
    target.badge_name = source.badge_name,
    target.badge_image_url = source.badge_image_url,
    target.description = source.description
WHEN NOT MATCHED THEN INSERT (
    pet_id, pet_name, pet_image_url, acquisition_type, max_level,
    badge_name, badge_image_url, description
) VALUES (
    source.pet_id, source.pet_name, source.pet_image_url, 'default',
    source.max_level, source.badge_name, source.badge_image_url, source.description
);

MERGE INTO PET target
USING (
    SELECT 5 pet_id, 'Aro' pet_name,
           '/assets/images/pets/pet_aro.webp' pet_image_url,
           10 max_level, 'Wave Healing Pet' badge_name,
           '/assets/images/badges/badge_aro.webp' badge_image_url,
           'A healing pet that restores your heart with gentle waves.' description
    FROM dual
) source
ON (target.pet_id = source.pet_id)
WHEN MATCHED THEN UPDATE SET
    target.pet_name = source.pet_name,
    target.pet_image_url = source.pet_image_url,
    target.max_level = source.max_level,
    target.badge_name = source.badge_name,
    target.badge_image_url = source.badge_image_url,
    target.description = source.description
WHEN NOT MATCHED THEN INSERT (
    pet_id, pet_name, pet_image_url, acquisition_type, max_level,
    badge_name, badge_image_url, description
) VALUES (
    source.pet_id, source.pet_name, source.pet_image_url, 'default',
    source.max_level, source.badge_name, source.badge_image_url, source.description
);

MERGE INTO PET target
USING (
    SELECT 6 pet_id, 'Pogeun' pet_name,
           '/assets/images/pets/pet_pogeun.webp' pet_image_url,
           10 max_level, 'Heart Wool Pet' badge_name,
           '/assets/images/badges/badge_pogeun.webp' badge_image_url,
           'A lovable pet with soft wool and a warm heart.' description
    FROM dual
) source
ON (target.pet_id = source.pet_id)
WHEN MATCHED THEN UPDATE SET
    target.pet_name = source.pet_name,
    target.pet_image_url = source.pet_image_url,
    target.max_level = source.max_level,
    target.badge_name = source.badge_name,
    target.badge_image_url = source.badge_image_url,
    target.description = source.description
WHEN NOT MATCHED THEN INSERT (
    pet_id, pet_name, pet_image_url, acquisition_type, max_level,
    badge_name, badge_image_url, description
) VALUES (
    source.pet_id, source.pet_name, source.pet_image_url, 'default',
    source.max_level, source.badge_name, source.badge_image_url, source.description
);

DELETE FROM PET
WHERE LOWER(pet_name) IN ('tori', 'mongsil', 'kongi');

COMMIT;
