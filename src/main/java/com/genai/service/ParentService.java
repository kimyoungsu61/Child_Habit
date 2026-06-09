package com.genai.service;

import java.util.Locale;

import com.genai.model.Parent;
import com.genai.model.ParentDAO;

public class ParentService {
    private final ParentDAO parentDAO;
    private final PasswordHasher passwordHasher;

    public ParentService() {
        this(new ParentDAO(), new PasswordHasher());
    }

    ParentService(ParentDAO parentDAO, PasswordHasher passwordHasher) {
        this.parentDAO = parentDAO;
        this.passwordHasher = passwordHasher;
    }

    public JoinResult join(String email, String password, String name) {
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        if (parentDAO.existsByEmail(normalizedEmail)) {
            return JoinResult.DUPLICATE_EMAIL;
        }

        Parent parent = new Parent();
        parent.setEmail(normalizedEmail);
        parent.setPasswordHash(passwordHasher.hash(password));
        parent.setName(name.trim());
        parentDAO.insert(parent);
        return JoinResult.SUCCESS;
    }

    public Parent login(String email, String password) {
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        Parent parent = parentDAO.findByEmail(normalizedEmail);
        if (parent == null || !passwordHasher.matches(password, parent.getPasswordHash())) {
            return null;
        }
        parent.setPasswordHash(null);
        return parent;
    }
}
