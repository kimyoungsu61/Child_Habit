package com.genai.mapper;

import org.apache.ibatis.annotations.Param;

import com.genai.model.Parent;

public interface ParentMapper {
    int countByEmail(String email);

    Parent findByEmail(String email);

    int insert(Parent parent);

    int updatePasswordAndName(@Param("email") String email,
            @Param("passwordHash") String passwordHash,
            @Param("name") String name);
}
