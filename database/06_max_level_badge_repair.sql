-- Repairs existing max-level pets and keeps their EXP at the level-10 cap.
UPDATE CHILD_PET cp
SET current_level = (
        SELECT p.max_level
        FROM PET p
        WHERE p.pet_id = cp.pet_id
    ),
    current_exp = (
        SELECT (p.max_level - 1) * 300
        FROM PET p
        WHERE p.pet_id = cp.pet_id
    ),
    is_maxed = 'Y',
    badge_acquired = 'Y',
    badge_acquired_at = COALESCE(cp.badge_acquired_at, SYSTIMESTAMP)
WHERE cp.current_level >= (
    SELECT p.max_level
    FROM PET p
    WHERE p.pet_id = cp.pet_id
);

COMMIT;
