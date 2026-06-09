package com.genai.mapper;

import com.genai.model.Parent;

public interface ParentMapper {
    int countByEmail(String email);

    Parent findByEmail(String email);

    int insert(Parent parent);
}
